from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import authentication_classes, permission_classes

from accounts.models import Localisation


@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])

def recup_geoloc(request):

    print('user', request.user)
    print('token', request.auth)
    print("data", request.data)

    latitude = request.data.get("latitude")
    longitude = request.data.get("longitude")

    loc = Localisation.objects.create(
        user=request.user,
        latitude=latitude,
        longitude=longitude
    )

    return Response({
        "message": "OK",
        "id": loc.id
    })