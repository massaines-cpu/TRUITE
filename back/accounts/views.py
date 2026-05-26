from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.hashers import check_password
from django.contrib.auth import logout
from rest_framework.parsers import MultiPartParser, FormParser
from django.core.files.base import ContentFile

import base64
import secrets
from datetime import timedelta
from django.utils import timezone

from rest_framework.decorators import api_view, parser_classes
from rest_framework.response import Response
from rest_framework import status

from drf_spectacular.utils import extend_schema

from .models import User, Content, AuthToken
from .serializers import UserSerializer, ContentSerializer, LikeSerializer


def get_current_user(request):
    auth_header = request.headers.get("Authorization")

    if not auth_header or not auth_header.startswith("Bearer "):
        return None

    token = auth_header.replace("Bearer ", "")
    token_hash = AuthToken.hash_token(token)

    try:
        auth_token = AuthToken.objects.get(token_hash=token_hash)
    except AuthToken.DoesNotExist:
        return None

    if not auth_token.is_valid():
        auth_token.delete()
        return None

    return auth_token.user

def login_page(request):
    return render(request, "accounts/login.html")


def register_page(request):
    return render(request, "accounts/register.html")


def profile_page(request):
    return render(request, "accounts/profile.html")


def home_view(request):
    return render(request, "posts/feed.html")


def generate_default_profile_avatar(user):
    if user.profile_pic and "default" not in str(user.profile_pic):
        return

    try:
        from IA.prompts import get_image_config
        from IA.services import improve_prompt, generate_image_base64

        config = get_image_config(
            image_type="profile_avatar",
            sex=user.sex,
            custom_prompt=f"avatar for username {user.username}"
        )
        prompt = improve_prompt(config["prompt"])
        image_b64 = generate_image_base64(
            prompt=prompt,
            width=config["width"],
            height=config["height"]
        )

        if not image_b64:
            return

        image_data = base64.b64decode(image_b64)
        safe_username = "".join(c for c in user.username if c.isalnum() or c in ["_", "-"])
        filename = f"profile_avatar_{safe_username}_{user.id}.png"
        user.profile_pic.save(filename, ContentFile(image_data), save=True)
    except Exception as error:
        print("Default avatar generation failed:", error)


@extend_schema(request=UserSerializer, responses=UserSerializer)
@api_view(["POST"])
@parser_classes([MultiPartParser, FormParser])
def register(request):
    serializer = UserSerializer(data=request.data)

    if serializer.is_valid():
        user = serializer.save()
        if not request.FILES.get("profile_pic"):
            generate_default_profile_avatar(user)
        return Response({"user": UserSerializer(user).data, "redirect": "/login/"}, status=status.HTTP_201_CREATED)

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

    token = secrets.token_urlsafe(40)

    AuthToken.objects.create(
        user=user,
        token_hash=AuthToken.hash_token(token),
        expires_at=timezone.now() + timedelta(days=7)
    )

    return Response({
        "message": "Login successful",
        "token": token,
        "user": UserSerializer(user).data
    })


@api_view(["GET"])
def profile(request, user_id):
    user = get_object_or_404(User, id=user_id)
    posts = Content.objects.filter(user=user)

    return Response({
        "user": UserSerializer(user).data,
        "posts": ContentSerializer(posts, many=True).data
    })


@api_view(["GET"])
def public_profile(request, username):
    user = get_object_or_404(User, username=username)
    posts = Content.objects.filter(user=user)

    return Response({
        "user": UserSerializer(user).data,
        "posts": ContentSerializer(posts, many=True).data
    })


@api_view(["POST"])
def logout_view(request):
    auth_header = request.headers.get("Authorization")

    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.replace("Bearer ", "")
        token_hash = AuthToken.hash_token(token)
        AuthToken.objects.filter(token_hash=token_hash).delete()

    return Response({
        "message": "Logout successful",
        "redirect": "/"
    })

@api_view(["GET"])
def current_user(request):
    user = get_current_user(request)

    if not user:
        return Response({"authenticated": False})

    return Response({
        "authenticated": True,
        "user": UserSerializer(user).data
    })


@extend_schema(request=ContentSerializer, responses=ContentSerializer)
@api_view(["POST"])
def poste_user(request):
    user = get_current_user(request)

    if not user:
        return Response(
            {"error": "Authentication required"},
            status=status.HTTP_401_UNAUTHORIZED
        )

    text = request.data.get("content")
    image = request.FILES.get("image")

    if not text:
        return Response(
            {"error": "content is required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    post = Content.objects.create(
        user=user,
        content=text,
        image=image
    )

    return Response(
        ContentSerializer(post).data,
        status=status.HTTP_201_CREATED
    )


@api_view(["GET"])
def list_posts(request):
    posts = Content.objects.all()

    return Response(
        ContentSerializer(posts, many=True).data,
        status=status.HTTP_200_OK
    )

@api_view(["POST"])
def toggle_like(request, post_id):
    user = get_current_user(request)

    if not user:
        return Response(
            {"error": "Authentication required"},
            status=status.HTTP_401_UNAUTHORIZED
        )

    post = get_object_or_404(Content, id=post_id)

    if user in post.likes.all():
        post.likes.remove(user)
        liked = False
    else:
        post.likes.add(user)
        liked = True

    return Response({
        "post_id": post.id,
        "liked": liked,
        "total_likes": post.likes.count()
    })


#! Modifier et supprier les posts et les profils seront implémentés plus tard avec tokens

@api_view(["PATCH"])
@parser_classes([MultiPartParser, FormParser])
def update_profile(request):
    user = get_current_user(request)

    if not user:
        return Response({"error": "Unauthorized"}, status=401)

    data = request.data

    if "username" in data:
        user.username = data["username"]

    if "email" in data:
        user.email = data["email"]

    if "sex" in data:
        user.sex = data["sex"]

    if "birth_date" in data:
        user.birth_date = data["birth_date"]

    if "first_name" in data:
        user.first_name = data["first_name"]

    if "last_name" in data:
        user.last_name = data["last_name"]

    if request.FILES.get("profile_pic"):
        user.profile_pic = request.FILES["profile_pic"]

    if request.FILES.get("banner_image"):
        user.banner_image = request.FILES["banner_image"]

    user.save()

    return Response(UserSerializer(user).data)