from .models import AuditLog
from .enums import AuditAction

class AuditLogger:
    @staticmethod
    def log(*, entity, entity_id, action, actor_id=None, old_data=None, new_data=None):
        AuditLog.objects.create(
            entity=entity,
            entity_id=entity_id,
            action=action,
            actor_id=actor_id,
            old_data=old_data,
            new_data=new_data,
        )
