from django.urls import path

from .views import create_comment, create_reply, post_detail, posts_list_create, user_posts, update_post, delete_post


urlpatterns = [
    path("", posts_list_create, name="posts_list_create"),
    path("<int:post_id>/", post_detail, name="post_detail"),
    path("user/<int:user_id>/", user_posts, name="user_posts"),
    path("<int:post_id>/comments/", create_comment, name="create_comment"),
    path("comments/<int:comment_id>/replies/", create_reply, name="create_reply"),
    path("<int:post_id>/update/", update_post, name="update_post"),
    path("<int:post_id>/delete/", delete_post, name="delete_post"),
]
