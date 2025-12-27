from django.contrib import admin
from company.models import Company, Warehouse, Product

# Register your models here.


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "sku", "created_at")
    search_fields = ("name", "sku")
    readonly_fields = ("created_at",)


@admin.register(Warehouse)
class WarehouseAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "created_at")
    search_fields = ("name", "code")
    readonly_fields = ("created_at",)

@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ("name",)
    search_fields = ("name",)