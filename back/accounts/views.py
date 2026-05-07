from rest_framework.decorators import api_view
from rest_framework import status
from drf_spectacular.utils import extend_schema

from .serializers import UserSerializer


@extend_schema(request=UserSerializer, responses=UserSerializer)
@api_view(["POST"])
def register(request):
    serializer = UserSerializer(data=request.data)

    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(
    request={
        "application/json": {
            "type": "object",
            "properties": {
                "username": {"type": "string"},
                "password": {"type": "string"},
            },
            "required": ["username", "password"],
        }
    }
)
@api_view(["POST"])
def login(request):
    return Response({
        "message": "login route works"
    })