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
import os
import uuid
from datetime import datetime

import pytest
import pytest_asyncio
from beanie import init_beanie
from mongomock_motor import AsyncMongoMockClient

from veaiops.schema.types import ChannelType

# Initialize settings for testing BEFORE importing document models
from veaiops.settings import (
    AgentSettings,
    BotSettings,
    EncryptionSettings,
    LogSettings,
    MongoSettings,
    O11ySettings,
    VolcEngineSettings,
    WebhookSettings,
    get_settings,
    init_settings,
)
from veaiops.utils.crypto import EncryptedSecretStr

os.environ["WEBHOOK_EVENT_CENTER_URL"] = "http://localhost:8000"
os.environ["WEBHOOK_EVENT_CENTER_EXTERNAL_URL"] = "http://localhost:8000"
os.environ["WEBHOOK_INTELLIGENT_THRESHOLD_AGENT_URL"] = "http://localhost:6001"

import base64
import os
import secrets

if os.getenv("ENCRYPTION_KEY") is None:
    os.environ["ENCRYPTION_KEY"] = base64.b64encode(secrets.token_bytes(32)).decode("ascii")

# Initialize settings for testing
init_settings(
    MongoSettings,
    LogSettings,
    WebhookSettings,
    BotSettings,
    O11ySettings,
    VolcEngineSettings,
    AgentSettings,
    EncryptionSettings,
)


# Import document models AFTER settings are initialized
from veaiops.schema.documents import (  # noqa: E402
    AgentNotification,
    AgentTemplate,
    AlarmSyncRecord,
    AutoIntelligentThresholdTaskRecord,
    AutoIntelligentThresholdTaskRecordDetail,
    Bot,
    BotAttribute,
    Chat,
    Connect,
    Customer,
    DataSource,
    Event,
    EventNoticeDetail,
    EventNoticeFeedback,
    InformStrategy,
    IntelligentThresholdTask,
    IntelligentThresholdTaskVersion,
    Interest,
    Message,
    MetricTemplate,
    Product,
    Project,
    Subscribe,
    User,
    VeKB,
)


# 使用延迟导入避免在模块加载时触发日志设置检查
def get_base_channel():
    """延迟导入BaseChannel以避免初始化问题"""
    from veaiops.channel.base import BaseChannel

    return BaseChannel


@pytest_asyncio.fixture(autouse=True)
async def my_fixture():
    """Fixture to set up and tear down the test environment."""
    client = AsyncMongoMockClient(get_settings(MongoSettings).mongo_uri)
    await init_beanie(
        document_models=[
            AgentNotification,
            AgentTemplate,
            AlarmSyncRecord,
            AutoIntelligentThresholdTaskRecord,
            AutoIntelligentThresholdTaskRecordDetail,
            Bot,
            BotAttribute,
            Chat,
            Connect,
            Customer,
            DataSource,
            Event,
            EventNoticeDetail,
            EventNoticeFeedback,
            InformStrategy,
            IntelligentThresholdTask,
            IntelligentThresholdTaskVersion,
            Interest,
            Message,
            MetricTemplate,
            Product,
            Project,
            Subscribe,
            User,
            VeKB,
        ],
        database=client.get_database(name="mongodb_veaiops"),
    )


@pytest.fixture
def mock_channel(mocker):
    """Fixture to create a mock channel."""
    from veaiops.channel.base import BaseChannel

    channel = mocker.MagicMock(spec=BaseChannel)
    channel.msg = None

    async def check_idempotence_side_effect(doc, **kwargs):
        if "find_one" in dir(doc):
            result = await doc.find_one()
            return result is not None
        return False

    channel.check_idempotence = mocker.AsyncMock(side_effect=check_idempotence_side_effect)
    return channel


@pytest.fixture
def mock_async_http_client(mocker):
    """Factory fixture for creating mock async HTTP clients with proper context manager support.

    This fixture eliminates repetitive mock setup for async HTTP client tests.
    It provides a consistent way to create mock clients that work as async context managers.

    Usage:
        # Simple usage with default successful response
        mock_client = mock_async_http_client()

        # With custom response data
        mock_response = mocker.MagicMock()
        mock_response.raise_for_status = mocker.MagicMock()
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
            response.raise_for_status = mocker.MagicMock()

        mock_client = mocker.MagicMock()
        mock_client.post = mocker.AsyncMock(return_value=response)
        mock_client.__aenter__ = mocker.AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = mocker.AsyncMock(return_value=None)
        return mock_client

    return _create_mock_client


# ============================================================================
# Common fixtures shared across multiple test modules
# Prioritizing implementation from agents/chatops/conftest.py
# ============================================================================


@pytest.fixture(autouse=True)
def mock_api_calls(request, monkeypatch):
    """Mock document methods and API calls to avoid external dependencies in all tests.

    This fixture is auto-used to prevent unnecessary external calls during tests.
    Mocks:
    - Chat.set_chat_link: Avoids Lark API calls when setting chat links
    - Bot.generate_open_id: Avoids Lark API calls when creating bot documents

    get_bot_client itself is not mocked, allowing tests to use real logic with secret params
    or to provide their own mocks for specific test scenarios.

    Tests can mark themselves with  to disable these mocks.
    """

    # Allow tests to opt-out of these mocks by using
    if "skip_mock_api_calls" in request.keywords:
        return

    async def mock_set_chat_link(*args, **kwargs):
        """Mock Chat.set_chat_link to avoid Lark API calls."""
        pass

    async def mock_generate_open_id(self):
        """Mock Bot.generate_open_id to avoid Lark API calls during Bot document creation."""
        pass

    monkeypatch.setattr("veaiops.schema.documents.chatops.chat.Chat.set_chat_link", mock_set_chat_link)
    monkeypatch.setattr("veaiops.schema.documents.config.bot.Bot.generate_open_id", mock_generate_open_id)


@pytest_asyncio.fixture
async def test_user():
    """Create and insert a user into the database for tests.

    Creates a test user with predefined configuration and cleans up after test.

    Yields:
        User: Test user document with username="test_user"
    """

    user = await User(
        username="test_user",
        email="test@example.com",
        password=EncryptedSecretStr("test_password"),
    ).insert()

    yield user

    # Cleanup - delete user after test
    await user.delete()


@pytest_asyncio.fixture
async def test_bot(test_user):
    """Create and insert a bot into the database for tests.

    Creates a test bot with predefined configuration and cleans up after test.
    Associates the bot with the test_user.

    Args:
        test_user: The test_user fixture

    Yields:
        Bot: Test bot document with bot_id="test_bot_123"
    """

    bot = await Bot(
        bot_id="test_bot_123",
        channel=ChannelType.Lark,
        secret=EncryptedSecretStr("test_secret_123"),
        name="Test Bot",
        open_id="test_open_id_123",
        created_user=test_user.username,
        updated_user=test_user.username,
    ).insert()

    yield bot

    # Cleanup - delete bot after test
    await bot.delete()


@pytest_asyncio.fixture
async def test_chat(test_bot):
    """Create and insert a chat into the database for tests.

    Requires test_bot fixture. Creates a test chat associated with the bot.

    Args:
        test_bot: The test bot fixture

    Yields:
        Chat: Test chat document with chat_id="test_chat_123"
    """
    from veaiops.schema.documents.chatops.chat import Chat

    chat = await Chat(
        chat_id="test_chat_123",
        bot_id=test_bot.bot_id,
        channel=test_bot.channel,
        name="Test chat",
        enable_func_interest=True,
        enable_func_proactive_reply=True,
    ).insert()

    yield chat

    # Cleanup - delete chat after test
    await chat.delete()


@pytest_asyncio.fixture
async def test_messages():
    """Factory fixture to create messages with automatic cleanup.

    This fixture returns a factory function to create multiple messages.
    All created messages are automatically cleaned up after the test.

    Usage in tests:
        async def test_example(test_messages):
            # Create first message
            msg1 = await test_messages(
                bot_id="test_bot",
                chat_id="chat1",
                content="Hello",
                msg_time=datetime.now()
            )

            # Create second message with proactive_reply
            msg2 = await test_messages(
                bot_id="test_bot",
                chat_id="chat1",
                content="Question",
                msg_time=datetime.now(),
                proactive_reply={"answer": "Answer"}
            )
            # All messages automatically cleaned up after test

    Yields:
        Callable: Factory function to create messages
    """
    from google.genai.types import Part

    from veaiops.schema.documents.chatops.message import Message
    from veaiops.schema.types import ChannelType, ChatType, MsgSenderType

    messages = []

    async def _create(
        bot_id: str = "test_bot",
        chat_id: str = "test_chat",
        content: str = "Test message",
        msg_time: datetime | None = None,
        msg_sender_id: str = "user123",
        channel: ChannelType = ChannelType.Lark,
        is_mentioned: bool = False,
        proactive_reply: dict | None = None,
    ) -> Message:
        """Create a test message and insert into database."""
        if msg_time is None:
            msg_time = datetime(2025, 1, 15, 10, 0, 0)

        message = Message(
            channel=channel,
            bot_id=bot_id,
            chat_id=chat_id,
            chat_type=ChatType.Group,
            msg=content,
            msg_id=str(uuid.uuid4()),
            msg_time=msg_time,
            msg_sender_id=msg_sender_id,
            msg_sender_type=MsgSenderType.USER,
            msg_llm_compatible=[Part(text=content)],
            is_mentioned=is_mentioned,
        )
        await message.insert()

        # Add ProactiveReply if provided
        if proactive_reply:
            from veaiops.schema.models.chatops import ProactiveReply

            message.proactive_reply = ProactiveReply(**proactive_reply)
            await message.save()

        messages.append(message)
        return message

    yield _create

    # Cleanup all created messages
    for msg in messages:
        try:
            await msg.delete()
        except Exception:
            pass
