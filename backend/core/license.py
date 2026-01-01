import requests
from django.conf import settings
from core.instance import get_instance_id

def validate_license():
    instance_id = get_instance_id()
    print("INSTANCE ID:", instance_id)

    try:
        r = requests.post(
            f"{settings.LICENSE_SERVER_URL}/validate",
            json={"instance_id": instance_id},
            timeout=3
        )
    except Exception:
        raise SystemExit("LICENSE SERVER UNREACHABLE")

    if not r.json().get("valid"):
        raise SystemExit("LICENSE INVALID")
