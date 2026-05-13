from django.urls import path
from .views import register, login, profile, logout_view

urlpatterns = [
    path("register/", register, name="api_register"),
    path("login/", login, name="api_login"),
    path("profile/<int:user_id>/", profile, name="api_profile"),
    path("profile/moi/", profile, name="profile"),
    path("logout/", logout_view, name="logout")
]