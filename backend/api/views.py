from uuid import uuid4
from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import ValidationError
from django.db import transaction


import django.utils.timezone as timezone

from django.http import JsonResponse, HttpResponseBadRequest
from django.utils.dateparse import parse_date
from api.utils import paginate
from django.db.models import Q

from rbac.models import RolePermission
from core.audit.models import AuditLog
from core.audit.logger import AuditLogger
from core.audit.enums import AuditAction
from rbac.services import user_has_permission
from inventory.models import Product, InventoryStock, InventoryLedger, Warehouse, InventoryOrder, InventoryIssue, GoodsReceiptNote, GoodsReceiptItem
from company.models import Supplier
from inventory.services import (
    request_order_service,
    approve_order_service,
    reject_order_service,
    bulk_stock_in_service,
    approve_issue,
    reject_issue,
    execute_issue,
    create_grn_service,
    approve_grn_service,
    reject_grn_service,
)


# Generic error response

def error(code, message, status=400):
    return Response(
        {"code": code, "message": message},
        status=status
    )


# Helper functions

def get_actor(request):
    return request.user


# =======================


@api_view(["GET", "PUT"])
@permission_classes([IsAuthenticated])
def my_profile(request):
    user = request.user
    profile = user.userprofile

    if request.method == "GET":
        return Response({
            "username": user.username,
            "role": profile.role.name if profile.role else None,
            "email": user.email,
            "full_name": user.get_full_name(),
            "company_id": str(profile.company.id) if profile.company else None,
            "company_name": profile.company.name if profile.company else None,
            "company_address": profile.company.address if profile.company else None,
            "phone_number": profile.phone_number,
        })

    if request.method == "PUT":
        user.username = request.data.get("username", user.username)
        profile.phone_number = request.data.get(
            "phone_number", profile.phone_number
        )

        user.save()
        profile.save()

        AuditLogger.log(
            entity="user_profile",
            entity_id=profile.id,
            action=AuditAction.UPDATE,
            actor=user,
            new_data={
                "username": user.username,
                "phone_number": profile.phone_number,
            },
        )

        return Response({"success": True})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_permissions(request):
    role = request.user.userprofile.role
    perms = list(
        RolePermission.objects
        .filter(role=role)
        .values_list("permission__code", flat=True)
    )
    return Response(perms)

# ================ Settings Views ==================

@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def update_company(request):
    if not user_has_permission(request.user, "company.manage"):
        return Response({"message": "Forbidden"}, status=403)

    profile = request.user.userprofile
    company = profile.company

    if not company:
        return Response({"message": "No company"}, status=400)

    company.name = request.data.get("name", company.name)
    company.address = request.data.get("address", company.address)
    company.save()

    AuditLogger.log(
        entity="company",
        entity_id=company.id,
        action=AuditAction.UPDATE,
        actor=request.user,
        new_data={
            "name": company.name,
            "address": company.address,
        },
    )

    return Response({"success": True})


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def update_my_profile(request):
    user = request.user
    profile = user.userprofile

    user.username = request.data.get("username", user.username)
    profile.phone_number = request.data.get(
        "phone_number", profile.phone_number
    )

    user.save()
    profile.save()

    AuditLogger.log(
        entity="user_profile",
        entity_id=profile.id,
        action=AuditAction.UPDATE,
        actor=user,
        new_data={
            "username": user.username,
            "phone_number": profile.phone_number,
        },
    )

    return Response({"success": True})


# ================ Inventory Views =================

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def inventory_list(request):
    if not user_has_permission(request.user, "inventory.view"):
        return Response({"message": "Forbidden"}, status=403)

    profile = request.user.userprofile
    company = profile.company

    if not company:
        return Response(
            {"message": "No active company selected"},
            status=400
        )

    qs = (
        InventoryStock.objects
        .select_related("product", "warehouse")
        .filter(
            warehouse__company=company,
        )
        .order_by("product__name")
    )

    items, meta = paginate(qs, request)

    return Response({
        "items": [
            {
                "product_id": s.product.id,
                "product_name": s.product.name,
                "warehouse_id": s.warehouse.id,
                "warehouse_name": s.warehouse.name,
                "warehouse_deleted_at": s.warehouse.deleted_at,
                "supplier_id": s.product.supplier.id if s.product.supplier else None,
                "supplier_name": s.product.supplier.name if s.product.supplier else None,
                "quantity": s.quantity,
                "unit": s.product.unit
            }
            for s in items
        ],
        "meta": meta,
    })


# ================ Product Views =================


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def product_list_create(request):
    if request.method == "GET":
        qs = Product.objects.filter(deleted_at__isnull=True).order_by("name")

        q = request.GET.get("q")
        if q:
            qs = qs.filter(
                Q(name__icontains=q) |
                Q(sku__icontains=q)
            )

        items, meta = paginate(qs, request)

        return Response({
            "items": [
                {
                    "id": p.id,
                    "name": p.name,
                    "sku": p.sku,
                    "price": str(p.price),          # 🔥 REQUIRED
                    "unit": p.unit,                 # 🔥 REQUIRED
                    "description": p.description,   # optional but useful
                }
                for p in items
            ],
            "meta": meta,
        })


    # CREATE
    if not user_has_permission(request.user, "product.manage"):
        return Response({"message": "Forbidden"}, status=403)

    p = Product.objects.create(
        company=request.user.userprofile.company,
        name=request.data["name"],
        sku=request.data.get("sku", f"PRD-{uuid4().hex[:8]}"),
        description=request.data.get("description", ""),
        price=float(request.data.get("price", 0)),
        cost_price=float(request.data.get("price", 0)),
        unit=request.data.get("unit", "pcs"),
    )

    AuditLogger.log(
        entity="product",
        entity_id=p.id,
        action=AuditAction.CREATE,
        actor=get_actor(request),
        new_data={
            "name": p.name,
            "sku": p.sku,
        },
    )

    return Response({"id": p.id, "name": p.name, "sku": p.sku}, status=201)


@api_view(["PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def product_update_delete(request, pk):
    try:
        p = Product.objects.get(id=pk, deleted_at__isnull=True)
    except Product.DoesNotExist:
        return Response(status=404)

    if not user_has_permission(request.user, "product.manage"):
        return Response({"message": "Forbidden"}, status=403)

    if request.method == "PUT":
        old = {"name": p.name, "sku": p.sku, "description": p.description}

        p.name = request.data["name"]
        p.sku = request.data["sku"]
        p.description = request.data.get("description", "")
        p.save()

        AuditLogger.log(
            entity="product",
            entity_id=p.id,
            action=AuditAction.UPDATE,
            actor=get_actor(request),
            old_data=old,
            new_data={
                "name": p.name,
                "sku": p.sku,
                "description": p.description,
            },
        )

        return Response({"message": "updated"})

    # DELETE (soft)
    p.deleted_at = timezone.now()
    p.save()

    AuditLogger.log(
        entity="product",
        entity_id=p.id,
        action=AuditAction.DELETE,
        actor=get_actor(request),
    )

    return Response({"message": "deleted"})


# ================ Warehouse Views =================

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def warehouse_list_create(request):
    profile = request.user.userprofile
    company = profile.company

    if not company:
        return Response(
            {"message": "No active company selected"},
            status=400
        )

    # --------------------
    # GET: list warehouses
    # --------------------
    if request.method == "GET":
        qs = (
            Warehouse.objects
            .filter(
                company=company,
                deleted_at__isnull=True
            )
            .order_by("name")
        )

        return Response([
            {
                "id": w.id,
                "name": w.name,
                "code": w.code,
                "location": w.location,
                "deleted_at": w.deleted_at,
            }
            for w in qs
        ])

    # --------------------
    # POST: create warehouse
    # --------------------
    if not user_has_permission(request.user, "warehouse.manage"):
        return Response({"message": "Forbidden"}, status=403)

    name = request.data.get("name")
    location = request.data.get("location")

    if not name:
        raise ValidationError("Warehouse name is required")

    w = Warehouse.objects.create(
        company=company,               # 🔥 derived, not from request
        name=name,
        location=location,
        code="WH-" + uuid4().hex[:8],
    )

    AuditLogger.log(
        entity="warehouse",
        entity_id=w.id,
        action=AuditAction.CREATE,
        actor=get_actor(request),
        new_data={
            "name": w.name,
            "code": w.code,
            "location": w.location,
            "company_id": str(company.id),
        },
    )

    return Response(
        {
            "id": w.id,
            "name": w.name,
            "code": w.code,
            "location": w.location,
        },
        status=201
    )


@api_view(["PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def warehouse_update_delete(request, pk):
    try:
        warehouse = Warehouse.objects.get(id=pk)
    except Warehouse.DoesNotExist:
        return Response(status=404)

    if not user_has_permission(request.user, "warehouse.manage"):
        return Response({"message": "Forbidden"}, status=403)

    # --------------------
    # UPDATE
    # --------------------
    if request.method == "PUT":
        if warehouse.deleted_at:
            return Response(
                {"message": "Cannot update deleted warehouse"},
                status=400
            )

        old = {
            "name": warehouse.name,
            "location": warehouse.location,
        }

        warehouse.name = request.data.get("name", warehouse.name)
        warehouse.location = request.data.get("location", warehouse.location)
        warehouse.save()

        AuditLogger.log(
            entity="warehouse",
            entity_id=warehouse.id,
            action=AuditAction.UPDATE,
            actor=get_actor(request),
            old_data=old,
            new_data={
                "name": warehouse.name,
                "location": warehouse.location,
            },
        )

        return Response({
            "id": warehouse.id,
            "name": warehouse.name,
            "location": warehouse.location,
        })

    # --------------------
    # DELETE (soft)
    # --------------------
    warehouse.deleted_at = timezone.now()
    warehouse.save(update_fields=["deleted_at"])

    AuditLogger.log(
        entity="warehouse",
        entity_id=warehouse.id,
        action=AuditAction.DELETE,
        actor=get_actor(request),
    )

    return Response({"message": "deleted"})


# ================= Supplier Views ======================

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def supplier_list_create(request):
    profile = request.user.userprofile
    company = profile.company

    if not company:
        return Response(
            {"message": "No active company selected"},
            status=400
        )

    # --------------------
    # GET: list suppliers
    # --------------------
    if request.method == "GET":
        qs = (
            Supplier.objects
            .filter(
                belongs_to=company,
                deleted_at__isnull=True
            )
            .order_by("name")
        )

        return Response([
            {
                "id": s.id,
                "name": s.name,
                "address": s.address,
                "deleted_at": s.deleted_at,
            }
            for s in qs
        ])

    # --------------------
    # POST: create supplier
    # --------------------
    if not user_has_permission(request.user, "supplier.manage"):
        return Response({"message": "Forbidden"}, status=403)

    name = request.data.get("name")
    address = request.data.get("address")

    if not name:
        raise ValidationError("Supplier name is required")

    supplier = Supplier.objects.create(
        name=name,
        address=address,
        belongs_to=company,   # 🔥 derived, never from client
    )

    AuditLogger.log(
        entity="supplier",
        entity_id=supplier.id,
        action=AuditAction.CREATE,
        actor=get_actor(request),
        new_data={
            "name": supplier.name,
            "address": address,
            "company_id": str(company.id),
        },
    )

    return Response(
        {
            "id": supplier.id,
            "name": supplier.name,
            "address": supplier.address,
        },
        status=201
    )

@api_view(["PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def supplier_update_delete(request, pk):
    try:
        supplier = Supplier.objects.get(id=pk)
    except Supplier.DoesNotExist:
        return Response(status=404)

    if not user_has_permission(request.user, "supplier.manage"):
        return Response({"message": "Forbidden"}, status=403)

    # --------------------
    # UPDATE
    # --------------------
    if request.method == "PUT":
        if supplier.deleted_at:
            return Response(
                {"message": "Cannot update deleted supplier"},
                status=400
            )

        old = {
            "name": supplier.name,
            "address": supplier.address,
        }

        supplier.name = request.data.get("name", supplier.name)
        supplier.address = request.data.get("address", supplier.address)
        supplier.save()

        AuditLogger.log(
            entity="supplier",
            entity_id=supplier.id,
            action=AuditAction.UPDATE,
            actor=get_actor(request),
            old_data=old,
            new_data={
                "name": supplier.name,
                "address": supplier.address,
            },
        )

        return Response({
            "id": supplier.id,
            "name": supplier.name,
            "address": supplier.address,
        })

    # --------------------
    # DELETE (soft)
    # --------------------
    supplier.deleted_at = timezone.now()
    supplier.save(update_fields=["deleted_at"])

    AuditLogger.log(
        entity="supplier",
        entity_id=supplier.id,
        action=AuditAction.DELETE,
        actor=get_actor(request),
    )

    return Response({"message": "deleted"})


# ================= Transfer Stock View =================

from inventory.services import transfer_stock_service

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def transfer_stock(request):
    if not user_has_permission(request.user, "inventory.transfer"):
        return Response({"message": "Forbidden"}, status=403)

    transfer_stock_service(
        actor=get_actor(request),
        product_id=request.data["product_id"],
        from_warehouse_id=request.data["from_warehouse_id"],
        to_warehouse_id=request.data["to_warehouse_id"],
        quantity=int(request.data["quantity"]),
        reason=request.data.get("reason"),
    )

    return Response({"success": True})



# ================ Audit Views =================


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def audit_list(request):
    qs = (
        AuditLog.objects
        .select_related("actor")
        .order_by("-created_at")
        .filter(
            company=request.user.userprofile.company
        )
    )

    items, meta = paginate(qs, request)

    return Response({
        "items": [
            {
                "id": a.id,
                "time": a.created_at.isoformat(),
                "entity": a.entity,
                "entity_id": a.entity_id,
                "action": a.action,
                "actor": {
                    "id": str(a.actor.id) if a.actor else None,
                    "username": a.actor.username if a.actor else "system",
                },
                "old_data": a.old_data,
                "new_data": a.new_data,
            }
            for a in items
        ],
        "meta": meta,
    })

# ================ Reports Views =================


from reports.services import get_inventory_valuation, get_low_stock_report, get_audit_report, get_order_report, get_inventory_aging_report, get_monthly_stock_report

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def stock_report(request):
    if not user_has_permission(request.user, "inventory.view"):
        return Response({"message": "Forbidden"}, status=403)

    qs = InventoryStock.objects.select_related("product", "warehouse").filter(
        warehouse__company=request.user.userprofile.company
    )

    product_id = request.GET.get("product_id")
    warehouse_id = request.GET.get("warehouse_id")

    if product_id:
        qs = qs.filter(product_id=product_id)
    if warehouse_id:
        qs = qs.filter(warehouse_id=warehouse_id)

    return Response([
        {
            "product_id": s.product.id,
            "product_name": s.product.name,
            "warehouse_id": s.warehouse.id,
            "warehouse_name": s.warehouse.name,
            "quantity": s.quantity,
            "unit": s.product.unit,
        }
        for s in qs
    ])


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def monthly_stock_report(request):
    if not user_has_permission(request.user, "inventory.view"):
        return Response({"message": "Forbidden"}, status=403)

    month = request.GET.get("month")
    if not month:
        return Response({"message": "month is required (YYYY-MM)"}, status=400)

    data = get_monthly_stock_report(
        company=request.user.userprofile.company,
        month=month,
    )

    return Response(data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def movement_report(request):
    if not user_has_permission(request.user, "inventory.view"):
        return Response({"message": "Forbidden"}, status=403)

    qs = InventoryLedger.objects.select_related("product", "warehouse").order_by("-created_at").filter(
        warehouse__company=request.user.userprofile.company,
        warehouse__deleted_at__isnull=True
    )

    start_date = request.GET.get("start_date")
    end_date = request.GET.get("end_date")
    product_id = request.GET.get("product_id")
    warehouse_id = request.GET.get("warehouse_id")

    if start_date:
        qs = qs.filter(created_at__date__gte=parse_date(start_date))
    if end_date:
        qs = qs.filter(created_at__date__lte=parse_date(end_date))
    if product_id:
        qs = qs.filter(product_id=product_id)
    if warehouse_id:
        qs = qs.filter(warehouse_id=warehouse_id)

    qs = qs[:2000]  # safety cap

    return Response([
        {
            "created_at": r.created_at,
            "product_name": r.product.name,
            "warehouse_name": r.warehouse.name,
            "change": r.change,
            "balance_after": r.balance_after,
            "reference_type": r.reference_type,
            "reference_id": r.reference_id,
        }
        for r in qs
    ])


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def inventory_valuation_report(request):
    if not user_has_permission(request.user, "inventory.view"):
        return Response({"message": "Forbidden"}, status=403)

    company = request.user.userprofile.company

    data = list(get_inventory_valuation(company))
    return Response(data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def low_stock_report(request):
    if not user_has_permission(request.user, "inventory.view"):
        return Response({"message": "Forbidden"}, status=403)

    company = request.user.userprofile.company
    threshold = int(request.GET.get("threshold", 10))

    data = list(get_low_stock_report(threshold, company))
    return Response(data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def audit_report(request):
    if not user_has_permission(request.user, "inventory.view"):
        return Response({"message": "Forbidden"}, status=403)

    filters = {
        "start_date": request.GET.get("start_date"),
        "end_date": request.GET.get("end_date"),
        "product_id": request.GET.get("product_id"),
        "warehouse_id": request.GET.get("warehouse_id"),
        "action": request.GET.get("action"),
        "company": request.user.userprofile.company,
    }

    data = get_audit_report(filters)
    return Response(data)


@api_view(["GET"])
def order_report(request):
    filters = {
        "start_date": request.GET.get("start_date"),
        "end_date": request.GET.get("end_date"),
        "status": request.GET.get("status"),
        "company": request.user.userprofile.company,
    }

    data = get_order_report(filters)
    return Response({"items": data})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def inventory_aging_report(request):
    if not user_has_permission(request.user, "inventory.view"):
        return Response({"message": "Forbidden"}, status=403)

    company = request.user.userprofile.company
    data = get_inventory_aging_report(company)
    return Response(data)



# ================ Stock View =================

from inventory.services import stock_in_service, stock_out_service

# @api_view(["POST"])
# @permission_classes([IsAuthenticated])
# def stock_in(request):
#     if not user_has_permission(request.user, "inventory.stock_in"):
#         return Response({"message": "Forbidden"}, status=403)

#     stock, ledger = stock_in_service(
#         actor=get_actor(request),
#         product_id=request.data["product_id"],
#         warehouse_id=request.data["warehouse_id"],
#         quantity=int(request.data["quantity"]),
#         reason=request.data.get("reason"),
#     )

#     return Response({"message": "ok", "stock_id": str(stock.id), "ledger_id": str(ledger.id)})


# @api_view(["POST"])
# @permission_classes([IsAuthenticated])
# def stock_in_order(request, order_id):
#     """
#     Receive an approved order: update stock, mark order as RECEIVED, and log audit.
#     """
#     if request.method != "POST":
#         return HttpResponseBadRequest("Invalid method")

#     order = get_object_or_404(
#         InventoryOrder.objects.select_related("warehouse").prefetch_related("items__product"),
#         id=order_id
#     )

#     if order.status != InventoryOrder.STATUS_APPROVED:
#         return HttpResponseBadRequest("Only approved orders can be received")

#     with transaction.atomic():
#         # Update inventory stock for each item
#         for item in order.items.all():
#             stock, created = InventoryStock.objects.select_for_update().get_or_create(
#                 product=item.product,
#                 warehouse=order.warehouse,
#                 defaults={"quantity": 0, "version": 0},
#             )
#             old_stock = {
#                 "quantity": stock.quantity,
#                 "version": stock.version,
#             }

#             stock.quantity += item.quantity
#             stock.version += 1
#             stock.save()

#             # Log ledger entry
#             from inventory.models import InventoryLedger
#             InventoryLedger.objects.create(
#                 product=item.product,
#                 warehouse=order.warehouse,
#                 change=item.quantity,
#                 balance_after=stock.quantity,
#                 reference_type="ORDER_STOCK_IN",
#                 reference_id=order.id,
#                 reason=f"Received from order {order.id}",
#                 created_by=request.user,
#             )

#             # Audit log for stock update
#             AuditLogger.log(
#                 entity="inventory_stock",
#                 entity_id=stock.id,
#                 action=AuditAction.UPDATE,
#                 actor=request.user,
#                 old_data=old_stock,
#                 new_data={"quantity": stock.quantity, "version": stock.version},
#             )

#         # Update order status
#         old_order = {
#             "status": order.status,
#             "received_by": None,
#             "received_at": None,
#         }

#         order.status = InventoryOrder.STATUS_RECEIVED
#         order.received_by = request.user
#         order.received_at = timezone.now()
#         order.save()

#         # Audit log for order status change
#         AuditLogger.log(
#             entity="inventory_order",
#             entity_id=order.id,
#             action=AuditAction.UPDATE,
#             actor=request.user,
#             old_data=old_order,
#             new_data={
#                 "status": order.status,
#                 "received_by": request.user.username,
#                 "received_at": order.received_at.isoformat(),
#             },
#         )

#     return JsonResponse({"success": True, "status": order.status})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def stock_out(request):
    if not user_has_permission(request.user, "inventory.stock_out"):
        return Response({"message": "Forbidden"}, status=403)

    product_id = request.data.get("product_id")
    warehouse_id = request.data.get("warehouse_id")
    quantity = int(request.data.get("quantity", 0))

    if not product_id or not warehouse_id or quantity <= 0:
        return Response({"message": "Invalid input"}, status=400)

    try:
        stock_out_service(
            actor=get_actor(request),
            product_id=product_id,
            warehouse_id=warehouse_id,
            quantity=quantity,
            reason=request.data.get("reason"),
        )
    except ValueError as e:
        return Response({"message": str(e)}, status=400)

    return Response({"message": "Stock removed"})



# @api_view(["POST"])
# @permission_classes([IsAuthenticated])
# def bulk_stock_in(request):
#     if not user_has_permission(request.user, "inventory.stock_in"):
#         return Response(
#             {"message": "Forbidden"},
#             status=403
#         )

#     profile = request.user.userprofile
#     company = profile.company

#     if not company:
#         return Response(
#             {"message": "No active company selected"},
#             status=400
#         )

#     warehouse_id = request.data.get("warehouse_id")
#     items = request.data.get("items", [])
#     reference = request.data.get("reference", "BARCODE_SCAN")

#     if not warehouse_id:
#         return Response(
#             {"message": "warehouse_id is required"},
#             status=400
#         )

#     try:
#         result = bulk_stock_in_service(
#             actor=get_actor(request),
#             company=company,
#             warehouse_id=warehouse_id,
#             items=items,
#             reference=reference,
#         )
#     except ValueError as e:
#         return Response(
#             {"message": str(e)},
#             status=400
#         )

#     return Response(
#         {
#             "success": True,
#             "processed": result["processed"],
#             "reference_id": result["reference_id"],
#         }
#     )

# ================= PR Views =================

from inventory.models import PurchaseRequisition, PurchaseRequisitionItem
from inventory.services import (
    create_pr_service,
    approve_pr_service,
    reject_pr_service,
)

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def pr_list_create(request):
    profile = request.user.userprofile
    company = profile.company

    if not company:
        return Response({"message": "No active company"}, status=400)

    # LIST
    if request.method == "GET":
        qs = (
            PurchaseRequisition.objects
            .select_related("warehouse", "requested_by", "approved_by")
            .filter(company=company)
            .order_by("-created_at")
        )

        return Response([
            {
                "id": pr.id,
                "warehouse_name": pr.warehouse.name,
                "status": pr.status,
                "requested_by": pr.requested_by.username,
                "approved_by": pr.approved_by.username if pr.approved_by else None,
                "created_at": pr.created_at,
                "po_exists": pr.purchase_orders.exists(),
                "po": (
                    {
                        "id": po.id,
                        "supplier": po.supplier.name,
                        "warehouse": po.warehouse.name,
                        "status": po.status,
                        "created_at": po.created_at,
                        "items": [
                            {
                                "product_name": i.product.name,
                                "unit": i.unit,
                                "quantity": i.quantity,
                                "rate": i.rate,
                                "amount": i.amount,
                            }
                            for i in po.items.all()
                        ],
                    }
                    if (po := pr.purchase_orders.first())
                    else None
                ),
                "items": [
                    {
                        "product_name": i.product.name,
                        "unit": i.unit,
                        "quantity": i.quantity,
                        "price": i.product.price,
                    }
                    for i in pr.items.all()
                ],
            }
            for pr in qs
        ])

    # CREATE
    if not user_has_permission(request.user, "inventory.pr.create"):
        return Response({"message": "Forbidden"}, status=403)

    warehouse_id = request.data.get("warehouse_id")
    items = request.data.get("items", [])

    if not warehouse_id or not items:
        return Response({"message": "warehouse_id and items required"}, status=400)

    pr = create_pr_service(
        actor=request.user,
        company=company,
        warehouse_id=warehouse_id,
        items=items,
    )

    return Response({"id": pr.id, "status": pr.status}, status=201)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def pr_approve(request, pk):
    if not user_has_permission(request.user, "inventory.pr.approve"):
        return Response({"message": "Forbidden"}, status=403)

    approve_pr_service(pr_id=pk, actor=request.user)
    return Response({"status": "APPROVED"})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def pr_reject(request, pk):
    if not user_has_permission(request.user, "inventory.pr.approve"):
        return Response({"message": "Forbidden"}, status=403)

    reject_pr_service(pr_id=pk, actor=request.user)
    return Response({"status": "REJECTED"})


# ================= PO Views =================

from inventory.services import (
    create_po_from_pr_service,
    approve_po_service,
    reject_po_service,
)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def po_list(request):
    if not user_has_permission(request.user, "inventory.po.view"):
        return Response({"message": "Forbidden"}, status=403)

    company = request.user.userprofile.company

    qs = (
        InventoryOrder.objects
        .select_related("warehouse", "supplier", "requested_by")
        .prefetch_related("items__product")
        .filter(warehouse__company=company)
        .order_by("-created_at")
    )

    return Response([
        {
            "id": po.id,
            "warehouse_name": po.warehouse.name,
            "supplier_name": po.supplier.name,
            "status": po.status,
            "created_at": po.created_at,
            "items": [
                {
                    "product_id": item.product_id,
                    "product_name": item.product.name,
                    "unit": item.unit,
                    "quantity": item.quantity,
                    "rate": item.rate,
                    "amount": item.amount,
                }
                for item in po.items.all()
            ],
            "grn_exists": po.grns.exists(),
            "grn": (
                {
                    "id": g.id,
                    "status": g.status,
                    "received_by": g.received_by.username,
                    "created_at": g.created_at,
                    "items": [
                        {
                            "product_name": gi.product.name,
                            "quantity": gi.received_quantity,
                        }
                        for gi in g.items.all()
                    ],
                }
                if (g := po.grns.first())
                else None
            ),
        }
        for po in qs
    ])


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def po_create_from_pr(request, pr_id):
    if not user_has_permission(request.user, "inventory.po.create"):
        return Response({"message": "Forbidden"}, status=403)

    supplier_id = request.data.get("supplier_id")
    if not supplier_id:
        return Response({"message": "supplier_id required"}, status=400)

    po = create_po_from_pr_service(
        pr_id=pr_id,
        supplier_id=supplier_id,
        actor=request.user,
    )

    return Response({"id": po.id, "status": po.status}, status=201)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def po_approve(request, pk):
    if not user_has_permission(request.user, "inventory.po.approve"):
        return Response({"message": "Forbidden"}, status=403)

    approve_po_service(order_id=pk, actor=request.user)
    return Response({"status": "APPROVED"})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def po_reject(request, pk):
    if not user_has_permission(request.user, "inventory.po.approve"):
        return Response({"message": "Forbidden"}, status=403)

    reject_po_service(order_id=pk, actor=request.user)
    return Response({"status": "REJECTED"})


# ================= GRN Views =================

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def grn_list_create(request):
    profile = request.user.userprofile
    company = profile.company

    if not company:
        return Response({"message": "No active company"}, status=400)

    # LIST
    if request.method == "GET":
        qs = (
            GoodsReceiptNote.objects
            .select_related("order__warehouse", "received_by")
            .filter(order__warehouse__company=company)
            .order_by("-created_at")
        )

        return Response([
            {
                "id": g.id,
                "order_id": g.order.id,
                "warehouse": g.order.warehouse.name,
                "status": g.status,
                "received_by": g.received_by.username,
                "created_at": g.created_at,
            }
            for g in qs
        ])

    # CREATE
    if not user_has_permission(request.user, "inventory.grn.create"):
        return Response({"message": "Forbidden"}, status=403)

    try:
        grn = create_grn_service(
            order_id=request.data["order_id"],
            items=request.data["items"],
            actor=request.user,
        )
    except Exception as e:
        return Response({"message": str(e)}, status=400)

    return Response({"id": grn.id, "status": grn.status}, status=201)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def grn_approve(request, pk):
    if not user_has_permission(request.user, "inventory.grn.approve"):
        return Response({"message": "Forbidden"}, status=403)

    try:
        approve_grn_service(grn_id=pk, actor=request.user)
    except Exception as e:
        return Response({"message": str(e)}, status=400)

    return Response({"status": "ACCEPTED"})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def grn_reject(request, pk):
    if not user_has_permission(request.user, "inventory.grn.approve"):
        return Response({"message": "Forbidden"}, status=403)

    try:
        reject_grn_service(
            grn_id=pk,
            actor=request.user,
            reason=request.data.get("reason"),
        )
    except Exception as e:
        return Response({"message": str(e)}, status=400)

    return Response({"status": "REJECTED"})


# ================= Issue Slip Views =================

from inventory.models import IssueSlip, IssueSlipItem
from inventory.services import (
    approve_issue_slip_service,
    reject_issue_slip_service,
    apply_issue,
)

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def issue_slip_list_create(request):
    company = request.user.userprofile.company

    # =====================
    # LIST ISSUE SLIPS
    # =====================
    if request.method == "GET":
        if not user_has_permission(request.user, "inventory.issue_slip.view"):
            return Response({"message": "Forbidden"}, status=403)

        qs = (
            IssueSlip.objects
            .select_related("warehouse", "requested_by", "approved_by")
            .prefetch_related("items__product")
            .filter(company=company)
            .order_by("-created_at")
        )

        return Response([
            {
                "id": slip.id,
                "warehouse": slip.warehouse.name,
                "status": slip.status,
                "requested_by": slip.requested_by.username,
                "approved_by": slip.approved_by.username if slip.approved_by else None,
                "created_at": slip.created_at,
                "items": [
                    {
                        "product_id": i.product_id,
                        "product_name": i.product.name,
                        "quantity": i.quantity,
                        "unit": i.product.unit,
                    }
                    for i in slip.items.all()
                ],
            }
            for slip in qs
        ])

    # =====================
    # CREATE ISSUE SLIP
    # =====================
    if not user_has_permission(request.user, "inventory.issue_slip.create"):
        return Response({"message": "Forbidden"}, status=403)

    items = request.data.get("items")
    warehouse_id = request.data.get("warehouse_id")

    if not warehouse_id or not items:
        return Response(
            {"message": "warehouse_id and items required"},
            status=400
        )

    with transaction.atomic():
        slip = IssueSlip.objects.create(
            warehouse_id=warehouse_id,
            company=company,
            requested_by=request.user,
            status=IssueSlip.STATUS_PENDING,
        )

        for i in items:
            IssueSlipItem.objects.create(
                slip=slip,
                product_id=i["product_id"],
                quantity=int(i["quantity"]),
            )
    
    AuditLogger.log(
        entity="issue_slip",
        entity_id=slip.id,
        action=AuditAction.CREATE,
        actor=request.user,
        new_data={
            "warehouse_id": str(slip.warehouse_id),
            "warehouse": slip.warehouse.name,
            "status": slip.status,
            "requested_by": request.user.username,
            "items": [
                {
                    "product_id": str(i["product_id"]),
                    "quantity": int(i["quantity"]),
                }
                for i in items
            ],
        },
    )

    return Response(
        {"id": slip.id, "status": slip.status},
        status=201
    )

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def issue_slip_approve(request, pk):
    if not user_has_permission(request.user, "inventory.issue_slip.approve"):
        return Response({"message": "Forbidden"}, status=403)

    slip = IssueSlip.objects.get(id=pk)

    if slip.status != IssueSlip.STATUS_PENDING:
        return Response({"message": "Invalid state"}, status=400)

    slip.status = IssueSlip.STATUS_APPROVED
    slip.approved_by = request.user
    slip.save(update_fields=["status", "approved_by"])

    AuditLogger.log(
        entity="issue_slip",
        entity_id=slip.id,
        action=AuditAction.UPDATE,
        actor=request.user,
    )

    return Response({"status": "APPROVED"})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def issue_slip_reject(request, pk):
    if not user_has_permission(request.user, "inventory.issue_slip.approve"):
        return Response({"message": "Forbidden"}, status=403)

    try:
        reject_issue_slip_service(
            slip_id=pk,
            actor=request.user,
            reason=request.data.get("reason"),
        )
    except Exception as e:
        return Response({"message": str(e)}, status=400)

    return Response({"status": "REJECTED"})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@transaction.atomic
def issue_slip_execute(request, pk):
    if not user_has_permission(request.user, "inventory.issue.execute"):
        return Response({"message": "Forbidden"}, status=403)

    slip = (
        IssueSlip.objects
        .select_for_update()
        .prefetch_related("items__product")
        .get(id=pk)
    )

    if slip.status != IssueSlip.STATUS_APPROVED:
        return Response(
            {"message": "Only APPROVED slips can be executed"},
            status=400
        )

    issues = []

    for item in slip.items.all():
        issue = InventoryIssue.objects.create(
            issue_slip=slip,
            product=item.product,
            warehouse=slip.warehouse,
            company=slip.company,
            quantity=item.quantity,
            issue_type=InventoryIssue.ISSUE_INTERNAL,
            requested_by=slip.requested_by,
            approved_by=request.user,
            status=InventoryIssue.STATUS_APPROVED,
            approved_at=timezone.now(),
        )

        # 🔥 ACTUAL STOCK DEDUCTION
        apply_issue(issue)

        issues.append(issue)

    # Mark slip as ISSUED
    slip.status = "ISSUED"
    slip.issued_at = timezone.now()
    slip.save()

    AuditLogger.log(
        entity="issue_slip",
        entity_id=slip.id,
        action=AuditAction.UPDATE,
        actor=request.user,
        new_data={
            "status": "ISSUED",
            "issue_count": len(issues),
        },
    )

    return Response({
        "status": "ISSUED",
        "issues": [str(i.id) for i in issues],
    })



# ================ Order Views =====================

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def order_list(request):
    if not user_has_permission(request.user, "inventory.view_orders"):
        return Response({"message": "Forbidden"}, status=403)

    profile = request.user.userprofile
    company = profile.company

    if not company:
        return Response(
            {"message": "No active company selected"},
            status=400
        )

    qs = (
        InventoryOrder.objects
        .select_related("warehouse", "requested_by", "approved_by")
        .prefetch_related("items__product")
        .filter(warehouse__company=company)
        .order_by("-created_at")
    )

    orders, meta = paginate(qs, request)

    return Response({
        "items": [
            {
                "id": str(o.id),
                "warehouse_name": o.warehouse.name,
                "supplier_name": o.supplier.name,
                "status": o.status,
                "created_at": o.created_at,
                "reason": o.reason,
                "items": [
                    {
                        "id": str(i.id),
                        "quantity": i.quantity,
                        "unit": i.unit,
                        "rate": i.rate,
                        "amount": i.amount,
                        "product": {
                            "id": str(i.product.id),
                            "name": i.product.name,
                            "sku": i.product.sku,
                            "unit": i.product.unit,
                            "price": i.product.price,
                        },
                    }
                    for i in o.items.all()
                ],
            }
            for o in orders
        ],
        "meta": meta,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def request_order(request):
    if not user_has_permission(request.user, "inventory.adjust"):
        return Response({"message": "Forbidden"}, status=403)

    warehouse_id = request.data.get("warehouse_id")
    supplier_id = request.data.get("supplier_id")
    items = request.data.get("items", [])
    reason = request.data.get("reason", "")

    if not warehouse_id or not supplier_id:
        return Response(
            {"message": "warehouse_id and supplier_id is required"},
            status=400
        )

    if not items or not isinstance(items, list):
        return Response(
            {"message": "items must be a non-empty list"},
            status=400
        )

    try:
        order = request_order_service(
            warehouse_id=warehouse_id,
            supplier_id=supplier_id,
            items=items,
            reason=reason,
            actor=get_actor(request),
        )
    except Exception as e:
        return Response(
            {"message": str(e)},
            status=400
        )

    return Response(
        {
            "id": order.id,
            "status": order.status,
        },
        status=201
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def approve_order(request, pk):
    try:
        approve_order_service(
            order_id=pk,
            actor=get_actor(request),
        )
    except Exception as e:
        return Response({"message": str(e)}, status=400)

    return Response({"status": "APPROVED"})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def reject_order(request, pk):
    try:
        reject_order_service(
            order_id=pk,
            actor=get_actor(request),
        )
    except Exception as e:
        return Response({"message": str(e)}, status=400)

    return Response({"status": "REJECTED"})


# ================ Issue Views ==========================

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def issue_create(request):
    if not user_has_permission(request.user, "inventory.issue"):
        return Response({"message": "Forbidden"}, status=403)

    profile = request.user.userprofile

    try:
        issue = InventoryIssue.objects.create(
            product_id=request.data["product_id"],
            warehouse_id=request.data["warehouse_id"],
            company=profile.company,
            quantity=int(request.data["quantity"]),
            issue_type=request.data["issue_type"],
            notes=request.data.get("notes", ""),
            requested_by=request.user,
        )
    except KeyError as e:
        return Response(
            {"message": f"Missing field: {str(e)}"},
            status=400
        )
    except ValueError:
        return Response(
            {"message": "Invalid quantity"},
            status=400
        )

    AuditLogger.log(
        entity="inventory_issue_requested",
        entity_id=issue.id,
        action=AuditAction.CREATE,
        actor=get_actor(request),
        new_data={
            "status": issue.status,
            "product_id": str(issue.product_id),
            "warehouse_id": str(issue.warehouse_id),
            "company_id": str(profile.company_id),
            "quantity": issue.quantity,
            "issue_type": issue.issue_type,
            "notes": issue.notes,
            "requested_by": request.user.username,
        },
    )

    return Response({"id": issue.id}, status=201)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def issue_list(request):
    if not user_has_permission(request.user, "inventory.issue_view"):
        return Response({"message": "Forbidden"}, status=403)

    qs = (
        InventoryIssue.objects
        .select_related("product", "warehouse", "requested_by")
        .filter(company=request.user.userprofile.company)
        .order_by("-created_at")
    )

    return Response([
        {
            "id": i.id,
            "product": i.product.name,
            "warehouse": i.warehouse.name,
            "quantity": i.quantity,
            "type": i.issue_type,
            "type_label": i.get_issue_type_display(),
            "status": i.status,
            "notes": i.notes,
            "requested_by": i.requested_by.username,
            "created_at": i.created_at,
        }
        for i in qs
    ])

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def issue_decide(request, pk):
    if not user_has_permission(request.user, "inventory.issue_approve"):
        return Response({"message": "Forbidden"}, status=403)

    issue = InventoryIssue.objects.get(id=pk)

    action = request.data["action"]

    if action == "APPROVE":
        approve_issue(issue=issue, actor=get_actor(request))
    elif action == "REJECT":
        reject_issue(issue=issue, actor=get_actor(request))
    else:
        return Response({"message": "Invalid action"}, status=400)

    return Response({"success": True})


# ================ Authentication Views =================

from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.response import Response
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CookieTokenObtainPairView(TokenObtainPairView):
    serializer_class = TokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        access = serializer.validated_data["access"]
        refresh = serializer.validated_data["refresh"]

        response = Response({"success": True})

        response.set_cookie(
            key="access_token",
            value=str(access),
            httponly=True,
            samesite="Lax",
            path="/",
        )

        response.set_cookie(
            key="refresh_token",
            value=str(refresh),
            httponly=True,
            samesite="Lax",
            path="/",
        )

        return response

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout(request):
    response = Response({"success": True})

    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")

    return response