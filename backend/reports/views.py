from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from django.template.loader import render_to_string
from django.utils import timezone
from django.contrib.auth.decorators import login_required
from weasyprint import HTML

from rbac.services import user_has_permission
from django.utils.dateparse import parse_date

from .services import get_stock_report_data, get_inventory_valuation, get_low_stock_report, get_audit_report, get_order_report, get_inventory_aging_report
from .utils import get_signature_block

from inventory.models import InventoryLedger, InventoryIssue, InventoryOrder, GoodsReceiptNote, IssueSlip
from django.http import HttpResponseBadRequest


@login_required
def stock_report_pdf(request):
    rows = get_stock_report_data()

    user = request.user
    company_name = "—"

    if hasattr(user, "userprofile") and user.userprofile.company:
        company = user.userprofile.company

    context = {
        "company": company,
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
        .filter(warehouse__company=request.user.userprofile.company, warehouse__deleted_at__isnull=True)
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
        "signed_by": profile.user.get_full_name() or profile.user.username,
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
    company = request.user.userprofile.company
    rows = get_inventory_valuation(company)
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

    response = HttpResponse(pdf, content_type="application/pdf")
    response["Content-Disposition"] = "inline; filename=Inventory_Valuation_Report.pdf"

    return response


@login_required
def low_stock_report_pdf(request):
    threshold = int(request.GET.get("threshold", 100))
    company = request.user.userprofile.company
    raw_rows = get_low_stock_report(threshold, company)

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

    response = HttpResponse(pdf, content_type="application/pdf")
    response["Content-Disposition"] = "inline; filename=Low_Stock_Report.pdf"
    
    return response



@login_required
def audit_report_pdf(request):
    filters = {
        "start_date": request.GET.get("start_date"),
        "end_date": request.GET.get("end_date"),
        "product_id": request.GET.get("product_id"),
        "warehouse_id": request.GET.get("warehouse_id"),
        "action": request.GET.get("action"),
        "company": request.user.userprofile.company,
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
    response = HttpResponse(pdf, content_type="application/pdf")
    response["Content-Disposition"] = "inline; filename=Audit_Report.pdf"

    return response


@login_required
def order_report_pdf(request):
    filters = {
        "start_date": request.GET.get("start_date"),
        "end_date": request.GET.get("end_date"),
        "product_id": request.GET.get("product_id"),
        "warehouse_id": request.GET.get("warehouse_id"),
        "status": request.GET.get("status"),
        "company": request.user.userprofile.company,
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
    response["Content-Disposition"] = "inline; filename=Order_Report.pdf"

    return response


@login_required
def aging_report_pdf(request):
    company = request.user.userprofile.company
    rows = get_inventory_aging_report(company)

    profile = request.user.userprofile

    context = {
        "company": profile.company if profile.company else "—",
        "generated_at": timezone.now(),
        "rows": rows,
        "signature": get_signature_block(profile),
    }

    html = render_to_string("reports/inventory_aging_report.html", context)
    pdf = HTML(string=html).write_pdf()

    response = HttpResponse(pdf, content_type="application/pdf")
    response["Content-Disposition"] = "inline; filename=Inventory_Aging_Report.pdf"

    return response


@login_required
def purchase_order_pdf(request, pk):
    from decimal import Decimal
    from django.http import HttpResponseBadRequest
    from django.utils import timezone

    order = (
        InventoryOrder.objects
        .select_related("warehouse", "approved_by", "requested_by")
        .prefetch_related("items__product__supplier")
        .get(id=pk)
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
def issue_slip_pdf(request, pk):
    slip = get_object_or_404(
        IssueSlip.objects
        .select_related("warehouse", "requested_by", "approved_by")
        .prefetch_related("items__product"),
        id=pk,
    )

    context = {
        "slip": slip,
        "company": slip.company,
        "warehouse": slip.warehouse,
        "items": slip.items.all(),
        "requested_by": slip.requested_by,
        "approved_by": slip.approved_by,
        "generated_at": timezone.now(),
    }

    html = render_to_string("reports/issue_slip.html", context)
    pdf = HTML(string=html).write_pdf()

    response = HttpResponse(pdf, content_type="application/pdf")
    response["Content-Disposition"] = (
        f'inline; filename=Issue_Slip_{slip.id}.pdf'
    )
    return response


@login_required
def issue_pass_pdf(request, pk):
    slip = (
        IssueSlip.objects
        .select_related("warehouse", "requested_by", "approved_by")
        .prefetch_related("items__product")
        .get(id=pk)
    )

    if slip.status != IssueSlip.STATUS_ISSUED:
        return HttpResponseBadRequest("Slip not issued yet")

    context = {
        "slip": slip,
        "items": slip.items.all(),
        "generated_at": timezone.now(),
    }

    html = render_to_string("reports/issue_pass.html", context)
    pdf = HTML(string=html).write_pdf()

    return HttpResponse(pdf, content_type="application/pdf")

@login_required
def grn_pdf(request, pk):
    """
    Generate GRN PDF (Goods Receipt Note)
    """
    try:
        grn = (
            GoodsReceiptNote.objects
            .select_related(
                "order__warehouse",
                "order__supplier",
                "received_by",
            )
            .prefetch_related("items__product")
            .get(id=pk)
        )
    except GoodsReceiptNote.DoesNotExist:
        return HttpResponseBadRequest("GRN not found")

    profile = request.user.userprofile
    order = grn.order

    items = [
        {
            "name": item.product.name,
            "sku": item.product.sku,
            "qty": item.received_quantity,
            "unit": item.product.unit,
        }
        for item in grn.items.all()
    ]

    context = {
        "company": profile.company.name if profile.company else "—",
        "warehouse": order.warehouse,
        "supplier": order.supplier,
        "order": order,
        "grn": grn,
        "items": items,
        "generated_at": timezone.now(),
        "received_by": grn.received_by,
        "signature": get_signature_block(profile),
    }

    html = render_to_string("reports/grn.html", context)
    pdf = HTML(string=html).write_pdf()

    response = HttpResponse(pdf, content_type="application/pdf")
    response["Content-Disposition"] = f'inline; filename=GRN_{grn.id}.pdf'
    return response
