from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from accounts.models import AuthToken
from .models import Notification
from .serializers import NotificationSerializer


def get_current_user(request):
    auth_header = request.headers.get("Authorization")

    if not auth_header or not auth_header.startswith("Bearer "):
        return None

    token = auth_header.replace("Bearer ", "").strip()
    token_hash = AuthToken.hash_token(token)

    auth_token = AuthToken.objects.filter(token_hash=token_hash).select_related("user").first()
    if not auth_token:
        return None

    if auth_token.expires_at <= timezone.now():
        auth_token.delete()
        return None

    return auth_token.user


@api_view(["GET"])
def notifications_list(request):
    user = get_current_user(request)

    if not user:
        return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)

    notifications = Notification.objects.filter(receiver=user).select_related("sender", "post", "comment")[:30]
    unread_count = Notification.objects.filter(receiver=user, is_read=False).count()

    return Response({
        "unread_count": unread_count,
        "notifications": NotificationSerializer(notifications, many=True).data,
    })


@api_view(["POST"])
def mark_all_read(request):
    user = get_current_user(request)

    if not user:
        return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)

    Notification.objects.filter(receiver=user, is_read=False).update(is_read=True)
    return Response({"success": True})
