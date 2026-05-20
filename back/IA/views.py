import os
import requests
from openai import OpenAI
from dotenv import load_dotenv
from rest_framework.decorators import api_view
from rest_framework.response import Response

load_dotenv()


def generate_image(prompt: str) -> str:
    url = os.getenv("AZURE_MAI_ENDPOINT")
    api_key = os.getenv("AZURE_MAI_API_KEY")

    headers = {
        "Content-Type": "application/json",
        "api-key": api_key
    }

    payload = {
        "prompt": prompt,
        "width": 1024,
        "height": 1024,
        "n": 1,
        "model": "MAI-Image-2e"
    }

    response = requests.post(url, headers=headers, json=payload, timeout=120)

    if response.status_code != 200:
        return None

    data = response.json()
    return data["data"][0]["b64_json"]


def call_gpt(prompt: str) -> str:
    endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
    api_key = os.getenv("AZURE_OPENAI_API_KEY")
    deployment_name = os.getenv("AZURE_OPENAI_DEPLOYMENT", "gpt-5")

    client = OpenAI(
        base_url=endpoint,
        api_key=api_key
    )

    completion = client.chat.completions.create(
        model=deployment_name,
        messages=[
            {
                "role": "system",
                "content": "Transform the user's request into a short, high quality English image generation prompt. Return only the prompt."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
    )

    return completion.choices[0].message.content


@api_view(["POST"])
def generate_content(request):
    prompt = request.data.get("prompt", "").strip()

    if not prompt:
        return Response({"error": "prompt required"}, status=400)

    enhanced_prompt = call_gpt(prompt)
    image_b64 = generate_image(enhanced_prompt)

    if not image_b64:
        return Response({"error": "image generation failed"}, status=500)

    return Response({
        "text": enhanced_prompt,
        "image": image_b64
    })