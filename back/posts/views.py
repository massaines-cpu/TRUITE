from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, parser_classes
from rest_framework.response import Response


from accounts.models import AuthToken, User
from .models import Comment, Post
from .serializers import CommentSerializer, PostSerializer


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


def serializer_context(request):
    user = get_current_user(request)
    return {"request": request, "user": user}


@api_view(["GET", "POST"])
def posts_list_create(request):
    user = get_current_user(request)

    if request.method == "GET":
        posts = Post.objects.select_related("author").prefetch_related(
            "comments__author",
            "comments__replies",
            "comments__replies__author",
            "reactions__reaction_type",
            "comments__reactions__reaction_type",
        )
        serializer = PostSerializer(posts, many=True, context={"request": request, "user": user})
        return Response(serializer.data, status=status.HTTP_200_OK)

    if not user:
        return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)

    content = request.data.get("content", "").strip()
    image = request.FILES.get("image")

    if not content:
        return Response({"content": ["Content is required."]}, status=status.HTTP_400_BAD_REQUEST)

    if not image:
        return Response({"image": ["Image obligatoire."]}, status=status.HTTP_400_BAD_REQUEST)

    post = Post.objects.create(author=user, content=content, image=image)
    serializer = PostSerializer(post, context={"request": request, "user": user})
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(["GET"])
def post_detail(request, post_id):
    user = get_current_user(request)
    post = get_object_or_404(
        Post.objects.select_related("author").prefetch_related(
            "comments__author",
            "comments__replies",
            "comments__replies__author",
            "reactions__reaction_type",
            "comments__reactions__reaction_type",
        ),
        id=post_id,
    )
    serializer = PostSerializer(post, context={"request": request, "user": user})
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["GET"])
def user_posts(request, user_id):
    user = get_current_user(request)
    profile_user = get_object_or_404(User, id=user_id)
    posts = Post.objects.filter(author=profile_user).select_related("author").prefetch_related(
        "comments__author",
        "comments__replies",
        "comments__replies__author",
        "reactions__reaction_type",
        "comments__reactions__reaction_type",
    )
    serializer = PostSerializer(posts, many=True, context={"request": request, "user": user})
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["POST"])
def create_comment(request, post_id):
    user = get_current_user(request)
    if not user:
        return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)

    post = get_object_or_404(Post, id=post_id)
    content = request.data.get("content", "").strip()

    if not content:
        return Response({"content": ["Content is required."]}, status=status.HTTP_400_BAD_REQUEST)

    comment = Comment.objects.create(post=post, author=user, content=content)
    serializer = CommentSerializer(comment, context={"request": request, "user": user})
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(["POST"])
def create_reply(request, comment_id):
    user = get_current_user(request)
    if not user:
        return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)

    parent = get_object_or_404(Comment, id=comment_id)
    content = request.data.get("content", "").strip()

    if not content:
        return Response({"content": ["Content is required."]}, status=status.HTTP_400_BAD_REQUEST)

    reply = Comment.objects.create(
        post=parent.post,
        parent=parent,
        author=user,
        content=content,
    )
    serializer = CommentSerializer(reply, context={"request": request, "user": user})
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(["PATCH"])
def update_post(request, post_id):
    user = get_current_user(request)

    if not user:
        return Response(
            {"error": "Authentication required"},
            status=status.HTTP_401_UNAUTHORIZED
        )

    post = get_object_or_404(Post, id=post_id)

    if post.author != user:
        return Response(
            {"error": "Unauthorized"},
            status=status.HTTP_403_FORBIDDEN
        )

    content = request.data.get("content")
    image = request.FILES.get("image")

    if content is not None:
        post.content = content.strip()

    if image:
        post.image = image

    post.save()

    serializer = PostSerializer(
        post,
        context={"request": request, "user": user}
    )

    return Response(serializer.data)

@api_view(["DELETE"])
def delete_post(request, post_id):
    user = get_current_user(request)

    if not user:
        return Response(
            {"error": "Authentication required"},
            status=status.HTTP_401_UNAUTHORIZED
        )

    post = get_object_or_404(Post, id=post_id)

    if post.author != user:
        return Response(
            {"error": "Unauthorized"},
            status=status.HTTP_403_FORBIDDEN
        )

    post.delete()

    return Response({"success": True})
