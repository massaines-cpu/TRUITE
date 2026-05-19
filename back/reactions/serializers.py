from rest_framework import serializers

from .models import CommentReaction, PostReaction, ReactionType


class ReactionTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReactionType
        fields = ["id", "label", "emoji", "slug", "is_active"]


class PostReactionSerializer(serializers.ModelSerializer):
    reaction_slug = serializers.CharField(source="reaction_type.slug", read_only=True)
    reaction_emoji = serializers.CharField(source="reaction_type.emoji", read_only=True)

    class Meta:
        model = PostReaction
        fields = ["id", "post", "user", "reaction_type", "reaction_slug", "reaction_emoji", "created_at"]
        read_only_fields = ["id", "user", "reaction_slug", "reaction_emoji", "created_at"]


class CommentReactionSerializer(serializers.ModelSerializer):
    reaction_slug = serializers.CharField(source="reaction_type.slug", read_only=True)
    reaction_emoji = serializers.CharField(source="reaction_type.emoji", read_only=True)

    class Meta:
        model = CommentReaction
        fields = ["id", "comment", "user", "reaction_type", "reaction_slug", "reaction_emoji", "created_at"]
        read_only_fields = ["id", "user", "reaction_slug", "reaction_emoji", "created_at"]
