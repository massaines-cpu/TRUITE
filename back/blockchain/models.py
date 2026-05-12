from django.db import models


class Block(models.Model):
    index = models.IntegerField(unique=True)

    timestamp = models.DateTimeField(auto_now_add=True)

    group_name = models.CharField(max_length=100)

    author_username = models.CharField(max_length=150)

    message_id = models.CharField(max_length=255)

    message_text = models.TextField()

    image_url = models.URLField(
        blank=True,
        null=True
    )

    image_hash = models.CharField(
        max_length=255,
        blank=True,
        null=True
    )

    previous_hash = models.CharField(max_length=255)

    hash = models.CharField(max_length=255)

    class Meta:
        ordering = ["index"]

    def __str__(self):
        return f"Block {self.index}"