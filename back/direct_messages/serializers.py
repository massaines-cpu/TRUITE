from rest_framework import serializers

from .models import Conversation, DirectMessage


class MessageSerializer(serializers.ModelSerializer):
    sender_id = serializers.IntegerField(source="sender.id", read_only=True)
    sender_username = serializers.CharField(source="sender.username", read_only=True)

    class Meta:
        model = DirectMessage
        fields = [
            "id",
            "conversation",
            "sender_id",
            "sender_username",
            "content",
            "is_read",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "conversation",
            "sender_id",
            "sender_username",
            "is_read",
            "created_at",
        ]


class ConversationSerializer(serializers.ModelSerializer):
    other_user = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            "id",
            "other_user",
            "last_message",
            "unread_count",
            "created_at",
            "updated_at",
        ]

    def get_other_user(self, obj):
        current_user = self.context.get("user")
        other = obj.participants.exclude(id=current_user.id).first() if current_user else None
        if not other:
            return None
        return {
            "id": other.id,
            "username": other.username,
            "first_name": other.first_name,
            "last_name": other.last_name,
            "profile_pic": other.profile_pic.url if other.profile_pic else None,
        }

    def get_last_message(self, obj):
        message = obj.messages.select_related("sender").order_by("-created_at").first()
        if not message:
            return None
        return MessageSerializer(message).data

    def get_unread_count(self, obj):
        current_user = self.context.get("user")
        if not current_user:
            return 0
        return obj.messages.exclude(sender=current_user).filter(is_read=False).count()
