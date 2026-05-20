from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include

from accounts.views import login_page, register_page, profile_page, logout_view,poste_user, home_view
from truite.views import recup_geoloc

from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
)

urlpatterns = [
    path("admin/", admin.site.urls),

    path("", home_view, name="home"),
    path("base/", home_view, name="base_page"),
    path("login/", login_page, name="login_page"),
    path("register/", register_page, name="register_page"),
    path("profile/", profile_page, name="profile_page"),
    path('recup-location/', recup_geoloc, name='recup geoloc'),


    path("api/ia/", include("IA.urls")),
    path("api/accounts/", include("accounts.urls")),
    path("api/posts/", include("posts.urls")),
    path("api/reactions/", include("reactions.urls")),
    path("api/follows/", include("follows.urls")),
    path("api/blockchain/", include("blockchain.urls")),

    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("logout/", logout_view, name="logout"),
    path("post/", poste_user, name="post_user"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)