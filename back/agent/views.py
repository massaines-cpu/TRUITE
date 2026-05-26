import traceback
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers

from .core import run_truite_agent


class AskAgentRequestSerializer(serializers.Serializer):
    query = serializers.CharField(required=True, help_text="La requête ou la question à envoyer à l'agent")


class AskAgentResponseSerializer(serializers.Serializer):
    topic = serializers.CharField(help_text="Le sujet principal de la recherche")
    summary = serializers.CharField(help_text="Un résumé de la recherche")
    sources = serializers.ListField(child=serializers.CharField(), help_text="Les sources utilisées")


class AskAgentView(APIView):
    """
    Vue permettant de soumettre une requête à l'agent IA de TRUITE.
    """
    @extend_schema(
        summary="Interroger l'agent IA de TRUITE",
        description="Permet de poser une question à l'agent, qui effectuera des recherches et pourra interagir avec TRUITE (poster, commenter).",
        request=AskAgentRequestSerializer,
        responses={
            200: AskAgentResponseSerializer,
            400: inline_serializer(
                name="AgentBadRequest",
                fields={"error": serializers.CharField()}
            ),
            500: inline_serializer(
                name="AgentServerError",
                fields={
                    "error": serializers.CharField(),
                    "details": serializers.CharField(required=False),
                    "raw_output": serializers.CharField(required=False),
                    "traceback": serializers.CharField(required=False),
                }
            )
        },
        tags=["Agent IA"]
    )
    def post(self, request):
        query = request.data.get("query")
        
        if not query:
            return Response(
                {"error": "Le paramètre 'query' est obligatoire dans le corps de la requête."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            result = run_truite_agent(query)
        except Exception as e:
            error_msg = str(e)
            if "404" in error_msg:
                return Response({
                    "error": "Configuration Azure OpenAI invalide (Erreur 404).",
                    "details": "Vérifiez dans le terminal les logs 'DEBUG AZURE OPENAI'. Le nom de déploiement ou l'endpoint sont incorrects.",
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
            return Response({
                "error": "Une exception non gérée a fait crasher l'agent.",
                "details": str(e),
                "traceback": traceback.format_exc()
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Si une erreur de parsing s'est produite dans le service
        if "error" in result:
             return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
             
        return Response(result, status=status.HTTP_200_OK)