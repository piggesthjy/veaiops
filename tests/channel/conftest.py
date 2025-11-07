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

"""Shared fixtures for channel tests."""

import pytest
import pytest_asyncio

from veaiops.channel.lark.lark import LarkChannel

# Note: Common fixtures (mock_api_calls, test_bot, test_chat, test_messages)
# are now defined in the root tests/conftest.py and automatically available


@pytest.fixture(autouse=True)
def mock_lark_client_builder(mocker):
    """Auto-use fixture to mock lark_oapi.Client.builder for all channel tests.

    This fixture allows get_bot_client to run real logic (fetching Bot from DB)
    while preventing actual Lark API calls. By mocking the client builder,
    we avoid the need to mock get_bot_client in individual tests.

    This significantly reduces mock boilerplate and improves test clarity.
    """
    mock_client = mocker.MagicMock()
    mock_builder = mocker.MagicMock()
    mock_builder.build.return_value = mock_client

    mocker.patch("lark_oapi.Client.builder", return_value=mock_builder)
    return mock_client


@pytest.fixture
def mock_async_http_client(mocker):
    """Factory fixture for creating mock async HTTP clients.

    This fixture eliminates repetitive mock setup for async HTTP client tests.
    It provides a consistent way to create mock clients with proper context manager support.

    Usage:
        # Simple usage with default successful response
        mock_client = mock_async_http_client()

        # With custom response data
        mock_response = mocker.MagicMock()
        mock_response.is_success = True
        mock_response.json.return_value = {"data": {"message_id": "123"}}
        mock_client = mock_async_http_client(response=mock_response)
    """

    def _create_mock_client(response=None):
        """Create a mock async HTTP client.

        Args:
            response: Optional mock response object. If None, creates a default successful response.

        Returns:
            A MagicMock configured as an async context manager with post method.
        """
        if response is None:
            response = mocker.MagicMock()
            response.is_success = True
            response.json.return_value = {}

        mock_client = mocker.MagicMock()
        mock_client.post = mocker.AsyncMock(return_value=response)
        mock_client.__aenter__ = mocker.AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = mocker.AsyncMock(return_value=None)
        return mock_client

    return _create_mock_client


@pytest.fixture
def mock_lark_client_with_methods(mocker):
    """Mock Lark client with common message-related methods.

    Provides a preconfigured Lark client mock that can be patched into get_bot_client.
    Includes forward_message and reply_message methods.

    Usage:
        def test_something(mocker, mock_lark_client_with_methods):
            mock_client = mock_lark_client_with_methods(
                forward_return="forwarded_msg_123",
                reply_return="reply_msg_456"
            )
            mocker.patch("veaiops.channel.lark.lark.get_bot_client", return_value=mock_client)
    """

    def _create_mock_client(forward_return=None, reply_return=None):
        """Create a mock Lark client with message methods.

        Args:
            forward_return: Return value for forward_message call
            reply_return: Return value for reply_message call

        Returns:
            A configured MagicMock Lark client.
        """
        mock_client = mocker.MagicMock()

        if forward_return is not None:
            mocker.patch("veaiops.channel.lark.lark.forward_message", return_value=forward_return)
        if reply_return is not None:
            mocker.patch("veaiops.channel.lark.lark.reply_message", return_value=reply_return)

        return mock_client

    return _create_mock_client


@pytest_asyncio.fixture
async def mock_channel():
    """Create a mock channel instance for testing."""
    return LarkChannel()


@pytest_asyncio.fixture
async def test_messages_channel():
    """Factory fixture to create messages with automatic cleanup for channel tests.

    This is a specialized version that uses tests.channel.utils.create_message
    which has a slightly different signature than the root fixture.

    Usage in tests:
        async def test_example(test_messages_channel):
            msg1 = await test_messages_channel(bot_id="bot1", chat_id="chat1", content="Hello")
            msg2 = await test_messages_channel(bot_id="bot1", chat_id="chat1", content="World")
            # All messages automatically cleaned up after test
    """
    from datetime import datetime

    from tests.utils import create_message

    messages = []

    async def _create(bot_id: str, chat_id: str, content: str, **kwargs):
        """Create a message and insert into database."""
        # Adapt to the signature of tests.utils.create_message
        msg_time = kwargs.pop("msg_time", datetime.now())
        sender_id = kwargs.pop("sender_id", "test_sender")
        channel = kwargs.pop("channel", None)
        is_mentioned = kwargs.pop("is_mentioned", False)

        from veaiops.schema.types import ChannelType

        if channel is None:
            channel = ChannelType.Lark

        msg = await create_message(
            chat_id=chat_id,
            content=content,
            msg_time=msg_time,
            bot_id=bot_id,
            sender_id=sender_id,
            channel=channel,
            is_mentioned=is_mentioned,
        )
        messages.append(msg)
        return msg

    yield _create

    # Cleanup all created messages
    for msg in messages:
        try:
            await msg.delete()
        except Exception:
            pass
