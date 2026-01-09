import uuid
from uuid import uuid4
from django.db import transaction
from django.utils.timezone import now
from django.forms.models import model_to_dict

from core.audit.enums import AuditAction
from core.audit.logger import AuditLogger
from rbac.services import user_has_permission
from inventory.models import InventoryStock, InventoryLedger, InventoryOrder, Product, Warehouse, InventoryIssue
from users.models import UserProfile

from django.contrib.auth import get_user_model



User = get_user_model()


def _get_or_create_stock(product, warehouse):
    stock, created = InventoryStock.objects.select_for_update().get_or_create(
        product=product,
        warehouse=warehouse,
        defaults={"quantity": 0}
    )
    return stock



@transaction.atomic
def stock_in_service(
    *,
    actor,
    product_id,
    warehouse_id,
    quantity,
    reason=None,
    reference_type="STOCK_IN",
    reference_id=None,
):
    if not isinstance(actor, User):
        raise ValueError("actor must be a User instance")

    if quantity <= 0:
        raise ValueError("Quantity must be positive")
    
    if reference_id is None:
        reference_id = uuid4()

    product = Product.objects.get(id=product_id)
    warehouse = Warehouse.objects.get(id=warehouse_id)

    stock = _get_or_create_stock(product, warehouse)
    old_stock = model_to_dict(stock)

    new_quantity = stock.quantity + quantity
    stock.quantity = new_quantity
    stock.version += 1
    stock.save()

    ledger = InventoryLedger.objects.create(
        product=product,
        warehouse=warehouse,
        change=quantity,
        balance_after=new_quantity,
        reference_type=reference_type,
        reference_id=reference_id,
        reason=reason,
        created_by=actor,
    )

    AuditLogger.log(
        entity="inventory_stock",
        entity_id=stock.id,
        action=AuditAction.UPDATE,
        actor=actor,
        old_data=old_stock,
        new_data=model_to_dict(stock),
    )

    return stock, ledger



@transaction.atomic
def stock_out_service(
    *,
    actor,
    product_id,
    warehouse_id,
    quantity,
    reference_type="STOCK_OUT",
    reference_id=None,
    reason=None,
):
    if not isinstance(actor, User):
        raise ValueError("actor must be a User instance")

    if quantity <= 0:
        raise ValueError("Quantity must be positive")

    product = Product.objects.get(id=product_id)
    warehouse = Warehouse.objects.get(id=warehouse_id)

    stock = InventoryStock.objects.select_for_update().get(
        product=product,
        warehouse=warehouse
    )

    if stock.quantity < quantity:
        raise ValueError("Insufficient stock")
    if reference_id is None:
        reference_id = uuid4()

    old_stock = model_to_dict(stock)

    new_quantity = stock.quantity - quantity
    stock.quantity = new_quantity
    stock.version += 1
    stock.save()

    InventoryLedger.objects.create(
        product=product,
        warehouse=warehouse,
        change=-quantity,
        balance_after=new_quantity,
        reference_type=reference_type,
        reference_id=reference_id,
        reason=reason,
        created_by=actor,
    )

    AuditLogger.log(
        entity="inventory_stock",
        entity_id=stock.id,
        action=AuditAction.UPDATE,
        actor=actor,
        old_data=old_stock,
        new_data=model_to_dict(stock),
    )



@transaction.atomic
def bulk_stock_in_service(
    *,
    actor,
    company,
    warehouse_id,
    items,
    reference="BULK_STOCK_IN",
):
    if not isinstance(actor, User):
        raise ValueError("actor must be a User instance")

    if not items:
        raise ValueError("No items provided")

    # Lock warehouse
    try:
        warehouse = (
            Warehouse.objects
            .select_for_update()
            .get(id=warehouse_id, company=company)
        )
    except Warehouse.DoesNotExist:
        raise ValueError("Invalid warehouse for active company")

    reference_id = uuid4()

    for item in items:
        product_id = item.get("product_id")
        quantity = int(item.get("quantity", 0))

        if quantity <= 0:
            raise ValueError("Quantity must be greater than zero")

        try:
            product = Product.objects.get(
                id=product_id,
                deleted_at__isnull=True,
            )
        except Product.DoesNotExist:
            raise ValueError("Invalid product")

        # Lock or create stock row
        stock, _ = InventoryStock.objects.select_for_update().get_or_create(
            product=product,
            warehouse=warehouse,
            defaults={"quantity": 0},
        )

        old_stock = model_to_dict(stock)

        stock.quantity += quantity
        stock.version += 1
        stock.save()

        InventoryLedger.objects.create(
            product=product,
            warehouse=warehouse,
            change=quantity,
            balance_after=stock.quantity,
            reference_type=reference,
            reference_id=reference_id,
            created_by=actor,
        )

        AuditLogger.log(
            entity="inventory_stock",
            entity_id=stock.id,
            action=AuditAction.UPDATE,
            actor=actor,
            old_data=old_stock,
            new_data=model_to_dict(stock),
        )

    return {
        "processed": len(items),
        "reference_id": str(reference_id),
    }



@transaction.atomic
def transfer_stock_service(
    *,
    actor,
    product_id,
    from_warehouse_id,
    to_warehouse_id,
    quantity,
    reason=None,
):
    if not isinstance(actor, User):
        raise ValueError("actor must be a User instance")

    if quantity <= 0:
        raise ValueError("Quantity must be positive")

    if from_warehouse_id == to_warehouse_id:
        raise ValueError("Cannot transfer to same warehouse")

    product = Product.objects.get(id=product_id)
    from_wh = Warehouse.objects.get(id=from_warehouse_id)
    to_wh = Warehouse.objects.get(id=to_warehouse_id)

    # ensure same company
    if from_wh.company_id != to_wh.company_id:
        raise ValueError("Cross-company transfer not allowed")

    from_stock = _get_or_create_stock(product, from_wh)
    if from_stock.quantity < quantity:
        raise ValueError("Insufficient stock")

    to_stock = _get_or_create_stock(product, to_wh)

    # OUT
    from_stock.quantity -= quantity
    from_stock.version += 1
    from_stock.save()

    InventoryLedger.objects.create(
        product=product,
        warehouse=from_wh,
        change=-quantity,
        balance_after=from_stock.quantity,
        reference_type="TRANSFER_OUT",
        reference_id=to_stock.id,
        reason=reason,
        created_by=actor,
    )

    # IN
    to_stock.quantity += quantity
    to_stock.version += 1
    to_stock.save()

    InventoryLedger.objects.create(
        product=product,
        warehouse=to_wh,
        change=quantity,
        balance_after=to_stock.quantity,
        reference_type="TRANSFER_IN",
        reference_id=from_stock.id,
        reason=reason,
        created_by=actor,
    )

    AuditLogger.log(
        entity="inventory_transfer",
        entity_id=to_stock.id,
        action=AuditAction.UPDATE,
        actor=actor,
        old_data={"from_qty": from_stock.quantity + quantity},
        new_data={"to_qty": to_stock.quantity},
    )




@transaction.atomic
def request_order_service(
    *,
    product_id,
    warehouse_id,
    delta,
    reason,
    actor,
):
    if not isinstance(actor, User):
        raise ValueError("actor must be a User instance")

    user = User.objects.get(id=actor.id)
    if not user_has_permission(user, "inventory.adjust"):
        raise PermissionError("Not allowed")


    if delta == 0:
        raise ValueError("Delta cannot be zero")

    order = InventoryOrder.objects.create(
        product_id=product_id,
        warehouse_id=warehouse_id,
        delta=delta,
        reason=reason,
        requested_by=actor,
    )

    AuditLogger.log(
        entity="inventory_order",
        entity_id=order.id,
        action=AuditAction.CREATE,
        actor=actor,
        new_data={
            "product_id": str(product_id),
            "warehouse_id": str(warehouse_id),
            "delta": delta,
            "reason": reason,
        },
    )

    return order



@transaction.atomic
def approve_order_service(
    *,
    order_id,
    actor,
):
    if not isinstance(actor, User):
        raise ValueError("actor must be a User instance")

    user = User.objects.get(id=actor.id)

    if not user_has_permission(user, "inventory.approve_order"):
        raise PermissionError("Not allowed")

    adj = InventoryOrder.objects.select_for_update().get(id=order_id)

    if adj.status != InventoryOrder.STATUS_PENDING:
        raise ValueError("Already decided")

    product = adj.product
    warehouse = adj.warehouse

    stock, created = InventoryStock.objects.select_for_update().get_or_create(
        product=product,
        warehouse=warehouse,
        defaults={
            "quantity": 0,
            "version": 1,
        },
    )

    if adj.delta < 0 and stock.quantity < abs(adj.delta):
        raise ValueError("Insufficient stock for order")

    old_stock = model_to_dict(stock)

    stock.quantity += adj.delta
    stock.version += 1
    stock.save()

    InventoryLedger.objects.create(
        product=product,
        warehouse=warehouse,
        change=adj.delta,
        balance_after=stock.quantity,
        reference_type="ORDER",
        reference_id=adj.id,
        reason=adj.reason,
        created_by=actor,
    )

    adj.status = InventoryOrder.STATUS_APPROVED
    adj.approved_by = actor
    adj.approved_at = now()
    adj.save()

    AuditLogger.log(
        entity="inventory_stock",
        entity_id=stock.id,
        action=AuditAction.UPDATE,
        actor=actor,
        old_data=old_stock,
        new_data=model_to_dict(stock),
    )

    AuditLogger.log(
        entity="inventory_order",
        entity_id=adj.id,
        action=AuditAction.UPDATE,
        actor=actor,
        old_data={"status": "PENDING"},
        new_data={"status": "APPROVED"},
    )



@transaction.atomic
def reject_order_service(
    *,
    order_id,
    actor,
):
    if not isinstance(actor, User):
        raise ValueError("actor must be a User instance")

    user = User.objects.get(id=actor.id)
    if not user_has_permission(user, "inventory.approve_order"):
        raise PermissionError("Not allowed")

    adj = InventoryOrder.objects.select_for_update().get(id=order_id)

    if adj.status != InventoryOrder.STATUS_PENDING:
        raise ValueError("Already decided")

    adj.status = InventoryOrder.STATUS_REJECTED
    adj.approved_by = actor
    adj.approved_at = now()
    adj.save()

    AuditLogger.log(
        entity="inventory_order",
        entity_id=adj.id,
        action=AuditAction.UPDATE,
        actor=actor,
        old_data={"status": "PENDING"},
        new_data={"status": "REJECTED"},
    )


@transaction.atomic
def approve_issue(*, issue: InventoryIssue, actor):
    if not isinstance(actor, User):
        raise ValueError("actor must be a User instance")

    if issue.status != InventoryIssue.STATUS_PENDING:
        raise ValueError("Issue already processed")
    
    old_issue = {
        "status": issue.status,
        "quantity": issue.quantity,
        "product_id": str(issue.product_id),
        "warehouse_id": str(issue.warehouse_id),
        "issue_type": issue.issue_type,
        "notes": issue.notes,
    }

    stock = InventoryStock.objects.select_for_update().get(
        product=issue.product,
        warehouse=issue.warehouse,
    )

    old_stock = {
        "quantity": stock.quantity,
        "version": stock.version,
    }

    if stock.quantity < issue.quantity:
        raise ValueError("Insufficient stock")

    stock.quantity -= issue.quantity
    stock.version += 1
    stock.save()

    AuditLogger.log(
        entity="inventory_issue_created",
        entity_id=stock.id,
        action=AuditAction.CREATE,
        actor=actor,
        old_data=old_stock,
        new_data={
            "quantity": stock.quantity,
            "version": stock.version,
        },
    )

    InventoryLedger.objects.create(
        product=issue.product,
        warehouse=issue.warehouse,
        change=-issue.quantity,
        balance_after=stock.quantity,
        reference_type="ISSUE",
        reference_id=issue.id,
        reason=issue.issue_type,
        created_by=actor,
    )

    issue.status = InventoryIssue.STATUS_APPROVED
    issue.approved_by = actor
    issue.approved_at = now()
    issue.save()

    AuditLogger.log(
        entity="inventory_issue_approved",
        entity_id=issue.id,
        action=AuditAction.UPDATE,
        actor=actor,
        old_data=old_issue,
        new_data={
            "status": issue.status,
            "approved_by": actor.username,
            "approved_at": issue.approved_at.isoformat(),
        },
    )


@transaction.atomic
def reject_issue(*, issue: InventoryIssue, actor, reason=None):
    if not isinstance(actor, User):
        raise ValueError("actor must be a User instance")
    
    if issue.status != InventoryIssue.STATUS_PENDING:
        raise ValueError("Issue already processed")
    
    old_issue = {
        "status": issue.status,
        "quantity": issue.quantity,
        "product_id": str(issue.product_id),
        "warehouse_id": str(issue.warehouse_id),
        "issue_type": issue.issue_type,
        "notes": issue.notes,
    }

    issue.status = InventoryIssue.STATUS_REJECTED
    issue.rejection_reason = reason or ""
    issue.rejected_by = actor
    issue.rejected_at = now()
    issue.save()

    AuditLogger.log(
        entity="inventory_issue",
        entity_id=issue.id,
        action=AuditAction.UPDATE,
        actor=actor,
        old_data=old_issue,
        new_data={
            "status": issue.status,
            "rejection_reason": issue.rejection_reason,
            "rejected_by": actor.username,
            "rejected_at": issue.rejected_at.isoformat(),
        },
    )

    return issue
