from django.conf import settings
from django.db import models

from posts.models import Comment, Post


class ReactionType(models.Model):
    label = models.CharField(max_length=50)
    emoji = models.CharField(max_length=10)
    slug = models.SlugField(max_length=50, unique=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return f"{self.emoji} {self.label}"


class PostReaction(models.Model):
    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name="reactions"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="post_reactions"
    )
    reaction_type = models.ForeignKey(
        ReactionType,
        on_delete=models.CASCADE,
        related_name="post_reactions"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("post", "user")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.username} -> {self.reaction_type.slug} on post #{self.post_id}"


class CommentReaction(models.Model):
    comment = models.ForeignKey(
        Comment,
        on_delete=models.CASCADE,
        related_name="reactions"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="comment_reactions"
    )
    reaction_type = models.ForeignKey(
        ReactionType,
        on_delete=models.CASCADE,
        related_name="comment_reactions"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("comment", "user")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.username} -> {self.reaction_type.slug} on comment #{self.comment_id}"
