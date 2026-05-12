from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include

from accounts.views import login_page, register_page
from truite.views import recup_geoloc

urlpatterns = [
    path("admin/", admin.site.urls),

    # HTML pages
    path("login/", login_page, name="login_page"),
    path("register/", register_page, name="register_page"),
    path('recup-location', recup_geoloc, name='recup geoloc'),

    # APIs
    path("api/accounts/", include("accounts.urls")),
    path("api/posts/", include("posts.urls")),
    path("api/reactions/", include("reactions.urls")),
    path("api/follows/", include("follows.urls")),
    path("api/blockchain/", include("blockchain.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)