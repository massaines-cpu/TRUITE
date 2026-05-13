
from datetime import timezone
from django.contrib.auth.models import AbstractUser

from django.db import models


class User(AbstractUser):
    sex = models.CharField(max_length=20, blank=True, null=True)
    profile_pic = models.ImageField(
        blank=True, null=True,
        upload_to="profiles/",
        default="profiles/default.png"
    )
    birth_date = models.DateField(blank=True, null=True)

class Localisation(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)    
    longitude = models.FloatField()
    latitude = models.FloatField()
    date = models.DateTimeField(auto_now_add=True)

