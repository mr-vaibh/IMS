from django import template

register = template.Library()

@register.filter
def ref_display(row):
    """
    Builds a human-friendly reference like:
    ISSUE-01JAN-f3cd48af
    """
    ref_type = row.reference_type.replace("_", "-")
    date = row.created_at.strftime("%d%b").upper()
    short_id = str(row.reference_id)[:8]

    return f"{ref_type}_{date}_{short_id}"
