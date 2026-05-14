from django.urls import path
from .views import (
    register,
    login,
    profile,
    public_profile,
    logout_view,
    home_view,
    poste_user,
    list_posts,
    toggle_like,
    current_user
)

urlpatterns = [
    path("me/", current_user, name="api_current_user"),

    path("register/", register, name="api_register"),
    path("login/", login, name="api_login"),

    path("profile/<int:user_id>/", profile, name="api_profile"),
    path("profile/username/<str:username>/", public_profile, name="api_public_profile"),

    path("logout/", logout_view, name="logout"),
    path("", home_view, name="home"),

    path("posts/", poste_user, name="api_post_user"),
    path("posts/list/", list_posts, name="api_list_posts"),

    path("posts/<int:post_id>/like/", toggle_like, name="api_toggle_like"),
]