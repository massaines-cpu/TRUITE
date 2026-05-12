
from datetime import timezone

from django.db import models


class User(models.Model): 
    username = models.CharField(max_length=100, unique=True) 
    email = models.EmailField(unique=True)

    password = models.CharField(max_length=255)

    sex = models.CharField(max_length=20, blank=True, null=True) 

    profile_pic = models.ImageField(
        blank=True, null=True,
        upload_to="profiles/",
        default="profiles/default.png"
    )

    first_name = models.CharField(max_length=100) 
    last_name = models.CharField(max_length=100) 

    birth_date = models.DateField(blank=True, null=True)

class Localisation(models.Model):
    #user = models.ManyToOneRel(User, on_delete=models.CASCADE)
    longitude = models.FloatField()
    latitude = models.FloatField()
    date = models.DateTimeField(auto_now_add=True)


