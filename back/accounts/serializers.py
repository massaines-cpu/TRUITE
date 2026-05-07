from rest_framework import serializers
from .models import User


class UserSerializer(serializers.ModelSerializer):

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