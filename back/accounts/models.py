from django.db import models


class User(models.Model):
    username = models.CharField(max_length=100, unique=True)
    email = models.EmailField(unique=True)

    password = models.CharField(max_length=255)

    sex = models.CharField(max_length=20, blank=True, null=True)

    profile_pic = models.ImageField(
        blank=True,
        null=True,
        upload_to="profiles/"
    )

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)

    birth_date = models.DateField(blank=True, null=True)

    def save(self, *args, **kwargs):

        if not self.profile_pic:

            if self.sex and self.sex.lower() == "female":
                self.profile_pic = "profiles/default-female-avatar.png"

            else:
                self.profile_pic = "profiles/default-male-avatar.png"

        super().save(*args, **kwargs)