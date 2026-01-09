from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import authenticate, login, logout, get_user_model
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from users.models import UserProfile


User = get_user_model()

@csrf_exempt
def login_view(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    identifier = data.get("username") or data.get("email")
    password = data.get("password")

    if not identifier or not password:
        return JsonResponse({"error": "Missing credentials"}, status=400)

    user = None

    # --- LOGIN VIA EMAIL ---
    if "@" in identifier:
        # 1️⃣ Check email on User model
        user = User.objects.filter(email__iexact=identifier).first()

        # 2️⃣ If not found, check UserProfile
        if not user:
            profile = (
                UserProfile.objects
                .select_related("user")
                .filter(email__iexact=identifier)
                .first()
            )
            if profile:
                user = profile.user

        if not user:
            return JsonResponse({"error": "Invalid credentials"}, status=401)

        username = user.username

    # --- LOGIN VIA USERNAME ---
    else:
        username = identifier

    user = authenticate(request, username=username, password=password)

    if not user:
        return JsonResponse({"error": "Invalid credentials"}, status=401)

    login(request, user)

    return JsonResponse({
        "id": user.id,
        "username": user.username,
        "email": user.email,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    logout(request)
    response = Response({"success": True})

    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")

    return response