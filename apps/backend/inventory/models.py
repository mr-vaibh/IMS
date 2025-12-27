import uuid
from django.db import models
from company.models import Product, Warehouse

class InventoryStock(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    warehouse = models.ForeignKey(Warehouse, on_delete=models.PROTECT)

    quantity = models.IntegerField()
    version = models.IntegerField(default=1)

    class Meta:
        unique_together = ("product", "warehouse")

class InventoryLedger(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    warehouse = models.ForeignKey(Warehouse, on_delete=models.PROTECT)

    change = models.IntegerField()  # + / -
    balance_after = models.IntegerField()

    reference_type = models.CharField(max_length=50)
    reference_id = models.UUIDField()

    reason = models.TextField(null=True, blank=True)

    created_by = models.UUIDField()
    created_at = models.DateTimeField(auto_now_add=True)

class InventoryAdjustment(models.Model):
    STATUS_PENDING = "PENDING"
    STATUS_APPROVED = "APPROVED"
    STATUS_REJECTED = "REJECTED"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_APPROVED, "Approved"),
        (STATUS_REJECTED, "Rejected"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    warehouse = models.ForeignKey(Warehouse, on_delete=models.PROTECT)

    delta = models.IntegerField()  # + / -
    reason = models.TextField()

    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING
    )

    requested_by = models.UUIDField()
    approved_by = models.UUIDField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    decided_at = models.DateTimeField(null=True, blank=True)
