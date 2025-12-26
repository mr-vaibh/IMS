import uuid
from django.db import models

class AuditLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    entity = models.CharField(max_length=100)
    entity_id = models.UUIDField()

    action = models.CharField(max_length=20)  # CREATE / UPDATE / DELETE

    old_data = models.JSONField(null=True, blank=True)
    new_data = models.JSONField(null=True, blank=True)

    actor_id = models.UUIDField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["entity", "entity_id"]),
            models.Index(fields=["created_at"]),
        ]
