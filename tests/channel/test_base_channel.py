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

"""Tests for base channel functionality."""

from datetime import datetime

import pytest

from tests.channel.utils import create_lark_message_payload
from veaiops.channel.lark.lark import LarkChannel
from veaiops.schema.documents.chatops.chat import Chat
from veaiops.schema.documents.chatops.message import Message


@pytest.mark.asyncio
async def test_check_idempotence_with_existing_message(mock_channel, test_bot, test_messages):
    """Test check_idempotence returns True when message already exists."""
    # Arrange - create a message in database
    await test_messages(
        bot_id=test_bot.bot_id, chat_id="test_chat", content="Test message", msg_time=datetime(2025, 1, 1, 10, 0, 0)
    )

    # Find the created message to get its msg_id
    existing_msg = await Message.find_one(Message.bot_id == test_bot.bot_id)
    assert existing_msg is not None

    # Act - check idempotence with the existing message's ID
    result = await mock_channel.check_idempotence(Message, bot_id=test_bot.bot_id, msg_id=existing_msg.msg_id)

    # Assert - should return True indicating message exists
    assert result is True


@pytest.mark.asyncio
async def test_check_idempotence_with_non_existing_message(mock_channel, test_bot):
    """Test check_idempotence returns False when message does not exist."""
    # Act - check idempotence for non-existent message
    result = await mock_channel.check_idempotence(Message, bot_id=test_bot.bot_id, msg_id="non_existent_msg_id")

    # Assert - should return False indicating message doesn't exist
    assert result is False


@pytest.mark.asyncio
async def test_check_idempotence_with_multiple_criteria(mock_channel, test_bot, test_chat, test_messages):
    """Test check_idempotence with multiple filter criteria."""
    # Arrange - create messages with different combinations
    msg1 = await test_messages(bot_id=test_bot.bot_id, chat_id=test_chat.chat_id, content="Message 1")
    await test_messages(bot_id=test_bot.bot_id, chat_id="other_chat", content="Message 2")

    # Act - check with multiple criteria matching msg1
    result_match = await mock_channel.check_idempotence(
        Message, bot_id=test_bot.bot_id, chat_id=test_chat.chat_id, msg_id=msg1.msg_id
    )

    # Act - check with multiple criteria not matching any single message
    result_no_match = await mock_channel.check_idempotence(
        Message, bot_id=test_bot.bot_id, chat_id="different_chat", msg_id="different_msg"
    )

    # Assert
    assert result_match is True
    assert result_no_match is False


@pytest.mark.asyncio
async def test_check_idempotence_distinguishes_different_bots(mock_channel, test_bot, test_messages):
    """Test check_idempotence correctly distinguishes messages from different bots."""
    # Arrange - create message for test_bot
    msg = await test_messages(bot_id=test_bot.bot_id, chat_id="test_chat", content="Test message")

    # Act - check with correct bot_id
    result_correct_bot = await mock_channel.check_idempotence(Message, bot_id=test_bot.bot_id, msg_id=msg.msg_id)

    # Act - check with different bot_id
    result_different_bot = await mock_channel.check_idempotence(Message, bot_id="different_bot", msg_id=msg.msg_id)

    # Assert - should only find message with correct bot_id
    assert result_correct_bot is True
    assert result_different_bot is False


@pytest.mark.asyncio
async def test_check_idempotence_with_concurrent_messages(mock_channel, test_bot, test_messages):
    """Test check_idempotence works correctly with multiple messages in database."""
    # Arrange - create multiple messages
    msg1 = await test_messages(bot_id=test_bot.bot_id, chat_id="chat1", content="Message 1")
    msg2 = await test_messages(bot_id=test_bot.bot_id, chat_id="chat2", content="Message 2")
    msg3 = await test_messages(bot_id=test_bot.bot_id, chat_id="chat3", content="Message 3")

    # Act - check each message individually
    result1 = await mock_channel.check_idempotence(Message, bot_id=test_bot.bot_id, msg_id=msg1.msg_id)
    result2 = await mock_channel.check_idempotence(Message, bot_id=test_bot.bot_id, msg_id=msg2.msg_id)
    result3 = await mock_channel.check_idempotence(Message, bot_id=test_bot.bot_id, msg_id=msg3.msg_id)
    result_none = await mock_channel.check_idempotence(Message, bot_id=test_bot.bot_id, msg_id="non_existent")

    # Assert - each message should be found correctly
    assert result1 is True
    assert result2 is True
    assert result3 is True
    assert result_none is False


@pytest.mark.asyncio
async def test_check_idempotence_after_message_deletion(mock_channel, test_bot, test_messages):
    """Test check_idempotence returns False after message is deleted."""
    # Arrange - create and then delete a message
    msg = await test_messages(bot_id=test_bot.bot_id, chat_id="test_chat", content="Test message")
    msg_id = msg.msg_id

    # Verify message exists first
    result_before = await mock_channel.check_idempotence(Message, bot_id=test_bot.bot_id, msg_id=msg_id)
    assert result_before is True

    # Delete the message
    await msg.delete()

    # Act - check idempotence after deletion
    result_after = await mock_channel.check_idempotence(Message, bot_id=test_bot.bot_id, msg_id=msg_id)

    # Assert - should return False after deletion
    assert result_after is False


@pytest.mark.asyncio
async def test_check_idempotence_with_invalid_field():
    """Test check_idempotence handles invalid field names gracefully."""

    channel = LarkChannel()

    # Act - check with non-existent field
    result = await channel.check_idempotence(
        Message, bot_id="test_bot", invalid_field_name="invalid_value", msg_id="test_msg"
    )

    # Assert - should still check valid fields and ignore invalid ones
    assert result is False


@pytest.mark.asyncio
async def test_check_idempotence_with_no_valid_fields():
    """Test check_idempotence returns False when no valid filter criteria."""

    channel = LarkChannel()

    # Act - check with only invalid fields
    result = await channel.check_idempotence(Message, completely_invalid_field="value")

    # Assert - should return False
    assert result is False


@pytest.mark.asyncio
async def test_check_idempotence_with_chat_document(test_bot, test_chat):
    """Test check_idempotence works with Chat document class."""

    channel = LarkChannel()

    # Act - check existing chat
    result_exists = await channel.check_idempotence(Chat, bot_id=test_bot.bot_id, chat_id=test_chat.chat_id)

    # Act - check non-existing chat
    result_not_exists = await channel.check_idempotence(Chat, bot_id=test_bot.bot_id, chat_id="non_existent_chat")

    # Assert
    assert result_exists is True
    assert result_not_exists is False


@pytest.mark.asyncio
async def test_check_idempotence_exception_handling(mocker):
    """Test check_idempotence handles exceptions gracefully."""

    channel = LarkChannel()

    # Mock find_one to raise an exception
    mocker.patch.object(Message, "find_one", side_effect=Exception("Database error"))

    # Act - should catch exception and return False
    result = await channel.check_idempotence(Message, bot_id="test_bot", msg_id="test_msg")

    # Assert
    assert result is False


@pytest.mark.asyncio
async def test_run_msg_payload_with_valid_payload(mock_channel, test_bot, mocker):
    """Test run_msg_payload processes valid payload correctly."""

    # Mock chatops_agents_handler - needs to be in the agents module
    mock_handler = mocker.patch("veaiops.agents.chatops.chatops_agents_handler")

    payload = create_lark_message_payload(
        bot_id=test_bot.bot_id, chat_id="test_run_msg_chat", msg_id="test_run_msg", content='{"text": "Test"}'
    )

    # Create chat first so recreate_chat_from_payload won't be called
    chat = Chat(bot_id=test_bot.bot_id, chat_id="test_run_msg_chat", name="Test Chat", channel=mock_channel.channel)
    await chat.insert()

    await mock_channel.run_msg_payload(payload)

    # Verify handler was called
    assert mock_handler.called

    # Cleanup
    msg = await Message.find_one(Message.msg_id == "test_run_msg")
    if msg:
        await msg.delete()
    await chat.delete()


@pytest.mark.asyncio
async def test_run_msg_payload_creates_chat_if_not_exist(mock_channel, test_bot, mocker):
    """Test run_msg_payload creates chat when it doesn't exist."""

    mocker.patch("veaiops.agents.chatops.chatops_agents_handler")
    mock_recreate = mocker.patch.object(mock_channel, "recreate_chat_from_payload")

    payload = create_lark_message_payload(
        bot_id=test_bot.bot_id, chat_id="test_new_chat", msg_id="test_new_msg", content='{"text": "Test"}'
    )

    await mock_channel.run_msg_payload(payload)

    # Verify recreate_chat_from_payload was called
    assert mock_recreate.called

    # Cleanup
    msg = await Message.find_one(Message.msg_id == "test_new_msg")
    if msg:
        await msg.delete()


@pytest.mark.asyncio
async def test_run_msg_payload_handles_none_message(mock_channel, mocker):
    """Test run_msg_payload handles case when payload_to_msg returns None."""
    mock_handler = mocker.patch("veaiops.agents.chatops.chatops_agents_handler")
    mock_payload_to_msg = mocker.patch.object(mock_channel, "payload_to_msg", return_value=None)

    payload = {"event": {"type": "unknown"}}

    await mock_channel.run_msg_payload(payload)

    # Handler should not be called when message is None
    assert not mock_handler.called
    assert mock_payload_to_msg.called
