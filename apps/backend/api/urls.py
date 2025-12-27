from django.urls import path
from api import views

urlpatterns = [
    path("me/permissions", views.my_permissions),

    path("inventory", views.inventory_list),
    path("inventory/stock-in", views.stock_in),
    path("inventory/stock-out", views.stock_out),
    path("inventory/transfer", views.transfer_stock),
    
    path("products", views.product_list_create),
    path("products/<uuid:pk>", views.product_update_delete),

    path("warehouses", views.warehouse_list_create),
    path("warehouses/<uuid:pk>", views.warehouse_delete),


    path("audit", views.audit_list),

    path("reports/stock", views.stock_report),
    path("reports/movement", views.movement_report),
]
