from django.urls import path
from api import views
from company import views as company_views
from reports import views as report_views

urlpatterns = [
    # ================= Profile =================
    path("me", views.my_profile),
    path("me/permissions", views.my_permissions),

    # ================= Inventory =================
    path("inventory", views.inventory_list),
    path("inventory/stock-out", views.stock_out),
    path("inventory/transfer", views.transfer_stock),

    # ================= Purchase Requisition =================
    path("inventory/pr", views.pr_list_create),                 # GET, POST
    path("inventory/pr/<uuid:pk>/approve", views.pr_approve),   # POST
    path("inventory/pr/<uuid:pk>/reject", views.pr_reject),     # POST

    # ================= Purchase Order =================
    path("inventory/po", views.po_list),                         # GET
    path("inventory/po/from-pr/<uuid:pr_id>", views.po_create_from_pr),  # POST
    path("inventory/po/<uuid:pk>/approve", views.po_approve),   # POST
    path("inventory/po/<uuid:pk>/reject", views.po_reject),     # POST
    path("inventory/po/<uuid:pk>/pdf", report_views.purchase_order_pdf),

    # ================= GRN (Stock In) =================
    path("inventory/grn", views.grn_list_create),                # GET, POST
    path("inventory/grn/<uuid:pk>/approve", views.grn_approve), # POST
    path("inventory/grn/<uuid:pk>/reject", views.grn_reject),   # POST
    path("inventory/grn/<uuid:pk>/pdf", report_views.grn_pdf),

    # ================= Issue Slip =================
    path("inventory/issue-slips", views.issue_slip_list_create), # GET, POST
    path("inventory/issue-slips/<uuid:pk>/approve", views.issue_slip_approve),
    path("inventory/issue-slips/<uuid:pk>/reject", views.issue_slip_reject),

    # ================= Issue Execution =================
    path("inventory/issue/<uuid:pk>/execute", views.issue_slip_execute),

    # ================= Legacy Issue Views (OPTIONAL) =================
    # You may keep these temporarily for history viewing
    path("inventory/issues", views.issue_list),
    path("inventory/issues/create", views.issue_create),
    path("inventory/issues/<uuid:pk>/decide", views.issue_decide),
    path("inventory/issue-slips/<uuid:pk>/pdf", report_views.issue_slip_pdf),
    path("inventory/issues/<uuid:pk>/pass/pdf", report_views.issue_pass_pdf),

    # ================= Products =================
    path("products", views.product_list_create),
    path("products/<uuid:pk>", views.product_update_delete),

    # ================= Warehouses =================
    path("warehouses", views.warehouse_list_create),
    path("warehouses/<uuid:pk>", views.warehouse_update_delete),

    # ================= Company =================
    path("company", views.update_company),
    path("companies", company_views.company_list_create),
    path("companies/<uuid:company_id>/warehouses", company_views.company_warehouses),

    # ================= Suppliers =================
    path("suppliers", views.supplier_list_create),
    path("suppliers/<uuid:pk>", views.supplier_update_delete),

    # ================= Audit & Reports =================
    path("audit", views.audit_list),
    path("reports/monthly-stock", views.monthly_stock_report),
    path("reports/stock", views.stock_report),
    path("reports/movement", views.movement_report),
    path("reports/valuation", views.inventory_valuation_report),
    path("reports/low-stock", views.low_stock_report),
    path("reports/audit", views.audit_report),
    path("reports/orders", views.order_report),
    path("reports/aging", views.inventory_aging_report),
]
