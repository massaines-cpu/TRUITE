from django.shortcuts import render, get_object_or_404
from django.contrib.auth.hashers import check_password
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema
from django.contrib.auth import logout
from django.shortcuts import redirect


from .models import User
from .serializers import UserSerializer


def login_page(request):
    return render(request, "accounts/login.html")


def register_page(request):
    return render(request, "accounts/register.html")


def profile_page(request):
    return render(request, "accounts/profile.html")


@extend_schema(request=UserSerializer, responses=UserSerializer)
@api_view(["POST"])
def register(request):
    serializer = UserSerializer(data=request.data)

    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
def login(request):
    username = request.data.get("username")
    password = request.data.get("password")

    if not username or not password:
        return Response(
            {"error": "username and password are required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response(
            {"error": "Invalid username or password"},
            status=status.HTTP_401_UNAUTHORIZED
        )

    if not check_password(password, user.password):
        return Response(
            {"error": "Invalid username or password"},
            status=status.HTTP_401_UNAUTHORIZED
        )

    return Response({
        "message": "Login successful",
        "user": UserSerializer(user).data
    })


@api_view(["GET"])
def profile(request, user_id):
    user = get_object_or_404(User, id=user_id)
    return Response(UserSerializer(user).data)


@api_view(["GET"])
def public_profile(request, username):
    user = get_object_or_404(User, username=username)
    return Response(UserSerializer(user).data)

def logout_view(request):
    logout(request)
    return redirect("login_page")