from uuid import uuid4
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes

import django.utils.timezone as timezone

from django.http import JsonResponse
from django.utils.dateparse import parse_date
from api.utils import paginate
from django.db.models import Q

from rbac.models import RolePermission
from core.audit.models import AuditLog
from core.audit.logger import AuditLogger
from core.audit.enums import AuditAction
from rbac.services import user_has_permission
from inventory.models import Product, InventoryStock, InventoryLedger, Warehouse

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

# ================ Inventory Views =================

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def inventory_list(request):
    if not user_has_permission(request.user, "inventory.view"):
        return Response({"message": "Forbidden"}, status=403)

    qs = (
        InventoryStock.objects
        .select_related("product", "warehouse")
        .order_by("product__name")
    )

    items, meta = paginate(qs, request)

    return Response({
        "items": [
            {
                "product_name": s.product.name,
                "warehouse_name": s.warehouse.name,
                "quantity": s.quantity,
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
                }
                for p in items
            ],
            "meta": meta,
        })

    # CREATE
    if not user_has_permission(request.user, "product.manage"):
        return Response({"message": "Forbidden"}, status=403)

    p = Product.objects.create(
        name=request.data["name"],
        sku=request.data.get("sku", f"PRD-{uuid4().hex[:8]}"),
    )

    AuditLogger.log(
        entity="product",
        entity_id=p.id,
        action=AuditAction.CREATE,
        actor_id=request.user.id,
        new_data={
            "name": p.name,
            "sku": p.sku,
            "description": p.description,
        },
    )

    return Response({"id": p.id}, status=201)

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
            actor_id=request.user.id,
            old_data=old,
            new_data={
                "name": p.name,
                "sku": p.sku,
                "description": p.description,
            },
        )

        return Response({"message": "updated"})

    # DELETE (soft)
    p.deleted_at = now()
    p.save()

    AuditLogger.log(
        entity="product",
        entity_id=p.id,
        action=AuditAction.DELETE,
        actor_id=request.user.id,
    )

    return Response({"message": "deleted"})


# ================ Warehouse Views =================


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def warehouse_list_create(request):
    if request.method == "GET":
        qs = Warehouse.objects.filter(deleted_at__isnull=True)
        return Response([
            {"id": w.id, "name": w.name}
            for w in qs
        ])

    if not user_has_permission(request.user, "warehouse.manage"):
        return Response({"message": "Forbidden"}, status=403)

    w = Warehouse.objects.create(name=request.data["name"])
    return Response({"id": w.id}, status=201)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def warehouse_delete(request, pk):
    if not user_has_permission(request.user, "warehouse.manage"):
        return Response({"message": "Forbidden"}, status=403)

    Warehouse.objects.filter(id=pk).update(deleted_at=timezone.now())
    return Response({"message": "deleted"})



# ================ Audit Views =================


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def audit_list(request):
    if not user_has_permission(request.user, "inventory.view_audit"):
        return JsonResponse({"message": "Forbidden"}, status=403)

    logs = AuditLog.objects.order_by("-created_at")[:500]

    data = [
        {
            "id": a.id,
            "entity": a.entity,
            "entity_id": a.entity_id,
            "action": a.action,
            "actor_id": a.actor_id,
            "created_at": a.created_at,
            "old_data": a.old_data,
            "new_data": a.new_data,
        }
        for a in logs
    ]

    return JsonResponse(data, safe=False)

# ================ Reports Views =================

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def stock_report(request):
    if not user_has_permission(request.user, "inventory.view"):
        return Response({"message": "Forbidden"}, status=403)

    qs = InventoryStock.objects.select_related("product", "warehouse")

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
        }
        for s in qs
    ])



@api_view(["GET"])
@permission_classes([IsAuthenticated])
def movement_report(request):
    if not user_has_permission(request.user, "inventory.view"):
        return Response({"message": "Forbidden"}, status=403)

    qs = (
        InventoryLedger.objects
        .select_related("product", "warehouse")
        .order_by("-created_at")
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

# ================ Stock View =================

from inventory.services import stock_in_service, stock_out_service

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def stock_in(request):
    if not user_has_permission(request.user, "inventory.manage"):
        return Response({"message": "Forbidden"}, status=403)

    stock_in_service(
        actor=request.user,
        product_id=request.data["product_id"],
        warehouse_id=request.data["warehouse_id"],
        quantity=int(request.data["quantity"]),
        reason=request.data.get("reason"),
    )

    return Response({"message": "ok"})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def stock_out(request):
    if not user_has_permission(request.user, "inventory.manage"):
        return Response({"message": "Forbidden"}, status=403)

    product_id = request.data.get("product_id")
    warehouse_id = request.data.get("warehouse_id")
    quantity = int(request.data.get("quantity", 0))

    if not product_id or not warehouse_id or quantity <= 0:
        return Response({"message": "Invalid input"}, status=400)

    try:
        stock_out_service(
            actor=request.user,
            product_id=product_id,
            warehouse_id=warehouse_id,
            quantity=quantity,
            reason=request.data.get("reason"),
        )
    except ValueError as e:
        return Response({"message": str(e)}, status=400)

    return Response({"message": "Stock removed"})
