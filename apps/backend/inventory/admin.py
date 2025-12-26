from django.contrib import admin
from .models import Product, Warehouse, InventoryStock, InventoryLedger

admin.site.register(Product)
admin.site.register(Warehouse)
admin.site.register(InventoryStock)
admin.site.register(InventoryLedger)
