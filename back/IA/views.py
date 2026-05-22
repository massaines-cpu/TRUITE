from rest_framework.decorators import api_view
from rest_framework.response import Response

from accounts.views import get_current_user
from .prompts import get_image_config
from .services import improve_prompt, generate_image_base64


@api_view(["POST"])
def generate_content(request):
    user = get_current_user(request)

    if not user:
        return Response({"error": "Authentication required"}, status=401)

    image_type = request.data.get("image_type", "post_image")
    custom_prompt = request.data.get("prompt", "").strip()

    allowed_types = ["profile_avatar", "profile_banner", "post_image"]

    if image_type not in allowed_types:
        return Response({"error": "Invalid image_type"}, status=400)

    sex = getattr(user, "sex", None)

    config = get_image_config(
        image_type=image_type,
        sex=sex,
        custom_prompt=custom_prompt
    )

    prompt = config["prompt"]
    width = config["width"]
    height = config["height"]

    enhanced_prompt = improve_prompt(prompt)

    image_b64 = generate_image_base64(
        prompt=enhanced_prompt,
        width=width,
        height=height
    )

    if not image_b64:
        return Response({"error": "image generation failed"}, status=500)

    return Response({
        "image_type": image_type,
        "prompt": enhanced_prompt,
        "width": width,
        "height": height,
        "image": image_b64
    })