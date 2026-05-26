from django.shortcuts import get_object_or_404, render
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from accounts.models import AuthToken, User
from notifications.models import Notification
from notifications.services import create_notification
from .models import Conversation, DirectMessage
from .serializers import ConversationSerializer, MessageSerializer


def messages_page(request):
    return render(request, "messages/inbox.html")


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


def get_or_create_conversation(user, other_user):
    conversations = Conversation.objects.filter(participants=user).filter(participants=other_user)
    conversation = conversations.first()

    if conversation:
        return conversation

    conversation = Conversation.objects.create()
    conversation.participants.add(user, other_user)
    return conversation


@api_view(["GET"])
def conversations_list(request):
    user = get_current_user(request)

    if not user:
        return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)

    conversations = Conversation.objects.filter(participants=user).prefetch_related(
        "participants",
        "messages",
        "messages__sender",
    ).order_by("-updated_at")

    serializer = ConversationSerializer(conversations, many=True, context={"user": user})
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["POST"])
def start_conversation(request):
    user = get_current_user(request)

    if not user:
        return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)

    user_id = request.data.get("user_id")
    if not user_id:
        return Response({"user_id": ["User id is required."]}, status=status.HTTP_400_BAD_REQUEST)

    other_user = get_object_or_404(User, id=user_id)

    if other_user.id == user.id:
        return Response({"error": "You cannot message yourself."}, status=status.HTTP_400_BAD_REQUEST)

    conversation = get_or_create_conversation(user, other_user)
    serializer = ConversationSerializer(conversation, context={"user": user})
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["GET", "POST"])
def conversation_messages(request, conversation_id):
    user = get_current_user(request)

    if not user:
        return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)

    conversation = get_object_or_404(Conversation.objects.prefetch_related("participants"), id=conversation_id)

    if not conversation.participants.filter(id=user.id).exists():
        return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)

    if request.method == "GET":
        conversation.messages.exclude(sender=user).filter(is_read=False).update(is_read=True)
        messages = conversation.messages.select_related("sender").all()
        return Response(MessageSerializer(messages, many=True).data, status=status.HTTP_200_OK)

    content = request.data.get("content", "").strip()
    if not content:
        return Response({"content": ["Message is required."]}, status=status.HTTP_400_BAD_REQUEST)

    message = DirectMessage.objects.create(
        conversation=conversation,
        sender=user,
        content=content,
    )
    conversation.save()

    receiver = conversation.participants.exclude(id=user.id).first()
    if receiver:
        create_notification(
            receiver=receiver,
            sender=user,
            notification_type=Notification.TYPE_MESSAGE,
            message=f"{user.username} vous a envoyé un message.",
        )

    return Response(MessageSerializer(message).data, status=status.HTTP_201_CREATED)
