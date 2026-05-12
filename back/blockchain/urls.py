from django.urls import path

from .views import (
    create_block_view,
    get_chain_view,
    get_last_block_view,
    validate_chain_view,
    sync_chain_view,
)

urlpatterns = [
    path("blocks/", create_block_view, name="blockchain_create_block"),
    path("chain/", get_chain_view, name="blockchain_chain"),
    path("last-block/", get_last_block_view, name="blockchain_last_block"),
    path("validate/", validate_chain_view, name="blockchain_validate"),
    path("sync/", sync_chain_view, name="blockchain_sync"),
]

