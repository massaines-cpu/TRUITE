from django.urls import path

from .views import search


urlpatterns = [
    path("", search, name="social_search"),
]
