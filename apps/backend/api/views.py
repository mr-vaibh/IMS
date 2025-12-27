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
def my_profile(request):
    profile = request.user.userprofile

    print(profile.company.name if profile.company else "No Company")

    return Response({
        "username": request.user.username,
        "role": profile.role.name if profile.role else None,
        "email": request.user.email,
        "full_name": profile.full_name,
        "company_id": str(profile.company.id) if profile.company else None,
        "company_name": profile.company.name if profile.company else None,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_permissions(request):
    role = request.user.userprofile.role
    print("AUTH USER:", request.user, request.user.is_authenticated)
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
    p.deleted_at = timezone.now()
    p.save()

    AuditLogger.log(
        entity="product",
        entity_id=p.id,
        action=AuditAction.DELETE,
        actor_id=request.user.id,
    )

    return Response({"message": "deleted"})


# ================ Warehouse Views =================


from uuid import uuid4
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError

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
            }
            for w in qs
        ])

    # --------------------
    # POST: create warehouse
    # --------------------
    if not user_has_permission(request.user, "warehouse.manage"):
        return Response({"message": "Forbidden"}, status=403)

    name = request.data.get("name")
    if not name:
        raise ValidationError("Warehouse name is required")

    w = Warehouse.objects.create(
        company=company,               # 🔥 derived, not from request
        name=name,
        code="WH-" + uuid4().hex[:8],
    )

    AuditLogger.log(
        entity="warehouse",
        entity_id=w.id,
        action=AuditAction.CREATE,
        actor_id=request.user.id,
        new_data={
            "name": w.name,
            "code": w.code,
            "company_id": str(company.id),
        },
    )

    return Response(
        {
            "id": w.id,
            "name": w.name,
            "code": w.code,
        },
        status=201
    )


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def warehouse_delete(request, pk):
    if not user_has_permission(request.user, "warehouse.manage"):
        return Response({"message": "Forbidden"}, status=403)

    Warehouse.objects.filter(id=pk).update(deleted_at=timezone.now())

    AuditLogger.log(
        entity="warehouse",
        entity_id=pk,
        action=AuditAction.DELETE,
        actor_id=request.user.id,
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
        actor_id=request.user.id,
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
    if not user_has_permission(request.user, "inventory.stock_in"):
        return Response({"message": "Forbidden"}, status=403)

    stock, ledger = stock_in_service(
        actor_id=request.user.id,
        product_id=request.data["product_id"],
        warehouse_id=request.data["warehouse_id"],
        quantity=int(request.data["quantity"]),
        reason=request.data.get("reason"),
    )

    return Response({"message": "ok", "stock_id": str(stock.id), "ledger_id": str(ledger.id)})


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
            actor_id=request.user.id,
            product_id=product_id,
            warehouse_id=warehouse_id,
            quantity=quantity,
            reason=request.data.get("reason"),
        )
    except ValueError as e:
        return Response({"message": str(e)}, status=400)

    return Response({"message": "Stock removed"})



# ================ Authentication Views =================

from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.response import Response

class CookieTokenObtainPairView(TokenObtainPairView):
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