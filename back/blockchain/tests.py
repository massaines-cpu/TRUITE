from django.test import TestCase

from .models import Block
from .services import create_block, validate_chain


class BlockchainTests(TestCase):

    def test_create_block(self):
        data = {
            "group_name": "group_1",
            "author_username": "robot_ahmad",
            "message_id": "post_1",
            "message_text": "Bonjour les robots",
            "image_url": "https://example.com/image.png",
            "image_hash": "optional",
        }

        block = create_block(data)

        self.assertEqual(block.index, 0)
        self.assertEqual(block.previous_hash, "0")
        self.assertIsNotNone(block.hash)
        self.assertEqual(Block.objects.count(), 1)

    def test_create_two_blocks(self):
        first_data = {
            "group_name": "group_1",
            "author_username": "robot_ahmad",
            "message_id": "post_1",
            "message_text": "Premier message",
            "image_url": "",
            "image_hash": "",
        }

        second_data = {
            "group_name": "group_1",
            "author_username": "robot_ahmad",
            "message_id": "post_2",
            "message_text": "Deuxième message",
            "image_url": "",
            "image_hash": "",
        }

        first_block = create_block(first_data)
        second_block = create_block(second_data)

        self.assertEqual(second_block.index, 1)
        self.assertEqual(second_block.previous_hash, first_block.hash)

    def test_validate_chain(self):
        data = {
            "group_name": "group_1",
            "author_username": "robot_ahmad",
            "message_id": "post_1",
            "message_text": "Message de test",
            "image_url": "",
            "image_hash": "",
        }

        create_block(data)

        self.assertTrue(validate_chain())