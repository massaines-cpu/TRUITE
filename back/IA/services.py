import os
import requests
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

SESSION = requests.Session()
PROMPT_CACHE = {}


def improve_prompt(prompt):
    if prompt in PROMPT_CACHE:
        return PROMPT_CACHE[prompt]

    endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
    api_key = os.getenv("AZURE_OPENAI_API_KEY")
    deployment_name = os.getenv("AZURE_OPENAI_DEPLOYMENT")

    if not endpoint or not api_key or not deployment_name:
        return prompt

    try:
        client = OpenAI(
            base_url=endpoint,
            api_key=api_key
        )

        completion = client.chat.completions.create(
            model=deployment_name,
            messages=[
                {
                    "role": "system",
                    "content": "Transform the user request into a short high quality English prompt for image generation. Return only the prompt."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
        )

        improved = completion.choices[0].message.content.strip()
        PROMPT_CACHE[prompt] = improved
        return improved

    except Exception:
        return prompt


def generate_image_base64(prompt, width=1024, height=1024):
    url = os.getenv("AZURE_MAI_ENDPOINT")
    api_key = os.getenv("AZURE_MAI_API_KEY")

    if not url or not api_key:
        return None

    payload = {
        "prompt": prompt,
        "width": width,
        "height": height,
        "n": 1,
        "model": "MAI-Image-2e"
    }

    response = SESSION.post(
        url,
        headers={
            "Content-Type": "application/json",
            "api-key": api_key
        },
        json=payload,
        timeout=60
    )

    if response.status_code != 200:
        print(response.text)
        return None

    data = response.json()

    return data["data"][0]["b64_json"]