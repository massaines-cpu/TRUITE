from django.contrib import admin

from .models import Block


@admin.register(Block)
class BlockAdmin(admin.ModelAdmin):
    list_display = (
        "index",
        "group_name",
        "author_username",
        "message_id",
        "created_at_display",
        "hash",
    )

    search_fields = (
        "group_name",
        "author_username",
        "message_id",
        "message_text",
        "hash",
    )

    list_filter = (
        "group_name",
        "author_username",
    )

    readonly_fields = (
        "index",
        "timestamp",
        "previous_hash",
        "hash",
    )

    def created_at_display(self, obj):
        return obj.timestamp

    created_at_display.short_description = "timestamp"
	