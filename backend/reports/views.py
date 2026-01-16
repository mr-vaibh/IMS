from django.http import HttpResponse
from django.template.loader import render_to_string
from django.utils import timezone
from django.contrib.auth.decorators import login_required
from weasyprint import HTML

from rbac.services import user_has_permission
from django.utils.dateparse import parse_date

from .services import get_stock_report_data, get_inventory_valuation, get_low_stock_report, get_audit_report, get_order_report
from .utils import get_signature_block

from inventory.models import InventoryLedger, InventoryIssue, InventoryOrder
from django.http import HttpResponseBadRequest


@login_required
def stock_report_pdf(request):
    rows = get_stock_report_data()

    user = request.user
    company_name = "—"

    if hasattr(user, "userprofile") and user.userprofile.company:
        company_name = user.userprofile.company.name

    context = {
        "company": company_name,
        "generated_at": timezone.now(),
        "rows": rows,
    }

    html = render_to_string(
        "reports/stock_report.html",
        context,
    )

    pdf = HTML(string=html).write_pdf()

    response = HttpResponse(pdf, content_type="application/pdf")
    response["Content-Disposition"] = "inline; filename=Current_Stock_Report.pdf"
    return response


@login_required
def movement_report_pdf(request):
    if not user_has_permission(request.user, "inventory.view"):
        return HttpResponse("Forbidden", status=403)

    qs = (
        InventoryLedger.objects
        .select_related("product", "warehouse")
        .order_by("-created_at")
    )

    # 🔁 SAME FILTERS as API
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

    qs = qs[:2000]

    profile = request.user.userprofile

    context = {
        "company": profile.company.name if profile.company else "—",
        "generated_at": timezone.now(),
        "signed_by": profile.user.get_full_name(),
        "role": profile.role.name,
        "rows": qs,
        "filters": {
            "start_date": start_date,
            "end_date": end_date,
        },
    }

    html = render_to_string(
        "reports/movement_report.html",
        context,
    )

    from weasyprint import HTML
    pdf = HTML(string=html).write_pdf()

    response = HttpResponse(pdf, content_type="application/pdf")
    response["Content-Disposition"] = (
        "inline; filename=Stock_Movement_Report.pdf"
    )
    return response


@login_required
def inventory_valuation_pdf(request):
    rows = get_inventory_valuation()
    profile = request.user.userprofile

    context = {
        "company": profile.company.name if profile.company else "—",
        "generated_at": timezone.now(),
        "rows": rows,
        "total_value": sum(r["total_value"] for r in rows),
        "signature": get_signature_block(profile),
    }

    html = render_to_string("reports/inventory_valuation.html", context)
    pdf = HTML(string=html).write_pdf()

    return HttpResponse(pdf, content_type="application/pdf")


@login_required
def low_stock_report_pdf(request):
    threshold = int(request.GET.get("threshold", 100))
    raw_rows = get_low_stock_report(threshold)

    rows = [
        {
            "product_name": r["product_name"],
            "warehouse_name": r["warehouse_name"],
            "quantity": r["quantity"],
            "reorder_level": threshold,
            "shortfall": threshold - r["quantity"],
        }
        for r in raw_rows
    ]

    profile = request.user.userprofile

    context = {
        "company": profile.company.name if profile.company else "—",
        "generated_at": timezone.now(),
        "threshold": threshold,
        "rows": rows,
        "signature": get_signature_block(profile),
    }

    html = render_to_string("reports/low_stock_report.html", context)
    pdf = HTML(string=html).write_pdf()

    return HttpResponse(pdf, content_type="application/pdf")



@login_required
def audit_report_pdf(request):
    filters = {
        "start_date": request.GET.get("start_date"),
        "end_date": request.GET.get("end_date"),
        "product_id": request.GET.get("product_id"),
        "warehouse_id": request.GET.get("warehouse_id"),
        "action": request.GET.get("action"),
    }

    rows = get_audit_report(filters)

    profile = request.user.userprofile

    context = {
        "company": profile.company.name if profile.company else "—",
        "generated_at": timezone.now(),
        "rows": rows,
        "signature": get_signature_block(profile),
        "filters": filters,
    }

    html = render_to_string(
        "reports/audit_report.html",
        context,
    )

    pdf = HTML(string=html).write_pdf()
    return HttpResponse(pdf, content_type="application/pdf")


@login_required
def order_report_pdf(request):
    filters = {
        "start_date": request.GET.get("start_date"),
        "end_date": request.GET.get("end_date"),
        "product_id": request.GET.get("product_id"),
        "warehouse_id": request.GET.get("warehouse_id"),
        "status": request.GET.get("status"),
    }

    rows = get_order_report(filters)

    profile = request.user.userprofile

    context = {
        "company": profile.company.name if profile.company else "—",
        "generated_at": timezone.now(),
        "rows": rows,
        "signature": get_signature_block(profile),
        "filters": filters,
    }

    html = render_to_string(
        "reports/order_report.html",
        context,
    )

    pdf = HTML(string=html).write_pdf()

    response = HttpResponse(pdf, content_type="application/pdf")
    response["Content-Disposition"] = "inline; filename=order_report.pdf"
    return response


@login_required
def purchase_order_pdf(request, order_id):
    from decimal import Decimal
    from django.http import HttpResponseBadRequest
    from django.utils import timezone

    order = (
        InventoryOrder.objects
        .select_related("warehouse", "approved_by", "requested_by")
        .prefetch_related("items__product__supplier")
        .get(id=order_id)
    )

    if order.status != InventoryOrder.STATUS_APPROVED and order.status != InventoryOrder.STATUS_RECEIVED:
        return HttpResponseBadRequest("PO available only for approved orders")

    profile = request.user.userprofile

    # ---- Build PO items ----
    items = []
    subtotal = Decimal("0.00")

    for item in order.items.all():
        product = item.product
        qty = Decimal(item.quantity)
        rate = product.price
        amount = (qty * rate).quantize(Decimal("0.01"))

        subtotal += amount

        items.append({
            "name": product.name,
            "description": product.description,
            "qty": qty,
            "rate": rate,
            "amount": amount,
            "unit": product.unit,
        })

    # ---- Tax calculation ----
    TAX_PERCENT = Decimal("18")
    TAX_RATE = TAX_PERCENT / Decimal("100")

    tax_amount = (subtotal * TAX_RATE).quantize(Decimal("0.01"))
    total = (subtotal + tax_amount).quantize(Decimal("0.01"))

    context = {
        "company": profile.company,
        "warehouse": order.warehouse,
        "supplier": order.supplier,
        "order": order,
        "items": items,
        "subtotal": subtotal,
        "tax_percent": int(TAX_PERCENT),
        "tax_amount": tax_amount,
        "total": total,
        "generated_at": timezone.now(),
        "signature": get_signature_block(profile),
    }

    html = render_to_string("reports/purchase_order.html", context)
    pdf = HTML(string=html).write_pdf()

    response = HttpResponse(pdf, content_type="application/pdf")
    response["Content-Disposition"] = "inline; filename=Purchase_Order.pdf"
    return response


@login_required
def issue_pass_pdf(request, issue_id):
    issue = InventoryIssue.objects.select_related(
        "product",
        "warehouse",
        "approved_by",
        "requested_by",
    ).get(id=issue_id)

    if issue.status != InventoryIssue.STATUS_APPROVED:
        return HttpResponseBadRequest("Issue not approved")

    profile = request.user.userprofile

    context = {
        "company": profile.company.name if profile.company else "—",
        "generated_at": timezone.now(),
        "issue": issue,
        "signature": get_signature_block(profile),
    }

    html = render_to_string(
        "reports/issue_pass.html",
        context,
    )

    pdf = HTML(string=html).write_pdf()
    response = HttpResponse(pdf, content_type="application/pdf")
    response["Content-Disposition"] = "inline; filename=issue_pass.pdf"

    return response

@login_required
def received_order_pdf(request, order_id):
    """
    Generate a PDF showing which user received an approved order
    and when (Stock In clicked).
    """
    try:
        order = (
            InventoryOrder.objects
            .select_related("warehouse", "received_by", "requested_by", "approved_by")
            .prefetch_related("items__product")
            .get(id=order_id)
        )
    except InventoryOrder.DoesNotExist:
        return HttpResponseBadRequest("Order not found")

    if not order.received_at or not order.received_by:
        return HttpResponseBadRequest("Order has not been received yet")

    profile = request.user.userprofile

    # Build items list for PDF
    items = [
        {
            "name": item.product.name,
            "sku": item.product.sku,
            "qty": item.quantity,
            "unit": item.unit,
            "rate": item.rate,
            "amount": item.amount,
        }
        for item in order.items.all()
    ]

    context = {
        "company": profile.company.name if profile.company else "—",
        "warehouse": order.warehouse,
        "supplier": order.supplier,
        "order": order,
        "items": items,
        "generated_at": timezone.now(),
        "received_by": order.received_by,
        "received_at": order.received_at,
        "signature": get_signature_block(profile),
    }

    html = render_to_string("reports/received_order.html", context)
    pdf = HTML(string=html).write_pdf()

    response = HttpResponse(pdf, content_type="application/pdf")
    response["Content-Disposition"] = f'inline; filename=Received_Order_{order.id}.pdf'

    return response