from django.urls import path
from .views import register, login

urlpatterns = [
    path("register/", register, name="api_register"),
    path("login/", login),
]