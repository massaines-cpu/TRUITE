from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers

from .models import Block
from .serializers import BlockSerializer
from .services import (
    create_block,
    validate_chain,
    get_last_block,
    sync_external_blocks,
)


@extend_schema(
    request=BlockSerializer,
    responses=BlockSerializer,
)
@api_view(["POST"])
def create_block_view(request):
    serializer = BlockSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    block = create_block(serializer.validated_data)

    return Response(
        BlockSerializer(block).data,
        status=status.HTTP_201_CREATED
    )


@extend_schema(
    responses=BlockSerializer(many=True),
)
@api_view(["GET"])
def get_chain_view(request):
    blocks = Block.objects.order_by("index")
    serializer = BlockSerializer(blocks, many=True)
    return Response(serializer.data)


@extend_schema(
    responses=BlockSerializer,
)
@api_view(["GET"])
def get_last_block_view(request):
    block = get_last_block()

    if not block:
        return Response(
            {"message": "No block found"},
            status=status.HTTP_404_NOT_FOUND
        )

    serializer = BlockSerializer(block)
    return Response(serializer.data)


@extend_schema(
    responses=inline_serializer(
        name="ValidateChainResponse",
        fields={
            "valid": serializers.BooleanField()
        }
    )
)
@api_view(["POST"])
def validate_chain_view(request):
    is_valid = validate_chain()
    return Response({"valid": is_valid})


@extend_schema(
    request=inline_serializer(
        name="SyncBlocksRequest",
        fields={
            "blocks": BlockSerializer(many=True)
        }
    ),
    responses=inline_serializer(
        name="SyncBlocksResponse",
        fields={
            "added_blocks": serializers.IntegerField()
        }
    )
)
@api_view(["POST"])
def sync_chain_view(request):
    blocks = request.data.get("blocks", [])
    added_blocks = sync_external_blocks(blocks)

    return Response({
        "added_blocks": added_blocks
    })