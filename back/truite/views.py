from django.http import HttpResponse
from django.shortcuts import render, redirect
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import authentication_classes, permission_classes

from accounts.models import Localisation
from accounts.views import get_current_user


def home(request):
    return render(request, "posts/feed.html")


def login(request):
    return render(request, "accounts/login.html")


def register(request):
    return render(request, "accounts/register.html")


def profile(request):
    return render(request, "accounts/profile.html")


def poste_user(request):
    return render(request, "posts/create_post.html")


def list_posts(request):
    return render(request, "posts/feed.html")


def toggle_like(request, post_id):
    return HttpResponse(f"Toggle like for post {post_id}")


def logout_page(request):
    return redirect("home")

def generate_image(request):
    return HttpResponse("Génération d'image en cours...")


@api_view(["POST"])
def recup_geoloc(request):
    latitude = request.data.get("latitude")
    longitude = request.data.get("longitude")

    loc = Localisation.objects.create(
        user=request.user,
        latitude=latitude,
        longitude=longitude
    )

    return Response({
        "message": "OK",
        "id": loc.id
    })

@api_view(["POST"])
def recup_geoloc(request):
    user = get_current_user(request)

    if not user:
        return Response(
            {"error": "Authentication required"},
            status=401
        )

    latitude = request.data.get("latitude")
    longitude = request.data.get("longitude")

    loc = Localisation.objects.create(
        user=user,
        latitude=latitude,
        longitude=longitude
    )

    return Response({
        "message": "OK",
        "id": loc.id
    })