from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from accounts.models import AuthToken
from posts.models import Comment, Post
from posts.serializers import CommentSerializer, PostSerializer
from .models import CommentReaction, PostReaction, ReactionType
from .serializers import ReactionTypeSerializer

DEFAULT_REACTION_TYPES = [
    ("like", "J'aime", "👍"),
    ("love", "J'adore", "❤️"),
    ("funny", "Drôle", "😂"),
    ("dislike", "Je déteste", "👎"),
    ("not_interested", "Ça ne m'intéresse pas", "😐"),
]


def ensure_default_reaction_types():
    for slug, label, emoji in DEFAULT_REACTION_TYPES:
        ReactionType.objects.get_or_create(
            slug=slug,
            defaults={"label": label, "emoji": emoji, "is_active": True}
        )


def get_current_user(request):
    auth_header = request.headers.get("Authorization")

    if not auth_header or not auth_header.startswith("Bearer "):
        return None

    token = auth_header.replace("Bearer ", "")
    token_hash = AuthToken.hash_token(token)

    auth_token = AuthToken.objects.filter(token_hash=token_hash).select_related("user").first()
    if not auth_token:
        return None

    if auth_token.expires_at <= timezone.now():
        auth_token.delete()
        return None

    return auth_token.user


def get_reaction_type(request):
    reaction_value = request.data.get("reaction_type") or request.data.get("reaction")

    if not reaction_value:
        return None

    queryset = ReactionType.objects.filter(is_active=True)

    if isinstance(reaction_value, int) or str(reaction_value).isdigit():
        return queryset.filter(id=int(reaction_value)).first()

    return queryset.filter(slug=str(reaction_value)).first()


@api_view(["GET"])
def reaction_types(request):
    ensure_default_reaction_types()
    reactions = ReactionType.objects.filter(is_active=True)
    serializer = ReactionTypeSerializer(reactions, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["POST"])
def react_to_post(request, post_id):
    user = get_current_user(request)
    if not user:
        return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)

    ensure_default_reaction_types()
    post = get_object_or_404(Post, id=post_id)
    reaction_type = get_reaction_type(request)

    if not reaction_type:
        return Response({"reaction_type": ["Valid reaction type is required."]}, status=status.HTTP_400_BAD_REQUEST)

    existing = PostReaction.objects.filter(post=post, user=user).first()

    if existing and existing.reaction_type_id == reaction_type.id:
        existing.delete()
        selected = None
    elif existing:
        existing.reaction_type = reaction_type
        existing.save()
        selected = reaction_type.slug
    else:
        PostReaction.objects.create(post=post, user=user, reaction_type=reaction_type)
        selected = reaction_type.slug

    serializer = PostSerializer(post, context={"request": request, "user": user})
    return Response({"selected": selected, "post": serializer.data}, status=status.HTTP_200_OK)


@api_view(["POST"])
def react_to_comment(request, comment_id):
    user = get_current_user(request)
    if not user:
        return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)

    ensure_default_reaction_types()
    comment = get_object_or_404(Comment, id=comment_id)
    reaction_type = get_reaction_type(request)

    if not reaction_type:
        return Response({"reaction_type": ["Valid reaction type is required."]}, status=status.HTTP_400_BAD_REQUEST)

    existing = CommentReaction.objects.filter(comment=comment, user=user).first()

    if existing and existing.reaction_type_id == reaction_type.id:
        existing.delete()
        selected = None
    elif existing:
        existing.reaction_type = reaction_type
        existing.save()
        selected = reaction_type.slug
    else:
        CommentReaction.objects.create(comment=comment, user=user, reaction_type=reaction_type)
        selected = reaction_type.slug

    serializer = CommentSerializer(comment, context={"request": request, "user": user})
    return Response({"selected": selected, "comment": serializer.data}, status=status.HTTP_200_OK)
