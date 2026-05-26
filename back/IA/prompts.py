IMAGE_CONFIGS = {
    "profile_avatar": {
        "size": {
            "width": 512,
            "height": 512,
        },
        "prompts": {
            "male": "Une truite bleu avec une moustache et un costume noir avec une cravate",
            "female": "Une truite rose avec du rouge à lèvre rouge une robe et des cheveux long blond",
            "default": "image de profil de réseau social Le fond de l'image c'est de l'eau comme la mer",
        },
    },

    "profile_banner": {
        "size": {
            "width": 768,
            "height": 432,
        },
        "prompts": {
            "male": "Une banière qui repressente des truites un male qui drague une fille avec un message drôle sur ça",
            "female": "Une banière qui repressente des truites une fille qui drague une garçon avec un message drôle sur ça",
            "default": "Banière pour site de rencontre pour poisson",
        },
    },

    "post_image": {
        "size": {
            "width": 512,
            "height": 512,
        },
        "prompts": {
            "male": "Une truite bleu dans l'image",
            "female": "Une truite rose dans l'image",
            "default": "Toute les images doivent contenir une truite dedans si c'est une image d'un humain faire une tête de truite",
        },
    },
}


def get_image_config(image_type, sex=None, custom_prompt=None):
    image_type = image_type or "post_image"
    sex = (sex or "default").lower()

    config = IMAGE_CONFIGS.get(image_type, IMAGE_CONFIGS["post_image"])

    width = config["size"]["width"]
    height = config["size"]["height"]

    prompt = config["prompts"].get(sex, config["prompts"]["default"])

    if custom_prompt:
        prompt = f"{prompt}. User request: {custom_prompt}"

    return {
        "prompt": prompt,
        "width": width,
        "height": height,
    }