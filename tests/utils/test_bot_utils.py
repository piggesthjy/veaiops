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

import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import pytest_asyncio

from veaiops.schema.documents import Bot, Chat
from veaiops.schema.types import ChannelType
from veaiops.utils.bot import check_bot_configuration, refresh_lark_bot_group_chat, reload_bot_group_chat
from veaiops.utils.crypto import EncryptedSecretStr


@pytest_asyncio.fixture
async def create_test_bot():
    """Factory fixture to create test bots with custom bot_id.

    This fixture provides a function to create Bot documents with specific bot_ids,
    which is useful when tests need different bot identifiers.

    Yields:
        A callable that creates and inserts a Bot, returning the created bot.
    """
    created_bots = []

    async def _create_bot(bot_id: str = "test_bot_id", channel: ChannelType = ChannelType.Lark) -> Bot:
        """Create a test bot with the given bot_id."""
        encrypted_secret = EncryptedSecretStr("test_secret")
        bot = Bot(
            bot_id=bot_id,
            channel=channel,
            secret=EncryptedSecretStr(encrypted_secret.get_secret_value()),
            name=f"Test Bot {bot_id}",
        )
        await bot.insert()
        created_bots.append(bot)
        return bot

    yield _create_bot

    # Cleanup - delete all created bots after test
    for bot in created_bots:
        try:
            await bot.delete()
        except Exception:
            pass


@pytest.mark.asyncio
async def test_refresh_lark_bot_group_chat_bot_not_found():
    """Test refresh_lark_bot_group_chat when bot is not found."""
    bot_id = "test_bot_id"
    channel = ChannelType.Lark

    # No bot in database
    await refresh_lark_bot_group_chat(bot_id, channel)


@pytest.mark.asyncio
async def test_refresh_lark_bot_group_chat_client_not_exist(create_test_bot):
    """Test refresh_lark_bot_group_chat when client does not exist (invalid credentials)."""
    bot_id = "invalid_bot_id"
    channel = ChannelType.Lark

    # Create a bot with invalid secret to simulate client creation failure
    await create_test_bot(bot_id=bot_id, channel=channel)

    # Mock get_bot_client to return None (simulates client creation failure)
    with patch("veaiops.utils.bot.get_bot_client", return_value=None):
        await refresh_lark_bot_group_chat(bot_id, channel)


@pytest.mark.asyncio
async def test_refresh_lark_bot_group_chat_success_single_page(create_test_bot):
    """Test refresh_lark_bot_group_chat with successful single page response."""
    bot_id = "test_bot_id"
    channel = ChannelType.Lark

    # Create a bot with properly encrypted secret
    await create_test_bot(bot_id=bot_id, channel=channel)

    # Create existing chat
    existing_chat = Chat(
        bot_id=bot_id,
        chat_id="chat_1",
        channel=channel,
        name="Old Name",
        is_active=True,
    )
    # Chat.set_chat_link is already mocked by fixture
    await existing_chat.insert()

    # Mock lark client response
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.success.return_value = True
    mock_response.raw.content = json.dumps(
        {
            "data": {
                "items": [
                    {"chat_id": "chat_1", "name": "Updated Chat 1"},
                    {"chat_id": "chat_2", "name": "New Chat 2"},
                ],
                "has_more": False,
            }
        }
    ).encode()

    mock_client.im.v1.chat.alist = AsyncMock(return_value=mock_response)

    # Use real get_bot_client with mocked Lark client builder
    with patch("lark_oapi.Client.builder") as mock_builder:
        mock_builder.return_value.app_id.return_value.app_secret.return_value.build.return_value = mock_client
        await refresh_lark_bot_group_chat(bot_id, channel)

    # Verify chats were updated
    updated_chat_1 = await Chat.find_one(Chat.bot_id == bot_id, Chat.chat_id == "chat_1")
    assert updated_chat_1 is not None
    assert updated_chat_1.name == "Updated Chat 1"

    # Verify new chat was created
    new_chat_2 = await Chat.find_one(Chat.bot_id == bot_id, Chat.chat_id == "chat_2")
    assert new_chat_2 is not None
    assert new_chat_2.name == "New Chat 2"


@pytest.mark.asyncio
async def test_refresh_lark_bot_group_chat_success_multiple_pages(create_test_bot):
    """Test refresh_lark_bot_group_chat with pagination."""
    bot_id = "test_bot_id"
    channel = ChannelType.Lark

    # Create a bot with properly encrypted secret
    await create_test_bot(bot_id=bot_id, channel=channel)


@pytest.mark.asyncio
async def test_refresh_lark_bot_group_chat_api_failure(create_test_bot):
    """Test refresh_lark_bot_group_chat when Lark API fails."""
    bot_id = "test_bot_id"
    channel = ChannelType.Lark

    # Create a bot with properly encrypted secret
    await create_test_bot(bot_id=bot_id, channel=channel)

    # Mock failed response - use local mock to mock get_bot_client to return mock client with failing response
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.success.return_value = False
    mock_response.msg = "API Error"
    mock_response.get_log_id.return_value = "log_123"

    mock_client.im.v1.chat.alist = AsyncMock(return_value=mock_response)

    # Mock get_bot_client directly to avoid using lark_oapi.Client.builder
    with patch("veaiops.utils.bot.get_bot_client", return_value=mock_client):
        with pytest.raises(Exception) as exc_info:
            await refresh_lark_bot_group_chat(bot_id, channel)

        assert "Failed to fetch chat list" in str(exc_info.value)
        assert "API Error" in str(exc_info.value)


@pytest.mark.asyncio
async def test_refresh_lark_bot_group_chat_deactivate_old_chats(create_test_bot):
    """Test that old chats are marked as inactive."""
    bot_id = "test_bot_id"
    channel = ChannelType.Lark

    # Create a bot with properly encrypted secret
    await create_test_bot(bot_id=bot_id, channel=channel)

    # Create chats that will be deactivated
    old_chat = Chat(
        bot_id=bot_id,
        chat_id="old_chat",
        channel=channel,
        name="Old Chat",
        is_active=True,
    )
    # Chat.set_chat_link is already mocked by fixture
    await old_chat.insert()

    # Mock response with only new chat
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.success.return_value = True
    mock_response.raw.content = json.dumps(
        {
            "data": {
                "items": [{"chat_id": "new_chat", "name": "New Chat"}],
                "has_more": False,
            }
        }
    ).encode()

    mock_client.im.v1.chat.alist = AsyncMock(return_value=mock_response)

    # Use real get_bot_client with mocked Lark client builder
    with patch("lark_oapi.Client.builder") as mock_builder:
        mock_builder.return_value.app_id.return_value.app_secret.return_value.build.return_value = mock_client
        await refresh_lark_bot_group_chat(bot_id, channel)

    # Verify old chat was deactivated
    updated_old_chat = await Chat.find_one(Chat.bot_id == bot_id, Chat.chat_id == "old_chat")
    assert updated_old_chat is not None
    assert updated_old_chat.is_active is False


@pytest.mark.asyncio
async def test_reload_bot_group_chat_bot_not_found():
    """Test reload_bot_group_chat when bot is not found."""
    bot_id = "test_bot_id"
    channel = ChannelType.Lark

    await reload_bot_group_chat(bot_id, channel)


@pytest.mark.asyncio
async def test_reload_bot_group_chat_lark_success(create_test_bot):
    """Test reload_bot_group_chat for Lark channel."""
    bot_id = "test_bot_id"
    channel = ChannelType.Lark

    # Create a bot with properly encrypted secret
    await create_test_bot(bot_id=bot_id, channel=channel)

    with patch("veaiops.utils.bot.refresh_lark_bot_group_chat") as mock_refresh:
        await reload_bot_group_chat(bot_id, channel)
        mock_refresh.assert_called_once_with(bot_id=bot_id, channel=channel)


@pytest.mark.asyncio
async def test_check_bot_configuration_lark_success():
    """Test check_bot_configuration for Lark channel with valid configuration."""
    app_id = "test_app_id"
    app_secret = "test_app_secret"
    channel = ChannelType.Lark

    # Mock the lark_oapi client
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.success.return_value = True
    mock_response.data = MagicMock()
    mock_response.data.scopes = ["scope1", "scope2"]  # Non-empty scopes

    # Patch lark_oapi.Client.builder() to return our mock client
    with patch("lark_oapi.Client.builder") as mock_builder:
        mock_builder.return_value.app_id.return_value.app_secret.return_value.build.return_value = mock_client
        mock_client.application.v6.scope.list = MagicMock(return_value=mock_response)

        # Should not raise any exception
        await check_bot_configuration(app_id, app_secret, channel)


@pytest.mark.asyncio
async def test_check_bot_configuration_lark_permission_denied():
    """Test check_bot_configuration when permission is denied."""
    app_id = "test_app_id"
    app_secret = "test_app_secret"
    channel = ChannelType.Lark

    # Mock the lark_oapi client with failed response
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.success.return_value = False

    with patch("lark_oapi.Client.builder") as mock_builder:
        mock_builder.return_value.app_id.return_value.app_secret.return_value.build.return_value = mock_client
        mock_client.application.v6.scope.list = MagicMock(return_value=mock_response)

        with pytest.raises(PermissionError) as exc_info:
            await check_bot_configuration(app_id, app_secret, channel)

        assert "list permission denied" in str(exc_info.value)


@pytest.mark.asyncio
async def test_check_bot_configuration_lark_no_permission_set():
    """Test check_bot_configuration when bot permission is not set."""
    app_id = "test_app_id"
    app_secret = "test_app_secret"
    channel = ChannelType.Lark

    # Mock the lark_oapi client with empty scopes
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.success.return_value = True
    mock_response.data = MagicMock()
    mock_response.data.scopes = []  # Empty scopes

    with patch("lark_oapi.Client.builder") as mock_builder:
        mock_builder.return_value.app_id.return_value.app_secret.return_value.build.return_value = mock_client
        mock_client.application.v6.scope.list = MagicMock(return_value=mock_response)

        with pytest.raises(PermissionError) as exc_info:
            await check_bot_configuration(app_id, app_secret, channel)

        assert "Bot Permission is not set" in str(exc_info.value)


@pytest.mark.asyncio
async def test_check_bot_configuration_lark_no_data():
    """Test check_bot_configuration when response data is None."""
    app_id = "test_app_id"
    app_secret = "test_app_secret"
    channel = ChannelType.Lark

    # Mock the lark_oapi client with None data
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.success.return_value = True
    mock_response.data = None  # No data

    with patch("lark_oapi.Client.builder") as mock_builder:
        mock_builder.return_value.app_id.return_value.app_secret.return_value.build.return_value = mock_client
        mock_client.application.v6.scope.list = MagicMock(return_value=mock_response)

        with pytest.raises(PermissionError) as exc_info:
            await check_bot_configuration(app_id, app_secret, channel)

        assert "Bot Permission is not set" in str(exc_info.value)


@pytest.mark.asyncio
async def test_check_bot_configuration_unsupported_channel():
    """Test check_bot_configuration with unsupported channel type."""
    app_id = "test_app_id"
    app_secret = "test_app_secret"
    channel = ChannelType.DingTalk  # Unsupported channel

    with pytest.raises(NotImplementedError) as exc_info:
        await check_bot_configuration(app_id, app_secret, channel)

    assert "not implemented" in str(exc_info.value)
