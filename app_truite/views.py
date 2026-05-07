from django.shortcuts import render

def regi(request):
    return render(request, 'app_truite/register.html')

def logi(request):
    return render(request, 'app_truite/login.html')