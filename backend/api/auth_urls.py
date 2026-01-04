from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from .auth import login_view, logout_view

urlpatterns = [
    path("login", login_view),
    # path("refresh", TokenRefreshView.as_view()),
    path("logout", logout_view),
]
