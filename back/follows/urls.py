from django.urls import path

from .views import (
    toggle_follow,
    followers_list,
    following_list,
    follow_status,
    suggestions,
)

urlpatterns = [
    path("toggle/<int:user_id>/", toggle_follow),
    path("followers/<int:user_id>/", followers_list),
    path("following/<int:user_id>/", following_list),
    path("status/<int:user_id>/", follow_status),
    path("suggestions/", suggestions),
]