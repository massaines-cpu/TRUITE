from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema
from .models import User
from django.contrib.auth.hashers import check_password


from .serializers import UserSerializer, LoginSerializer

from django.shortcuts import render


def login_page(request):
    return render(request, "accounts/login.html")


def register_page(request):
    return render(request, "accounts/register.html")


@extend_schema(request=UserSerializer, responses=UserSerializer)
@extend_schema(request=LoginSerializer)
@api_view(["POST"])
def register(request):
    serializer = UserSerializer(data=request.data)

    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(
    request={
        "application/json": {
            "type": "object",
            "properties": {
                "username": {"type": "string"},
                "password": {"type": "string"},
            },
            "required": ["username", "password"],
        }
    }
)


@api_view(["POST"])
def login(request):
    username = request.data.get("username")
    password_hash = request.data.get("password_hash")

    if not username or not password_hash:
        return Response(
            {"error": "username and password_hash are required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response(
            {"error": "Invalid username or password"},
            status=status.HTTP_401_UNAUTHORIZED
        )

    if not check_password(password_hash, user.password_hash):
        return Response(
            {"error": "Invalid username or password"},
            status=status.HTTP_401_UNAUTHORIZED
        )

    return Response({
        "message": "Login successful",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email
        }
    })