from rest_framework import serializers
from django.contrib.auth.hashers import make_password

from .models import User


class UserSerializer(serializers.ModelSerializer):
    password_hash = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "password_hash",
            "sex",
            "profile_pic",
            "first_name",
            "last_name",
            "birth_date",
        )

    def create(self, validated_data):
        validated_data["password_hash"] = make_password(validated_data["password_hash"])
        return User.objects.create(**validated_data)
    
class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password_hash = serializers.CharField(write_only=True)