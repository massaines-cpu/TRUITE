from django.conf import settings
from django.db import models



class GeneratedImage(models.Model):
    IMAGE_TYPES = [
        ("profile_avatar", "Profile avatar"),
        ("profile_banner", "Profile banner"),
        ("post_image", "Post image"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="generated_images"
    )

    prompt = models.TextField()
    image_type = models.CharField(max_length=30, choices=IMAGE_TYPES)
    image = models.ImageField(upload_to="ai_images/")
    created_at = models.DateTimeField(auto_now_add=True)
    

    def __str__(self):
        return f"{self.image_type} - {self.user.username}"