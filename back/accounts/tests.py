from django.test import TestCase
from django.contrib.auth.hashers import check_password

from .models import User


class AccountsTests(TestCase):

    def test_create_user(self):

        user = User.objects.create(
            username="ahmad",
            email="ahmad@test.com",
            password="test123",
            sex="male",
            first_name="Ahmad",
            last_name="Alola",
        )

        self.assertEqual(user.username, "ahmad")
        self.assertEqual(user.email, "ahmad@test.com")

    def test_password_is_hashed(self):

        user = User.objects.create(
            username="robot",
            email="robot@test.com",
            password="pbkdf2_sha256$fakehash",
            sex="male",
            first_name="Robot",
            last_name="Test",
        )

        self.assertIn("pbkdf2_sha256", user.password)

    def test_default_profile_picture(self):

        user = User.objects.create(
            username="female_user",
            email="female@test.com",
            password="test123",
            sex="female",
            first_name="Anna",
            last_name="Test",
        )

        self.assertIn(
            "default-female-avatar.png",
            str(user.profile_pic)
        )