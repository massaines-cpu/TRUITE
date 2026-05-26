from rest_framework import serializers

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    sender_id = serializers.IntegerField(source="sender.id", read_only=True)
    sender_username = serializers.CharField(source="sender.username", read_only=True)
    post_id = serializers.IntegerField(source="post.id", read_only=True)
    comment_id = serializers.IntegerField(source="comment.id", read_only=True)

    class Meta:
        model = Notification
        fields = [
            "id",
            "notification_type",
            "message",
            "is_read",
            "created_at",
            "sender_id",
            "sender_username",
            "post_id",
            "comment_id",
        ]
