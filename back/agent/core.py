import os
import threading
from typing import List
from dotenv import load_dotenv
from pydantic import BaseModel, Field

from langchain_openai import AzureChatOpenAI
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.messages import SystemMessage, HumanMessage
from langgraph.prebuilt import create_react_agent

from .tools import truite_tools

load_dotenv()

# ==========================================
# 1. STRUCTURE DE RÉPONSE ATTENDUE
# ==========================================
class AgentResponse(BaseModel):
    topic: str = Field(description="Le sujet principal de la recherche")
    summary: str = Field(description="Un résumé de la recherche")
    sources: List[str] = Field(description="Les sources utilisées")

# ==========================================
# 2. EXÉCUTION DE L'AGENT
# ==========================================
def run_truite_agent(query: str) -> dict:
    raw_endpoint = os.environ.get("AZURE_OPENAI_ENDPOINT", "")
    clean_endpoint = raw_endpoint.split("/openai/")[0] if "/openai/" in raw_endpoint else raw_endpoint
    deployment = os.environ.get("AZURE_OPENAI_DEPLOYMENT_NAME") or os.environ.get("AZURE_OPENAI_DEPLOYMENT")
    api_version = os.environ.get("OPENAI_API_VERSION") or os.environ.get("AZURE_OPENAI_API_VERSION", "2024-02-15-preview")

    print("\n" + "="*40)
    print("🤖 DEBUG AZURE OPENAI")
    print(f"Endpoint utilisé   : {clean_endpoint}")
    print(f"Nom de déploiement : {deployment}")
    print(f"Version API        : {api_version}")
    print("="*40 + "\n")

    llm = AzureChatOpenAI(
        azure_endpoint=clean_endpoint,
        azure_deployment=deployment,
        api_version=api_version,
        api_key=os.environ.get("AZURE_OPENAI_API_KEY"),
        temperature=1,
    )
    
    parser = PydanticOutputParser(pydantic_object=AgentResponse)
    system_prompt = f"""Tu es un assistant de recherche intelligent pour le réseau social TRUITE.
    Réponds à la demande en utilisant tes outils (recherche web, wikipedia).
    Si on te demande de sauvegarder ou publier les résultats, utilise impérativement l'outil 'create_truite_post'.
    Si on te demande de commenter un post, utilise l'outil 'create_truite_comment'. Le contenu du commentaire DOIT IMPÉRATIVEMENT inclure des métaphores, des jeux de mots ou un ton lié au thème des poissons et du milieu aquatique.

    Tu dois OBLIGATOIREMENT formater ta réponse finale selon ce format JSON :
    {parser.get_format_instructions()}
    """
    
    agent_executor = create_react_agent(llm, tools=truite_tools)
    try:
        raw_response = agent_executor.invoke({"messages": [SystemMessage(content=system_prompt), HumanMessage(content=query)]})
        final_message = raw_response["messages"][-1].content
    except Exception as e:
        final_message = f'{{"topic": "Erreur d\'exécution", "summary": "L\'agent a rencontré un problème technique (ex: blocage réseau ou erreur Azure OpenAI). Détail: {str(e)}", "sources": []}}'
    
    try:
        return parser.parse(final_message).model_dump()
    except Exception as e:
        return {"error": "Échec du parsing de la réponse", "raw_output": final_message, "details": str(e)}

# ==========================================
# 3. GESTION ASYNCHRONE DES COMMENTAIRES
# ==========================================
def _generate_auto_comment(post_id: int, post_content: str):
    """Exécute l'agent en arrière-plan pour commenter un post."""
    query = (
        f"Un utilisateur vient de publier le post suivant : '{post_content}'. "
        f"Utilise ton outil 'create_truite_comment' pour ajouter un commentaire au post ID {post_id}. "
        "Fais une blague ou une métaphore sur les poissons en lien avec ce sujet !"
    )
    try:
        run_truite_agent(query)
    except Exception as e:
        print(f"Erreur lors de la génération du commentaire automatique : {e}")

def trigger_automatic_comment(post_id: int, post_content: str):
    """Lance un thread pour ne pas bloquer la réponse HTTP."""
    thread = threading.Thread(target=_generate_auto_comment, args=(post_id, post_content))
    thread.start()