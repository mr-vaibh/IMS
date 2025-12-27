from django.urls import path
from api import views
from company import views as company_views

urlpatterns = [
    path("me", views.my_profile),
    path("me/permissions", views.my_permissions),

    path("inventory", views.inventory_list),
    path("inventory/stock-in", views.stock_in),
    path("inventory/stock-out", views.stock_out),
    path("inventory/transfer", views.transfer_stock),

    path("inventory/adjustments", views.adjustment_list),
    path("inventory/adjustments/request", views.request_adjustment),
    path("inventory/adjustments/<uuid:pk>/approve", views.approve_adjustment),
    path("inventory/adjustments/<uuid:pk>/reject", views.reject_adjustment),
    
    path("products", views.product_list_create),
    path("products/<uuid:pk>", views.product_update_delete),

    path("warehouses", views.warehouse_list_create),
    path("warehouses/<uuid:pk>", views.warehouse_delete),

    path("companies", company_views.company_list_create),
    path("companies/<uuid:company_id>/warehouses", company_views.company_warehouses),

    path("audit", views.audit_list),

    path("reports/stock", views.stock_report),
    path("reports/movement", views.movement_report),
]
