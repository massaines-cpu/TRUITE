import hashlib
import json

from .models import Block


def calculate_hash(block_data):
    """
    Create SHA256 hash from block data
    """

    encoded_data = json.dumps(
        block_data,
        sort_keys=True
    ).encode()

    return hashlib.sha256(encoded_data).hexdigest()


def get_last_block():
    """
    Return last block in chain
    """

    return Block.objects.order_by("-index").first()


def create_block(data):
    """
    Create new block
    """

    last_block = get_last_block()

    if last_block:
        index = last_block.index + 1
        previous_hash = last_block.hash
    else:
        index = 0
        previous_hash = "0"

    block_data = {
        "index": index,
        "group_name": data["group_name"],
        "author_username": data["author_username"],
        "message_id": data["message_id"],
        "message_text": data["message_text"],
        "image_url": data.get("image_url"),
        "image_hash": data.get("image_hash"),
        "previous_hash": previous_hash,
    }

    block_hash = calculate_hash(block_data)

    block = Block.objects.create(
        index=index,
        group_name=data["group_name"],
        author_username=data["author_username"],
        message_id=data["message_id"],
        message_text=data["message_text"],
        image_url=data.get("image_url"),
        image_hash=data.get("image_hash"),
        previous_hash=previous_hash,
        hash=block_hash,
    )

    return block


def validate_chain():
    """
    Validate blockchain integrity
    """

    blocks = Block.objects.order_by("index")

    previous_hash = "0"

    for block in blocks:

        block_data = {
            "index": block.index,
            "group_name": block.group_name,
            "author_username": block.author_username,
            "message_id": block.message_id,
            "message_text": block.message_text,
            "image_url": block.image_url,
            "image_hash": block.image_hash,
            "previous_hash": block.previous_hash,
        }

        recalculated_hash = calculate_hash(block_data)

        if block.hash != recalculated_hash:
            return False

        if block.previous_hash != previous_hash:
            return False

        previous_hash = block.hash

    return True


def sync_external_blocks(blocks):
    """
    Sync blocks from external groups
    """

    added_blocks = 0

    for block_data in blocks:

        exists = Block.objects.filter(
            hash=block_data["hash"]
        ).exists()

        if not exists:

            Block.objects.create(
                index=block_data["index"],
                timestamp=block_data["timestamp"],
                group_name=block_data["group_name"],
                author_username=block_data["author_username"],
                message_id=block_data["message_id"],
                message_text=block_data["message_text"],
                image_url=block_data.get("image_url"),
                image_hash=block_data.get("image_hash"),
                previous_hash=block_data["previous_hash"],
                hash=block_data["hash"],
            )

            added_blocks += 1

    return added_blocks