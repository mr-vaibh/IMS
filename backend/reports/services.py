# backend/reports/services.py
from calendar import monthrange
from datetime import datetime
from django.db.models import Sum
from django.utils import timezone
from inventory.models import InventoryStock, InventoryLedger, InventoryOrder, InventoryOrderItem
from django.utils.dateparse import parse_date

from django.db.models import F, DecimalField, ExpressionWrapper


def get_stock_report_data():
    return (
        InventoryStock.objects
        .select_related("product", "warehouse")
        .filter(warehouse__deleted_at__isnull=True)
        .values(
            "quantity",
            product_name=F("product__name"),
            warehouse_name=F("warehouse__name"),
            unit=F("product__unit"),
        )
        .order_by("product__name", "warehouse__name")
    )

from inventory.models import Product, Warehouse

def get_monthly_stock_report(*, company, month):
    year, month_num = map(int, month.split("-"))
    days_in_month = monthrange(year, month_num)[1]

    start_date = datetime(year, month_num, 1, tzinfo=timezone.UTC)
    end_date = datetime(
        year, month_num, days_in_month, 23, 59, 59, tzinfo=timezone.UTC
    )

    rows = []

    # 🔹 DRIVE REPORT FROM CURRENT STOCK (SOURCE OF TRUTH)
    stocks = (
        InventoryStock.objects
        .select_related("product", "warehouse")
        .filter(warehouse__company=company, warehouse__deleted_at__isnull=True)
    )

    for stock in stocks:
        # 🔹 CURRENT BALANCE
        current_qty = stock.quantity

        # 🔹 SUM OF ALL MOVEMENTS *AFTER* MONTH START
        future_delta = (
            InventoryLedger.objects
            .filter(
                product=stock.product,
                warehouse=stock.warehouse,
                warehouse__deleted_at__isnull=True,
                created_at__gte=start_date,
            )
            .aggregate(total=Sum("change"))["total"] or 0
        )

        # 🔹 CORRECT OPENING BALANCE
        opening = current_qty - future_delta

        balance = opening
        daily = {}

        # 🔹 DAILY RUNNING BALANCE
        for day in range(1, days_in_month + 1):
            day_start = datetime(year, month_num, day, tzinfo=timezone.UTC)
            day_end = datetime(
                year, month_num, day, 23, 59, 59, tzinfo=timezone.UTC
            )

            delta = (
                InventoryLedger.objects
                .filter(
                    product=stock.product,
                    warehouse=stock.warehouse,
                    warehouse__deleted_at__isnull=True,
                    created_at__range=(day_start, day_end),
                )
                .aggregate(total=Sum("change"))["total"] or 0
            )

            balance += delta
            daily[day] = balance

        rows.append({
            "product_id": stock.product.id,
            "product_name": stock.product.name,
            "warehouse_id": stock.warehouse.id,
            "warehouse_name": stock.warehouse.name,
            "unit": stock.product.unit,
            "opening": opening,
            "daily": daily,
            "closing": balance,
        })

    return {
        "month": month,
        "days": days_in_month,
        "rows": rows,
    }


def get_inventory_valuation(company):
    return (
        InventoryStock.objects
        .select_related("product", "warehouse")
        .filter(warehouse__company=company, warehouse__deleted_at__isnull=True)
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

def get_low_stock_report(threshold: int = 10, company=None):
    return (
        InventoryStock.objects
        .select_related("product", "warehouse")
        .filter(quantity__lt=threshold, warehouse__company=company, warehouse__deleted_at__isnull=True)
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

    qs = qs.filter(warehouse__company=filters["company"])

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

    qs = qs.filter(order__warehouse__company=filters["company"])

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
        reason=F("order__reason"),
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
        "reason",
    ).order_by("-order_created_at")


def get_inventory_aging_report(company):
    today = timezone.now().date()

    stocks = (
        InventoryStock.objects
        .select_related("product", "warehouse")
        .filter(warehouse__company=company, warehouse__deleted_at__isnull=True, quantity__gt=0)
    )

    report = []

    for stock in stocks:
        last_in = (
            InventoryLedger.objects
            .filter(
                product=stock.product,
                warehouse=stock.warehouse,
                warehouse__deleted_at__isnull=True,
                change__gt=0,
            )
            .order_by("-created_at")
            .first()
        )

        if last_in:
            age_days = (today - last_in.created_at.date()).days
            last_in_date = last_in.created_at.date()
        else:
            age_days = None
            last_in_date = None

        if age_days is None:
            bucket = "UNKNOWN"
        elif age_days <= 30:
            bucket = "0–30"
        elif age_days <= 60:
            bucket = "31–60"
        elif age_days <= 90:
            bucket = "61–90"
        else:
            bucket = "90+"

        report.append({
            "product_id": stock.product.id,
            "product_name": stock.product.name,
            "warehouse": stock.warehouse.name,
            "quantity": stock.quantity,
            "last_in_date": last_in_date,
            "age_days": age_days,
            "bucket": bucket,
        })

    return report