import sys
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
            timeout=3,
        )
    except Exception as e:
        print("LICENSE SERVER UNREACHABLE:", e)
        sys.exit(1)

    # --- HARD SAFETY CHECKS ---
    if r.status_code != 200:
        print("LICENSE SERVER ERROR:", r.status_code)
        sys.exit(1)

    content_type = r.headers.get("content-type", "")
    if "application/json" not in content_type:
        print("INVALID LICENSE RESPONSE (not JSON)")
        print(r.text[:200])
        sys.exit(1)

    data = r.json()

    if data.get("valid") is not True:
        print("LICENSE INVALID")
        sys.exit(1)

    print("LICENSE OK")
