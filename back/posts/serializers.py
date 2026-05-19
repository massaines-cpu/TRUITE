from rest_framework import serializers

from reactions.models import ReactionType
from .models import Comment, Post

ACTIVE_REACTIONS = list(
    ReactionType.objects.filter(is_active=True)
)

class AuthorSerializerMixin(serializers.Serializer):
    author_id = serializers.IntegerField(source="author.id", read_only=True)
    author = serializers.CharField(source="author.username", read_only=True)
    author_sex = serializers.CharField(source="author.sex", read_only=True)
    author_profile_pic = serializers.ImageField(source="author.profile_pic", read_only=True)


class CommentSerializer(serializers.ModelSerializer):
    author_id = serializers.IntegerField(source="author.id", read_only=True)
    author = serializers.CharField(source="author.username", read_only=True)
    author_sex = serializers.CharField(source="author.sex", read_only=True)
    author_profile_pic = serializers.ImageField(source="author.profile_pic", read_only=True)
    reactions_summary = serializers.SerializerMethodField()
    user_reaction = serializers.SerializerMethodField()
    replies = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = [
            "id",
            "post",
            "parent",
            "author_id",
            "author",
            "author_sex",
            "author_profile_pic",
            "content",
            "reactions_summary",
            "user_reaction",
            "replies",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "post",
            "parent",
            "author_id",
            "author",
            "author_sex",
            "author_profile_pic",
            "reactions_summary",
            "user_reaction",
            "replies",
            "created_at",
        ]

    def get_reactions_summary(self, obj):
        summary = {reaction.slug: 0 for reaction in ACTIVE_REACTIONS}
        for reaction in obj.reactions.select_related("reaction_type").all():
            summary[reaction.reaction_type.slug] = summary.get(reaction.reaction_type.slug, 0) + 1
        return summary

    def get_user_reaction(self, obj):
        user = self.context.get("user")
        if not user or not user.is_authenticated:
            return None

        reaction = obj.reactions.filter(user=user).select_related("reaction_type").first()
        if not reaction:
            return None
        return reaction.reaction_type.slug

    def get_replies(self, obj):
        replies = obj.replies.select_related("author").prefetch_related("reactions__reaction_type")
        return CommentSerializer(replies, many=True, context=self.context).data


class PostSerializer(serializers.ModelSerializer):
    author_id = serializers.IntegerField(source="author.id", read_only=True)
    author = serializers.CharField(source="author.username", read_only=True)
    author_sex = serializers.CharField(source="author.sex", read_only=True)
    author_profile_pic = serializers.ImageField(source="author.profile_pic", read_only=True)
    comments = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    reactions_summary = serializers.SerializerMethodField()
    user_reaction = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            "id",
            "author_id",
            "author",
            "author_sex",
            "author_profile_pic",
            "content",
            "image",
            "comments",
            "comments_count",
            "reactions_summary",
            "user_reaction",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "author_id",
            "author",
            "author_sex",
            "author_profile_pic",
            "comments",
            "comments_count",
            "reactions_summary",
            "user_reaction",
            "created_at",
            "updated_at",
        ]

    def validate_image(self, image):
        if not image:
            raise serializers.ValidationError("Image obligatoire.")
        return image

    def get_comments(self, obj):
        comments = obj.comments.filter(parent__isnull=True).select_related("author").prefetch_related(
            "replies__author",
            "reactions__reaction_type",
            "replies__reactions__reaction_type",
        )
        return CommentSerializer(comments, many=True, context=self.context).data

    def get_comments_count(self, obj):
        return obj.comments.count()

    def get_reactions_summary(self, obj):
        summary = {reaction.slug: 0 for reaction in ACTIVE_REACTIONS}
        for reaction in obj.reactions.select_related("reaction_type").all():
            summary[reaction.reaction_type.slug] = summary.get(reaction.reaction_type.slug, 0) + 1
        return summary

    def get_user_reaction(self, obj):
        user = self.context.get("user")
        if not user or not user.is_authenticated:
            return None

        reaction = obj.reactions.filter(user=user).select_related("reaction_type").first()
        if not reaction:
            return None
        return reaction.reaction_type.slug
