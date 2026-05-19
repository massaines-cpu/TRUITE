from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MaxLengthValidator
from django.db import models


def validate_image_size(image):
    max_size = 2 * 1024 * 1024
    if image.size > max_size:
        raise ValidationError("Image trop lourde (max 2MB)")


class Post(models.Model):
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="social_posts"
    )
    content = models.TextField(validators=[MaxLengthValidator(2000)])
    image = models.ImageField(
        upload_to="images/posts/",
        validators=[validate_image_size]
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Post #{self.id} by {self.author.username}"


class Comment(models.Model):
    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name="comments"
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="comments"
    )
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        related_name="replies",
        null=True,
        blank=True
    )
    content = models.TextField(validators=[MaxLengthValidator(1000)])
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def clean(self):
        if self.parent and self.parent.post_id != self.post_id:
            raise ValidationError("A reply must belong to the same post as its parent comment.")

    def __str__(self):
        return f"Comment #{self.id} on post #{self.post_id}"