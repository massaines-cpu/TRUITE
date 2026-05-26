from django.urls import path

from .views import mark_all_read, notifications_list


urlpatterns = [
    path("", notifications_list, name="notifications_list"),
    path("read/", mark_all_read, name="notifications_mark_all_read"),
]
