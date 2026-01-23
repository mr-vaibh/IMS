from django.core.management.base import BaseCommand
from rbac.models import Role, Permission, RolePermission

class Command(BaseCommand):
    help = "Seed roles and permissions"

    def handle(self, *args, **kwargs):
        permissions = [
            # Inventory visibility
            "inventory.view",
            "inventory.view_audit",

            # Purchase Requisition (PR)
            "inventory.pr.create",
            "inventory.pr.view",
            "inventory.pr.approve",

            # Purchase Order (PO)
            "inventory.po.create",
            "inventory.po.view",
            "inventory.po.approve",

            # Goods Receipt Note (GRN)
            "inventory.grn.create",
            "inventory.grn.view",
            "inventory.grn.approve",

            # Issue Slip (request)
            "inventory.issue_slip.create",
            "inventory.issue_slip.view",
            "inventory.issue_slip.approve",

            # Issue execution (stock deduction)
            "inventory.issue.execute",

            # Transfers
            "inventory.transfer",

            # Masters
            "product.manage",
            "warehouse.manage",
            "supplier.manage",
            "company.manage",
        ]

        perm_objs = {}
        for code in permissions:
            perm, _ = Permission.objects.get_or_create(code=code)
            perm_objs[code] = perm

        roles = {
            "Admin": permissions,

            "Manager": [
                "inventory.view",
                "inventory.view_audit",

                "inventory.pr.view",
                "inventory.pr.create",
                "inventory.pr.approve",

                "inventory.po.view",
                "inventory.po.create",
                "inventory.po.approve",

                "inventory.grn.view",
                "inventory.grn.create",
                "inventory.grn.approve",

                "inventory.issue_slip.view",
                "inventory.issue_slip.create",
                "inventory.issue_slip.approve",

                "inventory.issue.execute",

                "inventory.transfer",

                "product.manage",
                "warehouse.manage",
                "supplier.manage",
                "company.manage",
            ],
    
            "Staff-II": [
                "inventory.pr.view",
                "inventory.pr.create",
                "inventory.issue_slip.view",
                "inventory.issue_slip.create",
                "inventory.po.create",
                "inventory.po.view",
            ],

            "Gate": [
                "inventory.grn.view",
                "inventory.grn.create",
                "inventory.grn.approve",
            ],

            "Store": [
                "inventory.issue.execute",
                "inventory.issue_slip.view",
            ],

            "Staff-I": [
                "inventory.pr.view",
                "inventory.pr.create",
                "inventory.issue_slip.view",
                "inventory.issue_slip.create",
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