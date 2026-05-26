from django.urls import path
from .views import AskAgentView

urlpatterns = [
    path('ask/', AskAgentView.as_view(), name='ask-agent'),
]