from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone

from accounts.models import User, AuthToken
from .models import Follow
from notifications.models import Notification
from notifications.services import create_notification


def get_current_user(request):
    auth_header = request.headers.get("Authorization")

    if not auth_header or not auth_header.startswith("Bearer "):
        return None

    raw_token = auth_header.replace("Bearer ", "").strip()
    token_hash = AuthToken.hash_token(raw_token)

    auth_token = AuthToken.objects.filter(
        token_hash=token_hash
    ).select_related("user").first()

    if not auth_token:
        return None

    if auth_token.expires_at <= timezone.now():
        auth_token.delete()
        return None

    return auth_token.user


def user_data(user, current_user=None):
    is_following = False

    if current_user:
        is_following = Follow.objects.filter(
            follower=current_user,
            following=user
        ).exists()

    return {
        "id": user.id,
        "username": user.username,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": user.email,
        "sex": user.sex,
        "profile_pic": user.profile_pic.url if user.profile_pic else None,
        "is_following": is_following,
    }


@api_view(["POST"])
def toggle_follow(request, user_id):
    follower = get_current_user(request)

    if not follower:
        return Response(
            {"error": "Authentication required"},
            status=status.HTTP_401_UNAUTHORIZED
        )

    try:
        following = User.objects.get(id=user_id)

    except User.DoesNotExist:
        return Response(
            {"error": "User not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    if follower.id == following.id:
        return Response(
            {"error": "You cannot follow yourself"},
            status=status.HTTP_400_BAD_REQUEST
        )

    follow = Follow.objects.filter(
        follower=follower,
        following=following
    ).first()

    if follow:
        follow.delete()
        is_following = False
        message = "Unfollowed"
    else:
        Follow.objects.create(
            follower=follower,
            following=following
        )

        create_notification(
            receiver=following,
            sender=follower,
            notification_type=Notification.TYPE_FOLLOW,
            message=f"{follower.username} vous suit maintenant.",
        )

        is_following = True
        message = "Followed"

    return Response({
        "message": message,
        "is_following": is_following,
        "followers_count": Follow.objects.filter(following=following).count(),
        "following_count": Follow.objects.filter(follower=following).count(),
    })


@api_view(["GET"])
def follow_status(request, user_id):
    current_user = get_current_user(request)

    try:
        profile_user = User.objects.get(id=user_id)

    except User.DoesNotExist:
        return Response(
            {"error": "User not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    is_following = False

    if current_user:
        is_following = Follow.objects.filter(
            follower=current_user,
            following=profile_user
        ).exists()

    return Response({
        "is_following": is_following,
        "followers_count": Follow.objects.filter(following=profile_user).count(),
        "following_count": Follow.objects.filter(follower=profile_user).count(),
    })


@api_view(["GET"])
def suggestions(request):
    current_user = get_current_user(request)

    users = User.objects.all().order_by("username")

    if current_user:
        users = users.exclude(id=current_user.id)

    data = []

    for user in users[:10]:
        data.append(user_data(user, current_user))

    return Response(data)


@api_view(["GET"])
def followers_list(request, user_id):
    current_user = get_current_user(request)

    followers = Follow.objects.filter(
        following_id=user_id
    ).select_related("follower")

    data = []

    for follow in followers:
        data.append(user_data(follow.follower, current_user))

    return Response(data)


@api_view(["GET"])
def following_list(request, user_id):
    current_user = get_current_user(request)

    following = Follow.objects.filter(
        follower_id=user_id
    ).select_related("following")

    data = []

    for follow in following:
        data.append(user_data(follow.following, current_user))

    return Response(data)