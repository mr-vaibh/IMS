from django.urls import path
from .views import seed_rbac_view

urlpatterns = [
    path("seed-rbac/", seed_rbac_view, name="seed_rbac"),
]
