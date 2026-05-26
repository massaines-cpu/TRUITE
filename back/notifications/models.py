from django.conf import settings
from django.db import models


class Notification(models.Model):
    TYPE_FOLLOW = "follow"
    TYPE_MENTION = "mention"
    TYPE_COMMENT = "comment"
    TYPE_REACTION = "reaction"
    TYPE_REPLY = "reply"

    NOTIFICATION_TYPES = [
        (TYPE_FOLLOW, "Follow"),
        (TYPE_MENTION, "Mention"),
        (TYPE_COMMENT, "Comment"),
        (TYPE_REACTION, "Reaction"),
        (TYPE_REPLY, "Reply"),
    ]

    receiver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sent_notifications",
        null=True,
        blank=True,
    )
    notification_type = models.CharField(max_length=30, choices=NOTIFICATION_TYPES)
    post = models.ForeignKey(
        "posts.Post",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="notifications",
    )
    comment = models.ForeignKey(
        "posts.Comment",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="notifications",
    )
    message = models.CharField(max_length=255)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.receiver} - {self.notification_type}"
