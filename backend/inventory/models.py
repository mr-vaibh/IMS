import uuid
from django.db import models
from company.models import Product, Warehouse, Company
from django.contrib.auth.models import User


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
    approved_at = models.DateTimeField(null=True, blank=True)


class InventoryIssue(models.Model):
    STATUS_PENDING = "PENDING"
    STATUS_APPROVED = "APPROVED"
    STATUS_REJECTED = "REJECTED"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_APPROVED, "Approved"),
        (STATUS_REJECTED, "Rejected"),
    ]

    ISSUE_PRODUCTION = "PRODUCTION"
    ISSUE_INTERNAL = "INTERNAL"
    ISSUE_MARKETING = "MARKETING"
    ISSUE_LOSS = "LOSS"
    ISSUE_SAMPLE = "SAMPLE"
    ISSUE_OTHER = "OTHER"

    ISSUE_TYPE_CHOICES = [
        (ISSUE_PRODUCTION, "Production"),
        (ISSUE_INTERNAL, "Internal Use"),
        (ISSUE_MARKETING, "Marketing"),
        (ISSUE_LOSS, "Loss / Damage"),
        (ISSUE_SAMPLE, "Sample"),
        (ISSUE_OTHER, "Other"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    warehouse = models.ForeignKey(Warehouse, on_delete=models.PROTECT)
    company = models.ForeignKey(Company, on_delete=models.PROTECT)

    quantity = models.IntegerField()
    issue_type = models.CharField(max_length=20, choices=ISSUE_TYPE_CHOICES)
    notes = models.TextField(blank=True)

    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING
    )

    requested_by = models.ForeignKey(
        User, on_delete=models.PROTECT, related_name="requested_issues"
    )
    approved_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.PROTECT,
        related_name="approved_issues"
    )
    rejected_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.PROTECT,
        related_name="rejected_issues",
    )

    rejection_reason = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    rejected_at = models.DateTimeField(null=True, blank=True)
