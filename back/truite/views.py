from django.http import HttpResponse, JsonResponse
from django.shortcuts import render
import json
from django.views.decorators.csrf import csrf_exempt

from accounts.models import Localisation



def home(request):
    return render(request, 'base.html')

def login(request):
    return render(request, 'login.html')

def register(request):
    return render(request, 'register.html')

@csrf_exempt
def recup_geoloc(request):
    data = json.loads(request.body)
    print("data", data)
    loc = Localisation(longitude=data["longitude"], 
                       latitude=data['latitude'])
    print("loc", loc)
    print(loc.longitude)
    loc.save()
    return JsonResponse({})