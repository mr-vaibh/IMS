from django.contrib import admin
from inventory.models import (
    InventoryStock,
    InventoryLedger,
    InventoryOrder,
    InventoryOrderItem,
    InventoryIssue,
)

@admin.register(InventoryStock)
class InventoryStockAdmin(admin.ModelAdmin):
    list_display = ("product", "warehouse", "quantity", "version")
    search_fields = ("product__name", "warehouse__name")
    list_filter = ("warehouse",)
    readonly_fields = ("version",)

@admin.register(InventoryLedger)
class InventoryLedgerAdmin(admin.ModelAdmin):
    list_display = (
        "product",
        "warehouse",
        "change",
        "balance_after",
        "reference_type",
        "created_at",
    )
    list_filter = ("warehouse", "reference_type")
    search_fields = ("product__name",)
    readonly_fields = [f.name for f in InventoryLedger._meta.fields]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

class InventoryOrderItemInline(admin.TabularInline):
    model = InventoryOrderItem
    extra = 0
    readonly_fields = ("product", "quantity")
    can_delete = False

@admin.register(InventoryOrder)
class InventoryOrderAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "warehouse",
        "status",
        "requested_by",
        "approved_by",
        "approved_at",
        "created_at",
    )

    list_filter = ("status", "warehouse")
    search_fields = (
        "id",
        "warehouse__name",
        "requested_by__username",
    )

    readonly_fields = (
        "requested_by",
        "approved_by",
        "approved_at",
        "created_at",
    )

    inlines = [InventoryOrderItemInline]

@admin.register(InventoryOrderItem)
class InventoryOrderItemAdmin(admin.ModelAdmin):
    list_display = (
        "order",
        "product",
        "quantity",
    )

    list_filter = ("product",)
    search_fields = (
        "product__name",
        "order__id",
    )

@admin.register(InventoryIssue)
class InventoryIssueAdmin(admin.ModelAdmin):
    list_display = (
        "product",
        "warehouse",
        "quantity",
        "issue_type",
        "status",
        "requested_by",
        "created_at",
    )

    list_filter = ("status", "issue_type", "warehouse")
    search_fields = ("product__name", "notes")
    readonly_fields = ("created_at",)

    fieldsets = (
        ("Issue Info", {
            "fields": (
                "product",
                "warehouse",
                "quantity",
                "issue_type",
                "status",
            )
        }),
        ("Notes", {
            "fields": ("notes",),
        }),
        ("Audit", {
            "fields": ("requested_by", "approved_by", "created_at"),
        }),
    )
