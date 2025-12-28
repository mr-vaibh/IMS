# users/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import UserProfile
from rbac.models import Role

@receiver(post_save, sender=User)
def create_profile(sender, instance, created, **kwargs):
    if created:
        default_role = Role.objects.get(name="Viewer")
        UserProfile.objects.create(user=instance, role=default_role)
