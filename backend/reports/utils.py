from django.utils import timezone

AUTHORIZED_SIGNATORY_ROLES = {"admin", "manager"}


def get_signature_block(profile):
    """
    Returns a signature block dict if the user is an authorized signatory,
    otherwise returns None.
    """
    if not profile or not profile.role:
        return None

    if profile.role.name.lower() not in AUTHORIZED_SIGNATORY_ROLES:
        return None

    return {
        "signed_by": profile.user.get_full_name() or profile.user,
        "company": profile.company.name,
        "role": profile.role.name,
        "signed_at": timezone.now(),
        "statement": (
            "This report has been digitally validated by an authorized "
            "user of the Inventory Management System."
        ),
    }
