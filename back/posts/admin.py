from django.contrib import admin

from .models import Comment, Post


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ("id", "author", "content_preview", "created_at")
    list_filter = ("created_at",)
    search_fields = ("content", "author__username")

    def content_preview(self, obj):
        return obj.content[:80]


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ("id", "post", "author", "parent", "content_preview", "created_at")
    list_filter = ("created_at",)
    search_fields = ("content", "author__username")

    def content_preview(self, obj):
        return obj.content[:80]
