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
        "signed_by": profile.full_name,
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
    order = InventoryOrder.objects.select_related(
        "product",
        "warehouse",
        "approved_by",
        "requested_by"
    ).get(id=order_id)

    if order.status != InventoryOrder.STATUS_APPROVED:
        return HttpResponseBadRequest("Order not approved")

    profile = request.user.userprofile

    total_price = order.product.price * order.delta

    context = {
        "company": profile.company.name if profile.company else "—",
        "generated_at": timezone.now(),
        "order": order,
        "total_price": total_price,
        "signature": get_signature_block(profile),
    }

    html = render_to_string(
        "reports/purchase_order.html",
        context,
    )

    pdf = HTML(string=html).write_pdf()

    response = HttpResponse(pdf, content_type="application/pdf")
    response["Content-Disposition"] = "inline; filename=purchase_order.pdf"
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
