from django.urls import path

from .views import conversations_list, conversation_messages, messages_page, start_conversation

urlpatterns = [
    path("", messages_page, name="messages_page"),
    path("conversations/", conversations_list, name="api_conversations_list"),
    path("conversations/start/", start_conversation, name="api_start_conversation"),
    path("conversations/<int:conversation_id>/messages/", conversation_messages, name="api_conversation_messages"),
]
