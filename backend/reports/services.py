# backend/reports/services.py
from inventory.models import InventoryStock, InventoryLedger, InventoryOrder, InventoryOrderItem
from django.utils.dateparse import parse_date

from django.db.models import F, DecimalField, ExpressionWrapper


def get_stock_report_data():
    return (
        InventoryStock.objects
        .select_related("product", "warehouse")
        .values(
            "quantity",                       # ✅ direct field
            product_name=F("product__name"),
            warehouse_name=F("warehouse__name"),
            unit=F("product__unit"),
        )
        .order_by("product__name", "warehouse__name")
    )



def get_inventory_valuation():
    return (
        InventoryStock.objects
        .select_related("product", "warehouse")
        .values(
            "quantity",
            product_name=F("product__name"),
            warehouse_name=F("warehouse__name"),
            unit_cost=F("product__cost_price"),
            unit=F("product__unit"),
        )
        .annotate(
            total_value=ExpressionWrapper(
                F("quantity") * F("product__cost_price"),
                output_field=DecimalField(max_digits=12, decimal_places=2),
            )
        )
        .order_by("product__name")
    )

def get_low_stock_report(threshold: int = 10):
    return (
        InventoryStock.objects
        .select_related("product", "warehouse")
        .filter(quantity__lt=threshold)
        .values(
            "quantity",
            product_name=F("product__name"),
            warehouse_name=F("warehouse__name"),
            unit=F("product__unit"),
        )
        .order_by("product__name")
    )


def get_audit_report(filters: dict):
    qs = (
        InventoryLedger.objects
        .select_related("product", "warehouse", "created_by")
        .order_by("-created_at")
    )

    if filters.get("start_date"):
        qs = qs.filter(
            created_at__date__gte=parse_date(filters["start_date"])
        )

    if filters.get("end_date"):
        qs = qs.filter(
            created_at__date__lte=parse_date(filters["end_date"])
        )

    if filters.get("product_id"):
        qs = qs.filter(product_id=filters["product_id"])

    if filters.get("warehouse_id"):
        qs = qs.filter(warehouse_id=filters["warehouse_id"])

    if filters.get("action"):
        qs = qs.filter(reference_type=filters["action"])

    qs = qs[:2000]  # safety cap

    return list(
        qs.values(
            "created_at",
            "product__name",
            "warehouse__name",
            "change",
            "balance_after",
            "reference_type",
            "reference_id",
            "created_by__username",
        )
    )


from django.db.models import F

def get_order_report(filters):
    qs = (
        InventoryOrderItem.objects
        .select_related(
            "order",
            "order__warehouse",
            "order__supplier",
            "order__requested_by",
            "order__approved_by",
            "product",
        )
    )

    if filters.get("start_date"):
        qs = qs.filter(order__created_at__date__gte=filters["start_date"])

    if filters.get("end_date"):
        qs = qs.filter(order__created_at__date__lte=filters["end_date"])

    if filters.get("warehouse_id"):
        qs = qs.filter(order__warehouse_id=filters["warehouse_id"])

    if filters.get("product_id"):
        qs = qs.filter(product_id=filters["product_id"])

    if filters.get("status"):
        qs = qs.filter(order__status=filters["status"])

    return qs.annotate(
        order_created_at=F("order__created_at"),
        order_status=F("order__status"),
        warehouse_name=F("order__warehouse__name"),
        product_name=F("product__name"),
        requested_by_username=F("order__requested_by__username"),
        approved_by_username=F("order__approved_by__username"),
        delta=F("quantity") * -1,
    ).values(
        "order_created_at",
        "order_status",
        "warehouse_name",
        "product_name",
        "delta",
        "quantity",
        "unit",
        "rate",
        "amount",
        "requested_by_username",
        "approved_by_username",
    ).order_by("-order_created_at")
