import re

from django.db.models import Q
from rest_framework.decorators import api_view
from rest_framework.response import Response

from accounts.models import User
from posts.models import Post


HASHTAG_RE = re.compile(r"#([A-Za-z0-9_\-À-ÿ]+)")


def user_payload(user):
    return {
        "id": user.id,
        "username": user.username,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "profile_pic": user.profile_pic.url if user.profile_pic else None,
    }


def post_payload(post):
    return {
        "id": post.id,
        "author_id": post.author_id,
        "author": post.author.username,
        "content": post.content,
        "image": post.image.url if post.image else None,
        "created_at": post.created_at,
    }


@api_view(["GET"])
def search(request):
    query = (request.GET.get("q") or "").strip()

    if not query:
        return Response({"query": "", "users": [], "posts": [], "hashtags": []})

    clean_query = query.lstrip("@#")

    users = User.objects.filter(
        Q(username__icontains=clean_query)
        | Q(first_name__icontains=clean_query)
        | Q(last_name__icontains=clean_query)
    ).order_by("username")[:10]

    posts = Post.objects.select_related("author").filter(
        Q(content__icontains=query) | Q(content__icontains=clean_query)
    ).order_by("-created_at")[:20]

    hashtags = []
    seen = set()

    recent_posts = Post.objects.only("content").order_by("-created_at")[:200]
    for post in recent_posts:
        for tag in HASHTAG_RE.findall(post.content or ""):
            if clean_query.lower() in tag.lower() and tag.lower() not in seen:
                seen.add(tag.lower())
                hashtags.append({"tag": tag, "label": f"#{tag}"})
            if len(hashtags) >= 10:
                break
        if len(hashtags) >= 10:
            break

    return Response({
        "query": query,
        "users": [user_payload(user) for user in users],
        "posts": [post_payload(post) for post in posts],
        "hashtags": hashtags,
    })
