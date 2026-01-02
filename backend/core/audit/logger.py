from .models import AuditLog
from .enums import AuditAction
from django.contrib.auth.models import User

import uuid
import datetime
from decimal import Decimal

def _json_safe(value):
    if isinstance(value, uuid.UUID):
        return str(value)
    if isinstance(value, (datetime.datetime, datetime.date)):
        return value.isoformat()
    if isinstance(value, Decimal):
        return float(value)
    return value


def make_json_safe(data):
    if data is None:
        return None

    if isinstance(data, dict):
        return {k: make_json_safe(v) for k, v in data.items()}

    if isinstance(data, list):
        return [make_json_safe(v) for v in data]

    return _json_safe(data)


class AuditLogger:
    @staticmethod
    def log(
        *,
        entity,
        entity_id,
        action,
        actor,
        old_data=None,
        new_data=None,
    ):
        AuditLog.objects.create(
            entity=entity,
            entity_id=str(entity_id),
            action=action,
            actor=actor,
            old_data=make_json_safe(old_data),
            new_data=make_json_safe(new_data),
        )