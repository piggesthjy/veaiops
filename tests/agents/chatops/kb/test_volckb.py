# Copyright 2025 Beijing Volcano Engine Technology Co., Ltd. and/or its affiliates
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from datetime import datetime
from unittest.mock import MagicMock, patch

import pytest
import tos
from volcengine.viking_knowledgebase import VikingKnowledgeBaseService
from volcengine.viking_knowledgebase.exception import CollectionNotExistException

# fixture handles message creation
from veaiops.agents.chatops.kb.volckb import VeAIOpsKBManager
from veaiops.schema.types import KBType
from veaiops.utils.kb import EnhancedCollection


@pytest.mark.asyncio
async def test_veaiops_kb_manager_initialization(test_bot):
    """Test VeAIOpsKBManager initialization."""

    with patch.object(VikingKnowledgeBaseService, "get_collection") as mock_get_collection:
        mock_collection = MagicMock(spec=EnhancedCollection)
        mock_get_collection.return_value = mock_collection

        mock_tos_client = MagicMock(spec=tos.TosClientV2)
        mock_viking_service = MagicMock(spec=VikingKnowledgeBaseService)

        # Act
        kb_manager = VeAIOpsKBManager(
            bot_id=test_bot.bot_id,
            collection_name="test_collection",
            project="test_project",
            kb_type=KBType.AutoQA,
            bucket_name="test_bucket",
            tos_client=mock_tos_client,
            vikingkb=mock_viking_service,
        )

        # Assert
        assert kb_manager.bot_id == test_bot.bot_id
        assert kb_manager.collection_name == "test_collection"
        assert kb_manager.project == "test_project"
        assert kb_manager.kb_type == KBType.AutoQA


@pytest.mark.asyncio
async def test_get_or_create_collection_exists(test_bot):
    """Test get_or_create_collection when collection already exists."""

    mock_tos_client = MagicMock(spec=tos.TosClientV2)
    mock_viking_service = MagicMock(spec=VikingKnowledgeBaseService)
    mock_collection = MagicMock(spec=EnhancedCollection)
    mock_viking_service.get_collection.return_value = mock_collection

    # Act
    with patch.object(VeAIOpsKBManager, "model_post_init"):
        kb_manager = VeAIOpsKBManager(
            bot_id=test_bot.bot_id,
            collection_name="test_collection",
            project="test_project",
            kb_type=KBType.AutoQA,
            bucket_name="test_bucket",
            tos_client=mock_tos_client,
            vikingkb=mock_viking_service,
        )

    collection = kb_manager.get_or_create_collection()

    # Assert
    assert collection is not None
    assert collection == mock_collection
    mock_viking_service.get_collection.assert_called_once_with(
        collection_name="test_collection", project="test_project"
    )


@pytest.mark.asyncio
async def test_get_or_create_collection_not_exists(test_bot):
    """Test get_or_create_collection when collection doesn't exist."""

    mock_tos_client = MagicMock(spec=tos.TosClientV2)
    mock_viking_service = MagicMock(spec=VikingKnowledgeBaseService)
    mock_collection = MagicMock(spec=EnhancedCollection)

    # Mock get_collection to raise CollectionNotExistException
    mock_viking_service.get_collection.side_effect = CollectionNotExistException(
        code=1000, request_id="test_request", message="Collection not found"
    )
    mock_viking_service.create_collection.return_value = mock_collection

    # Act
    with patch.object(VeAIOpsKBManager, "model_post_init"):
        kb_manager = VeAIOpsKBManager(
            bot_id=test_bot.bot_id,
            collection_name="test_collection",
            project="test_project",
            kb_type=KBType.AutoQA,
            bucket_name="test_bucket",
            tos_client=mock_tos_client,
            vikingkb=mock_viking_service,
        )

    collection = kb_manager.get_or_create_collection()

    # Assert
    assert collection is not None
    assert collection == mock_collection
    mock_viking_service.create_collection.assert_called_once()


@pytest.mark.asyncio
async def test_create_collection_autoqa(test_bot):
    """Test create_collection for AutoQA type."""

    mock_tos_client = MagicMock(spec=tos.TosClientV2)
    mock_viking_service = MagicMock(spec=VikingKnowledgeBaseService)
    mock_collection = MagicMock(spec=EnhancedCollection)
    mock_viking_service.create_collection.return_value = mock_collection

    # Act
    with patch.object(VeAIOpsKBManager, "model_post_init"):
        kb_manager = VeAIOpsKBManager(
            bot_id=test_bot.bot_id,
            collection_name="test_collection",
            project="test_project",
            kb_type=KBType.AutoQA,
            bucket_name="test_bucket",
            tos_client=mock_tos_client,
            vikingkb=mock_viking_service,
        )

    collection = kb_manager.create_collection()

    # Assert
    assert collection is not None
    mock_viking_service.create_collection.assert_called_once()
    call_args = mock_viking_service.create_collection.call_args
    assert call_args.kwargs["collection_name"] == "test_collection"
    assert call_args.kwargs["project"] == "test_project"


@pytest.mark.asyncio
async def test_create_collection_autodoc(test_bot):
    """Test create_collection for AutoDoc type."""

    mock_tos_client = MagicMock(spec=tos.TosClientV2)
    mock_viking_service = MagicMock(spec=VikingKnowledgeBaseService)
    mock_collection = MagicMock(spec=EnhancedCollection)
    mock_viking_service.create_collection.return_value = mock_collection

    # Act
    with patch.object(VeAIOpsKBManager, "model_post_init"):
        kb_manager = VeAIOpsKBManager(
            bot_id=test_bot.bot_id,
            collection_name="test_collection",
            project="test_project",
            kb_type=KBType.AutoDoc,
            bucket_name="test_bucket",
            tos_client=mock_tos_client,
            vikingkb=mock_viking_service,
        )

    collection = kb_manager.create_collection()

    # Assert
    assert collection is not None
    mock_viking_service.create_collection.assert_called_once()
    call_args = mock_viking_service.create_collection.call_args
    # AutoDoc should have preprocessing config
    assert call_args.kwargs.get("preprocessing") is not None


@pytest.mark.asyncio
async def test_put_tos_object_success(test_bot):
    """Test _put_tos_object successful upload."""
    mock_tos_client = MagicMock(spec=tos.TosClientV2)
    mock_viking_service = MagicMock(spec=VikingKnowledgeBaseService)

    with patch.object(VeAIOpsKBManager, "model_post_init"):
        kb_manager = VeAIOpsKBManager(
            bot_id=test_bot.bot_id,
            collection_name="test_collection",
            project="test_project",
            kb_type=KBType.AutoQA,
            bucket_name="test_bucket",
            tos_client=mock_tos_client,
            vikingkb=mock_viking_service,
        )

    # Act
    result = await kb_manager._put_tos_object(
        data="test content", file_name="test_file", metadata={"key": "value"}, data_type="txt"
    )

    # Assert
    assert result == f"test_bucket/{test_bot.bot_id}/test_file.txt"
    mock_tos_client.put_object.assert_called_once()


@pytest.mark.asyncio
async def test_put_tos_object_faq_xlsx(test_bot):
    """Test _put_tos_object with faq.xlsx file."""
    mock_tos_client = MagicMock(spec=tos.TosClientV2)
    mock_viking_service = MagicMock(spec=VikingKnowledgeBaseService)

    with patch.object(VeAIOpsKBManager, "model_post_init"):
        kb_manager = VeAIOpsKBManager(
            bot_id=test_bot.bot_id,
            collection_name="test_collection",
            project="test_project",
            kb_type=KBType.AutoQA,
            bucket_name="test_bucket",
            tos_client=mock_tos_client,
            vikingkb=mock_viking_service,
        )

    # Act
    result = await kb_manager._put_tos_object(
        data="/path/to/file.xlsx", file_name="test_faq", metadata={"key": "value"}, data_type="faq.xlsx"
    )

    # Assert
    assert result == f"test_bucket/{test_bot.bot_id}/test_faq.faq.xlsx"
    mock_tos_client.put_object_from_file.assert_called_once()


@pytest.mark.asyncio
async def test_add_from_text_success(test_bot):
    """Test add_from_text successful execution."""

    mock_tos_client = MagicMock(spec=tos.TosClientV2)
    mock_viking_service = MagicMock(spec=VikingKnowledgeBaseService)
    mock_collection = MagicMock(spec=EnhancedCollection)
    mock_viking_service.get_collection.return_value = mock_collection

    with patch.object(VeAIOpsKBManager, "model_post_init"):
        kb_manager = VeAIOpsKBManager(
            bot_id=test_bot.bot_id,
            collection_name="test_collection",
            project="test_project",
            kb_type=KBType.AutoQA,
            bucket_name="test_bucket",
            tos_client=mock_tos_client,
            vikingkb=mock_viking_service,
        )

    # Act
    result = await kb_manager.add_from_text(
        text="test content", file_name="test_file", metadata={"key": "value"}, data_type="txt"
    )

    # Assert
    assert result is True
    mock_tos_client.put_object.assert_called_once()
    mock_collection.add_doc.assert_called_once()


@pytest.mark.asyncio
async def test_add_from_qa_success(test_bot, test_chat, test_messages):
    """Test add_from_qa successful execution."""

    base_time = datetime(2025, 1, 15, 10, 0, 0)

    # Create message
    test_message = await test_messages(
        bot_id=test_bot.bot_id, chat_id=test_chat.chat_id, content="测试问题", msg_time=base_time
    )

    mock_tos_client = MagicMock(spec=tos.TosClientV2)
    mock_viking_service = MagicMock(spec=VikingKnowledgeBaseService)
    mock_collection = MagicMock(spec=EnhancedCollection)
    mock_viking_service.get_collection.return_value = mock_collection

    # Mock collection methods
    mock_collection.get_doc.return_value = MagicMock()  # Doc exists
    mock_result = MagicMock()
    mock_result.point_id = "test_point_id"
    mock_collection.add_point.return_value = mock_result

    with patch.object(VeAIOpsKBManager, "model_post_init"):
        kb_manager = VeAIOpsKBManager(
            bot_id=test_bot.bot_id,
            collection_name="test_collection",
            project="test_project",
            kb_type=KBType.AutoQA,
            bucket_name="test_bucket",
            tos_client=mock_tos_client,
            vikingkb=mock_viking_service,
        )

    # Act
    point_id = await kb_manager.add_from_qa(question="测试问题", answer="测试答案", msg_id=test_message.msg_id)

    # Assert
    assert point_id == "test_point_id"
    mock_collection.add_point.assert_called_once()


@pytest.mark.asyncio
async def test_add_from_qa_message_not_found(test_bot):
    """Test add_from_qa when message is not found."""

    mock_tos_client = MagicMock(spec=tos.TosClientV2)
    mock_viking_service = MagicMock(spec=VikingKnowledgeBaseService)
    mock_collection = MagicMock(spec=EnhancedCollection)
    mock_viking_service.get_collection.return_value = mock_collection

    with patch.object(VeAIOpsKBManager, "model_post_init"):
        kb_manager = VeAIOpsKBManager(
            bot_id=test_bot.bot_id,
            collection_name="test_collection",
            project="test_project",
            kb_type=KBType.AutoQA,
            bucket_name="test_bucket",
            tos_client=mock_tos_client,
            vikingkb=mock_viking_service,
        )

    # Act & Assert
    with pytest.raises(Exception) as exc_info:
        await kb_manager.add_from_qa(question="测试问题", answer="测试答案", msg_id="non_existent_msg_id")

    assert "Message with id non_existent_msg_id not found" in str(exc_info.value)


@pytest.mark.asyncio
async def test_add_from_qa_chat_not_found(test_bot, test_messages):
    """Test add_from_qa when chat is not found."""

    base_time = datetime(2025, 1, 15, 10, 0, 0)

    # Create message without chat
    test_message = await test_messages(
        bot_id=test_bot.bot_id, chat_id="non_existent_chat", content="测试问题", msg_time=base_time
    )

    mock_tos_client = MagicMock(spec=tos.TosClientV2)
    mock_viking_service = MagicMock(spec=VikingKnowledgeBaseService)
    mock_collection = MagicMock(spec=EnhancedCollection)
    mock_viking_service.get_collection.return_value = mock_collection

    with patch.object(VeAIOpsKBManager, "model_post_init"):
        kb_manager = VeAIOpsKBManager(
            bot_id=test_bot.bot_id,
            collection_name="test_collection",
            project="test_project",
            kb_type=KBType.AutoQA,
            bucket_name="test_bucket",
            tos_client=mock_tos_client,
            vikingkb=mock_viking_service,
        )

    # Act & Assert
    with pytest.raises(Exception) as exc_info:
        await kb_manager.add_from_qa(question="测试问题", answer="测试答案", msg_id=test_message.msg_id)

    assert "Chat with id non_existent_chat not found" in str(exc_info.value)
