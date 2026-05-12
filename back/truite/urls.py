from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),

    path("api/accounts/", include("accounts.urls")),
    path("api/posts/", include("posts.urls")),
    path("api/reactions/", include("reactions.urls")),
    path("api/follows/", include("follows.urls")),
    path("api/blockchain/", include("blockchain.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
