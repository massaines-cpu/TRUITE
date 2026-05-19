from django.urls import path

from .views import react_to_comment, react_to_post, reaction_types

urlpatterns = [
    path("types/", reaction_types, name="reaction_types"),
    path("posts/<int:post_id>/", react_to_post, name="react_to_post"),
    path("comments/<int:comment_id>/", react_to_comment, name="react_to_comment"),
]
