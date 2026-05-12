from rest_framework import serializers

from .models import Block


class BlockSerializer(serializers.ModelSerializer):

    class Meta:
        model = Block

        fields = [
            "id",
            "index",
            "timestamp",
            "group_name",
            "author_username",
            "message_id",
            "message_text",
            "image_url",
            "image_hash",
            "previous_hash",
            "hash",
        ]

        read_only_fields = [
            "id",
            "index",
            "timestamp",
            "previous_hash",
            "hash",
        ]