import wikipedia
from langchain_community.tools import DuckDuckGoSearchRun
from langchain_community.utilities import WikipediaAPIWrapper
from langchain_community.tools import WikipediaQueryRun
from langchain_core.tools import tool
from django.contrib.auth import get_user_model
from posts.models import Post, Comment

User = get_user_model()

# Définition d'un User-Agent pour empêcher Wikipedia de bloquer la requête
wikipedia.set_user_agent("TruiteAgent/1.0 (contact@truite.com)")

# ==========================================
# 1. Outils natifs (on les instancie directement)
# ==========================================
search_tool = DuckDuckGoSearchRun()

wiki_tool = WikipediaQueryRun(
    api_wrapper=WikipediaAPIWrapper(top_k_results=1, doc_content_chars_max=1000)
)

# ==========================================
# 2. Outils personnalisés TRUITE
# ==========================================
def get_dolphin_bot():
    """Récupère ou crée l'unique bot DolphinTales avec tous les attributs requis."""
    bot_user, created = User.objects.get_or_create(
        username="DolphinTales",
        defaults={
            "email": "dolphintales@truite.local",
            "first_name": "Bot",  # Important : empêche la boucle infinie de commentaires dans posts/views.py
            "last_name": "DolphinTales",
            "profile_pic": "images/profiles/dolphin_robot.jpg",  # Assurez-vous d'avoir cette image dans /media
            "sex": "M" # Valeur factice requise par vos modèles
        }
    )
    if created:
        # Assigne un vrai hash de mot de passe de manière standard à Django pour éviter les bugs Azure
        bot_user.set_password("DolphinRobot2024!")
        if hasattr(bot_user, 'birth_date'):
            bot_user.birth_date = "2024-01-01"
        bot_user.save()
    return bot_user

@tool
def create_truite_post(content: str) -> str:
    """Sauvegarde la recherche sous forme de Post TRUITE. Fournir uniquement 'content'."""
    bot_user = get_dolphin_bot()
    # Attribution d'une image obligatoire pour imiter un compte normal et ne pas faire crasher le Serializer
    post = Post.objects.create(author=bot_user, content=content, image="images/profiles/dolphin_robot.jpg")
    return f"Le post a été publié avec succès par {bot_user.username} avec l'ID {post.id}."

@tool
def create_truite_comment(post_id: int, content: str) -> str:
    """Ajoute un commentaire à un post existant. Fournir 'post_id' et 'content'."""
    bot_user = get_dolphin_bot()
    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return f"Erreur : Le post avec l'ID {post_id} n'existe pas."
    comment = Comment.objects.create(post=post, author=bot_user, content=content)
    return f"Le commentaire a été ajouté avec succès par {bot_user.username} sur le post {post.id}."

# Liste des outils exportée pour l'agent
truite_tools = [search_tool, wiki_tool, create_truite_post, create_truite_comment]