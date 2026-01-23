import uuid
from django.db import models
from company.models import Product, Warehouse, Company, Supplier
from django.contrib.auth.models import User
from django.conf import settings


class InventoryStock(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    warehouse = models.ForeignKey(Warehouse, on_delete=models.PROTECT)

    quantity = models.IntegerField(default=0)
    version = models.IntegerField(default=1)

    class Meta:
        unique_together = ("product", "warehouse")

class InventoryLedger(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)

    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    warehouse = models.ForeignKey(Warehouse, on_delete=models.PROTECT)

    change = models.IntegerField()  # + / -
    balance_after = models.IntegerField()

    reference_type = models.CharField(max_length=50)
    reference_id = models.UUIDField()

    reason = models.TextField(null=True, blank=True)

    created_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="inventory_ledgers",
    )

    created_at = models.DateTimeField(auto_now_add=True)


class PurchaseRequisition(models.Model):
    STATUS_DRAFT = "DRAFT"
    STATUS_PENDING = "SUBMITTED"
    STATUS_APPROVED = "APPROVED"
    STATUS_REJECTED = "REJECTED"

    STATUS_CHOICES = [
        (STATUS_DRAFT, "Draft"),
        (STATUS_PENDING, "Pending"),
        (STATUS_APPROVED, "Approved"),
        (STATUS_REJECTED, "Rejected"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    warehouse = models.ForeignKey(Warehouse, on_delete=models.PROTECT)
    company = models.ForeignKey(Company, on_delete=models.PROTECT)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_DRAFT)

    requested_by = models.ForeignKey(
        User, on_delete=models.PROTECT, related_name="purchase_requisitions"
    )
    approved_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.PROTECT
    )

    created_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"PR {self.id} - {self.status}"



class PurchaseRequisitionItem(models.Model):
    requisition = models.ForeignKey(
        PurchaseRequisition,
        related_name="items",
        on_delete=models.CASCADE,
    )

    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()
    unit = models.CharField(max_length=20)


class InventoryOrder(models.Model):
    STATUS_PENDING = "PENDING"
    STATUS_APPROVED = "APPROVED"
    STATUS_REJECTED = "REJECTED"
    STATUS_RECEIVED = "RECEIVED"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_APPROVED, "Approved"),
        (STATUS_REJECTED, "Rejected"),
        (STATUS_RECEIVED, "Received"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    pr = models.ForeignKey(
        PurchaseRequisition,
        on_delete=models.PROTECT,
        related_name="purchase_orders",
    )

    warehouse = models.ForeignKey(Warehouse, on_delete=models.PROTECT)
    supplier = models.ForeignKey(Supplier, on_delete=models.PROTECT)

    reason = models.TextField(blank=True, null=True)

    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING
    )

    requested_by = models.ForeignKey(
        User, on_delete=models.PROTECT, related_name="requested_orders"
    )
    approved_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.PROTECT, related_name="approved_orders"
    )
    received_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.PROTECT, related_name="received_orders"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    received_at = models.DateTimeField(null=True, blank=True)

class InventoryOrderItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    order = models.ForeignKey(
        "InventoryOrder",
        related_name="items",
        on_delete=models.CASCADE,
    )

    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()
    unit = models.CharField(max_length=20)

    rate = models.DecimalField(max_digits=10, decimal_places=2)
    amount = models.DecimalField(max_digits=12, decimal_places=2)

    created_at = models.DateTimeField(auto_now_add=True)


class GoodsReceiptNote(models.Model):
    STATUS_PENDING = "PENDING"
    STATUS_ACCEPTED = "ACCEPTED"
    STATUS_REJECTED = "REJECTED"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_ACCEPTED, "Accepted"),
        (STATUS_REJECTED, "Rejected"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    order = models.ForeignKey(
        InventoryOrder,
        related_name="grns",
        on_delete=models.PROTECT,
    )

    received_by = models.ForeignKey(User, on_delete=models.PROTECT)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)

    created_at = models.DateTimeField(auto_now_add=True)

class GoodsReceiptItem(models.Model):
    grn = models.ForeignKey(
        GoodsReceiptNote,
        related_name="items",
        on_delete=models.CASCADE,
    )

    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    received_quantity = models.PositiveIntegerField()


class IssueSlip(models.Model):
    STATUS_PENDING = "PENDING"
    STATUS_APPROVED = "APPROVED"
    STATUS_REJECTED = "REJECTED"
    STATUS_ISSUED = "ISSUED"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4)

    warehouse = models.ForeignKey(Warehouse, on_delete=models.PROTECT)
    company = models.ForeignKey(Company, on_delete=models.PROTECT)

    requested_by = models.ForeignKey(
        User, on_delete=models.PROTECT, related_name="requested_issue_slips",
    )

    approved_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.PROTECT, related_name="approved_issue_slips",
    )

    status = models.CharField(
        max_length=20,
        choices=[
            (STATUS_PENDING, "Pending"),
            (STATUS_APPROVED, "Approved"),
            (STATUS_REJECTED, "Rejected"),
        ],
        default=STATUS_PENDING,
    )

    purpose = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)


# inventory/models.py
class IssueSlipItem(models.Model):
    slip = models.ForeignKey(IssueSlip, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()


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

    issue_slip = models.ForeignKey(
        IssueSlip,
        on_delete=models.PROTECT,
        related_name="issues",
    )

    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    warehouse = models.ForeignKey(Warehouse, on_delete=models.PROTECT)
    company = models.ForeignKey(Company, on_delete=models.PROTECT)

    quantity = models.PositiveIntegerField()
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
