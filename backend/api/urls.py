from django.urls import path
from api import views
from company import views as company_views
from reports import views as report_views

urlpatterns = [
    path("me", views.my_profile),
    path("me/permissions", views.my_permissions),

    path("inventory", views.inventory_list),
    path("inventory/stock-in", views.stock_in),
    path("inventory/stock-in/bulk", views.bulk_stock_in),
    path("inventory/stock-out", views.stock_out),
    path("inventory/transfer", views.transfer_stock),

    path("inventory/issues", views.issue_list),
    path("inventory/issues/create", views.issue_create),
    path("inventory/issues/<uuid:pk>/decide", views.issue_decide),
    path("inventory/issues/<uuid:issue_id>/pass/pdf", report_views.issue_pass_pdf),


    path("inventory/orders", views.order_list),
    path("inventory/orders/request", views.request_order),
    path("inventory/orders/<uuid:pk>/approve", views.approve_order),
    path("inventory/orders/<uuid:pk>/reject", views.reject_order),
    path("inventory/orders/<uuid:order_id>/po/pdf", report_views.purchase_order_pdf),

    
    path("products", views.product_list_create),
    path("products/<uuid:pk>", views.product_update_delete),

    path("warehouses", views.warehouse_list_create),
    path("warehouses/<uuid:pk>", views.warehouse_delete),

    path("company", views.update_company),
    path("companies", company_views.company_list_create),
    path("companies/<uuid:company_id>/warehouses", company_views.company_warehouses),

    path("suppliers", views.supplier_list_create),
    path("suppliers/<uuid:pk>", views.supplier_update_delete),

    path("audit", views.audit_list),

    path("reports/stock", views.stock_report),
    path("reports/movement", views.movement_report),
    path("reports/valuation", views.inventory_valuation_report),
    path("reports/low-stock", views.low_stock_report),
    path("reports/audit", views.audit_report),
    path("reports/orders", views.order_report),
]
