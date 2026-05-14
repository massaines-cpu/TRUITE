from django.db import models
from django.core.validators import MaxLengthValidator
from django.core.exceptions import ValidationError



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





def validate_image_size(image):
    max_size = 2 * 1024 * 1024  # 2MB
    if image.size > max_size:
        raise ValidationError("Image trop lourde (max 2MB)")


class Content(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="posts"
    )

    content = models.TextField(
        validators=[MaxLengthValidator(2000)]
    )

    image = models.ImageField(
        upload_to='posts/',
        null=True,
        blank=True,
        validators=[validate_image_size]
    )

    likes = models.ManyToManyField(
        User,
        related_name="liked_posts",
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Post de {self.user.username} ({self.id})"

    def total_likes(self):
        return self.likes.count()        