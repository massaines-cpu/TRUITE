from rest_framework import serializers
from django.contrib.auth.hashers import make_password

from .models import User, Content


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "password",
            "sex",
            "profile_pic",
            "first_name",
            "last_name",
            "birth_date"
        )

class ContentSerializer(serializers.ModelSerializer):

    author = serializers.CharField(
        source="user.username",
        read_only=True
    )

    total_likes = serializers.SerializerMethodField()

    class Meta:
        model = Content

        fields = [
            'id',
            'author',
            'content',
            'image',
            'total_likes',
            'created_at'
        ]

        read_only_fields = [
            'id',
            'author',
            'total_likes',
            'created_at'
        ]

    def get_total_likes(self, obj):
        return obj.likes.count()


    def create(self, validated_data):
        validated_data["password"] = make_password(validated_data["password"])
        return User.objects.create(**validated_data)
    
class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)