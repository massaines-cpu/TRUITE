from django.contrib import admin

from .models import CommentReaction, PostReaction, ReactionType


@admin.register(ReactionType)
class ReactionTypeAdmin(admin.ModelAdmin):
    list_display = ("id", "emoji", "label", "slug", "is_active")
    list_editable = ("is_active",)
    prepopulated_fields = {"slug": ("label",)}
    search_fields = ("label", "slug")


@admin.register(PostReaction)
class PostReactionAdmin(admin.ModelAdmin):
    list_display = ("id", "post", "user", "reaction_type", "created_at")
    list_filter = ("reaction_type", "created_at")
    search_fields = ("user__username", "post__content")


@admin.register(CommentReaction)
class CommentReactionAdmin(admin.ModelAdmin):
    list_display = ("id", "comment", "user", "reaction_type", "created_at")
    list_filter = ("reaction_type", "created_at")
    search_fields = ("user__username", "comment__content")
