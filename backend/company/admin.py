from django.contrib import admin
from company.models import Company, Warehouse, Product, Supplier

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
    list_display = ("name", "created_by")
    search_fields = ("name",)
    exclude = ("created_by",)

    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)

@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ("name", "created_at")
    search_fields = ("name",)
    readonly_fields = ("created_at",)