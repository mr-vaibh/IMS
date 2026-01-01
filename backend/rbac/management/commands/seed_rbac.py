from django.core.management.base import BaseCommand
from rbac.models import Role, Permission, RolePermission

class Command(BaseCommand):
    help = "Seed roles and permissions"

    def handle(self, *args, **kwargs):
        permissions = [
            "inventory.view",
            "inventory.stock_in",
            "inventory.stock_out",
            "inventory.transfer",
            "inventory.adjust",
            "inventory.approve_adjustment",
            "inventory.view_audit",
            "inventory.view_adjustments",
            "inventory.issue",
            "inventory.issue_view",
            "inventory.issue_approve",
            "product.manage",
            "warehouse.manage",
            "supplier.manage",
        ]

        perm_objs = {}
        for code in permissions:
            perm, _ = Permission.objects.get_or_create(code=code)
            perm_objs[code] = perm

        roles = {
            "Admin": permissions,
            "Manager": [
                "inventory.view",
                "inventory.stock_in",
                "inventory.stock_out",
                "inventory.transfer",
                "inventory.adjust",
                "inventory.approve_adjustment",
                "inventory.view_audit",
                "inventory.view_adjustments",
                "inventory.issue",
                "inventory.issue_view",
                "inventory.issue_approve",
            ],
            "Staff": [
                "inventory.view",
                "inventory.stock_in",
                "inventory.stock_out",
                "inventory.adjust",
                "inventory.issue",
                "inventory.issue_view",
            ],
            "Viewer": [
                "inventory.view",
            ],
        }

        for role_name, perms in roles.items():
            role, _ = Role.objects.get_or_create(name=role_name)
            for p in perms:
                RolePermission.objects.get_or_create(
                    role=role,
                    permission=perm_objs[p]
                )

        self.stdout.write(self.style.SUCCESS("RBAC seeded successfully"))


# Usage
# python manage.py seed_rbac