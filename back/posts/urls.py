from django.urls import path

from .views import create_comment, create_reply, post_detail, posts_list_create, user_posts

urlpatterns = [
    path("", posts_list_create, name="posts_list_create"),
    path("<int:post_id>/", post_detail, name="post_detail"),
    path("user/<int:user_id>/", user_posts, name="user_posts"),
    path("<int:post_id>/comments/", create_comment, name="create_comment"),
    path("comments/<int:comment_id>/replies/", create_reply, name="create_reply"),
]
