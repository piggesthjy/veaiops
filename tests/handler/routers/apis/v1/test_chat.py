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

import pytest
from fastapi import BackgroundTasks

from veaiops.handler.errors import RecordNotFoundError
from veaiops.handler.routers.apis.v1.chat import get_chats_by_bot_id, update_chat_config
from veaiops.schema.documents import Bot, Chat
from veaiops.schema.models.chatops.chat import ChatConfigUpdatePayload


@pytest.mark.asyncio
async def test_get_chats_by_bot_id_success(test_bot, test_chat):
    """Test successfully retrieving chats by bot ID."""
    # Arrange
    background_tasks = BackgroundTasks()

    # Act
    response = await get_chats_by_bot_id(
        uid=test_bot.id, background_tasks=background_tasks, skip=0, limit=100, force_update=False
    )

    # Assert
    assert response.message == "Chats retrieved successfully"
    assert response.total >= 1
    assert len(response.data) >= 1
    assert any(chat.chat_id == test_chat.chat_id for chat in response.data)


@pytest.mark.asyncio
async def test_get_chats_by_bot_id_with_pagination(test_bot, test_chat):
    """Test pagination for chat retrieval."""
    # Arrange - Create additional chat
    additional_chat = await Chat(
        chat_id="test_chat_additional",
        bot_id=test_bot.bot_id,
        channel=test_bot.channel,
        name="Additional chat",
        enable_func_interest=True,
        enable_func_proactive_reply=True,
    ).insert()

    background_tasks = BackgroundTasks()

    # Act - Get first chat only
    response = await get_chats_by_bot_id(
        uid=test_bot.id, background_tasks=background_tasks, skip=0, limit=1, force_update=False
    )

    # Assert
    assert response.total >= 2
    assert len(response.data) == 1
    assert response.limit == 1
    assert response.skip == 0

    # Cleanup
    await additional_chat.delete()


@pytest.mark.asyncio
async def test_get_chats_by_bot_id_with_skip(test_bot, test_chat):
    """Test skip parameter in pagination."""
    # Arrange
    background_tasks = BackgroundTasks()

    # Act
    response = await get_chats_by_bot_id(
        uid=test_bot.id, background_tasks=background_tasks, skip=1, limit=100, force_update=False
    )

    # Assert
    assert response.skip == 1


@pytest.mark.asyncio
async def test_get_chats_by_bot_id_not_found():
    """Test retrieving chats with nonexistent bot ID."""
    # Arrange
    from beanie import PydanticObjectId

    fake_bot_id = PydanticObjectId()
    background_tasks = BackgroundTasks()

    # Act & Assert
    with pytest.raises(RecordNotFoundError):
        await get_chats_by_bot_id(
            uid=fake_bot_id, background_tasks=background_tasks, skip=0, limit=100, force_update=False
        )


@pytest.mark.asyncio
async def test_get_chats_by_bot_id_force_update(test_bot, test_chat, monkeypatch):
    """Test force_update triggers background task."""
    # Arrange
    background_tasks = BackgroundTasks()
    reload_called = []

    async def mock_reload_bot_group_chat(bot_id, channel):
        reload_called.append((bot_id, channel))

    monkeypatch.setattr("veaiops.handler.routers.apis.v1.chat.reload_bot_group_chat", mock_reload_bot_group_chat)

    # Act
    await get_chats_by_bot_id(uid=test_bot.id, background_tasks=background_tasks, skip=0, limit=100, force_update=True)

    # Execute background tasks
    await background_tasks()

    # Assert
    assert len(reload_called) == 1
    assert reload_called[0] == (test_bot.bot_id, test_bot.channel)


@pytest.mark.asyncio
async def test_get_chats_by_bot_id_no_chats(test_bot):
    """Test retrieving chats when bot has no chats."""
    # Arrange - Create bot without chats
    bot = await Bot(
        bot_id="bot_no_chats",
        channel=test_bot.channel,
        secret=test_bot.secret,
        name="Bot with no chats",
        open_id="bot_no_chats_open_id",
    ).insert()

    background_tasks = BackgroundTasks()

    # Act
    response = await get_chats_by_bot_id(
        uid=bot.id, background_tasks=background_tasks, skip=0, limit=100, force_update=False
    )

    # Assert
    assert response.total == 0
    assert len(response.data) == 0

    # Cleanup
    await bot.delete()


@pytest.mark.asyncio
async def test_update_chat_config_success(test_chat):
    """Test successful chat config update."""
    # Arrange
    update_payload = ChatConfigUpdatePayload(enable_func_proactive_reply=False, enable_func_interest=False)

    # Act
    response = await update_chat_config(uid=test_chat.id, config_update=update_payload)

    # Assert
    assert response.message == "Chat configuration updated successfully"
    assert response.data.enable_func_proactive_reply is False
    assert response.data.enable_func_interest is False


@pytest.mark.asyncio
async def test_update_chat_config_partial_update(test_chat):
    """Test partial chat config update."""
    # Arrange
    original_interest = test_chat.enable_func_interest
    update_payload = ChatConfigUpdatePayload(
        enable_func_proactive_reply=False,
        enable_func_interest=None,  # Don't update this field
    )

    # Act
    response = await update_chat_config(uid=test_chat.id, config_update=update_payload)

    # Assert
    assert response.data.enable_func_proactive_reply is False
    assert response.data.enable_func_interest == original_interest  # Unchanged


@pytest.mark.asyncio
async def test_update_chat_config_enable_features(test_chat):
    """Test enabling chat features."""
    # Arrange - First disable features
    test_chat.enable_func_proactive_reply = False
    test_chat.enable_func_interest = False
    await test_chat.save()

    update_payload = ChatConfigUpdatePayload(enable_func_proactive_reply=True, enable_func_interest=True)

    # Act
    response = await update_chat_config(uid=test_chat.id, config_update=update_payload)

    # Assert
    assert response.data.enable_func_proactive_reply is True
    assert response.data.enable_func_interest is True


@pytest.mark.asyncio
async def test_update_chat_config_not_found():
    """Test updating config for nonexistent chat."""
    # Arrange
    from beanie import PydanticObjectId

    fake_chat_id = PydanticObjectId()
    update_payload = ChatConfigUpdatePayload(enable_func_proactive_reply=False, enable_func_interest=False)

    # Act & Assert
    with pytest.raises(RecordNotFoundError):
        await update_chat_config(uid=fake_chat_id, config_update=update_payload)


@pytest.mark.asyncio
async def test_update_chat_config_persists(test_chat):
    """Test that chat config update persists to database."""
    # Arrange
    update_payload = ChatConfigUpdatePayload(enable_func_proactive_reply=False, enable_func_interest=True)

    # Act
    await update_chat_config(uid=test_chat.id, config_update=update_payload)

    # Fetch from database
    updated_chat = await Chat.get(test_chat.id)

    # Assert
    assert updated_chat.enable_func_proactive_reply is False
    assert updated_chat.enable_func_interest is True


@pytest.mark.asyncio
async def test_chat_config_update_payload_validation():
    """Test ChatConfigUpdatePayload model validation."""
    # Act
    payload = ChatConfigUpdatePayload(enable_func_proactive_reply=True, enable_func_interest=None)

    # Assert
    assert payload.enable_func_proactive_reply is True
    assert payload.enable_func_interest is None
