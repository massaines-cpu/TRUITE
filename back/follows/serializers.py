from rest_framework import serializers
from .models import Follow


class FollowSerializer(serializers.ModelSerializer):

    follower_username = serializers.CharField(
        source="follower.username",
        read_only=True
    )

    following_username = serializers.CharField(
        source="following.username",
        read_only=True
    )

    class Meta:
        model = Follow
        fields = "__all__"