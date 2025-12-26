from rbac.models import RolePermission
from django.contrib.auth.models import User


def user_has_permission(user: User, permission_code: str) -> bool:
    """
    Check if a user has a specific permission via their role.

    Rules:
    - User must have a UserProfile
    - UserProfile must have a role
    - Role must be linked to the permission
    """

    if user is None or not user.is_authenticated:
        return False

    # UserProfile is where role lives
    if not hasattr(user, "userprofile"):
        return False

    role = user.userprofile.role
    if role is None:
        return False

    return RolePermission.objects.filter(
        role=role,
        permission__code=permission_code
    ).exists()
