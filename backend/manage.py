#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys
from pathlib import Path
import json
import hashlib
import hmac
import uuid
from datetime import datetime, timezone
import threading
import time
from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

# ------------------------
# LICENSE CONFIGURATION
# ------------------------
_SECRET = "Allorasoft Pvt. Ltd."  # same as used to generate licenses
_LICENSE_PATH = Path(__file__).parent / "license.lic"
_CHECK_INTERVAL = 60  # seconds, how often to ping


def _machine_id():
    return os.getenv("LICENSE_MACHINE_ID") or hex(uuid.getnode()).lower()

def _fail(reason):
    raise RuntimeError(f"LICENSE ERROR: {reason}")

def validate_license():
    path = _LICENSE_PATH
    if not path.exists():
        _fail("License file missing")

    try:
        data = json.loads(path.read_text())
    except Exception:
        _fail("License file corrupted")

    for key in ("machine_id", "expiry", "signature"):
        if key not in data:
            _fail("License tampered")

    if data["machine_id"].lower() != _machine_id():
        _fail("License not valid for this machine")

    try:
        expiry = datetime.strptime(data["expiry"], "%Y-%m-%d").replace(tzinfo=timezone.utc)
    except ValueError:
        _fail("Invalid expiry format")

    if datetime.now(timezone.utc) > expiry:
        _fail("License expired")

    payload = f"{data['machine_id']}|{data['expiry']}|{_SECRET}"
    expected = hashlib.sha256(payload.encode()).hexdigest()

    if not hmac.compare_digest(expected, data["signature"]):
        _fail("License signature invalid")

# ------------------------
# BACKGROUND MONITOR
# ------------------------
def start_license_monitor(interval=_CHECK_INTERVAL):
    def monitor():
        while True:
            try:
                validate_license()
            except Exception as e:
                _fail(str(e))
            time.sleep(interval)
    thread = threading.Thread(target=monitor, daemon=True)
    thread.start()

# Run initial check immediately
validate_license()
# Start background ping
start_license_monitor()

# ------------------------
# ORIGINAL MANAGE.PY
# ------------------------
def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
