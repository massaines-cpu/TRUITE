import re

from accounts.models import User
from .models import Notification


MENTION_RE = re.compile(r"@([A-Za-z0-9_\.\-]+)")


def create_notification(receiver, sender, notification_type, message, post=None, comment=None):
    if not receiver:
        return None

    if sender and receiver.id == sender.id:
        return None

    return Notification.objects.create(
        receiver=receiver,
        sender=sender,
        notification_type=notification_type,
        message=message[:255],
        post=post,
        comment=comment,
    )


def notify_mentions(content, sender, post=None, comment=None):
    usernames = set(MENTION_RE.findall(content or ""))

    if not usernames:
        return

    users = User.objects.filter(username__in=usernames)

    for user in users:
        create_notification(
            receiver=user,
            sender=sender,
            notification_type=Notification.TYPE_MENTION,
            message=f"{sender.username} vous a mentionné.",
            post=post,
            comment=comment,
        )
