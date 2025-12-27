from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from .views import CookieTokenObtainPairView

urlpatterns = [
    path("login", CookieTokenObtainPairView.as_view()),
    path("refresh", TokenRefreshView.as_view()),
]
