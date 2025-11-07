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

from datetime import timedelta

import pytest

from tests.utils import get_test_base_time
from veaiops.agents.chatops.tools.chat_tools import get_chat_history


@pytest.mark.asyncio
async def test_get_chat_history_basic(test_messages):
    """Test basic chat history retrieval without date filters."""
    # Arrange
    chat_id = "test_chat_basic"
    base_time = get_test_base_time()
    await test_messages(
        chat_id=chat_id,
        content="Message 1",
        msg_time=base_time,
    )
    await test_messages(
        chat_id=chat_id,
        content="Message 2",
        msg_time=base_time + timedelta(hours=1),
    )

    # Act
    result = await get_chat_history(chat_id=chat_id)

    # Assert - Messages from same sender are merged into one Part
    assert len(result) == 1
    assert "Message 1" in result[0].text
    assert "Message 2" in result[0].text


@pytest.mark.asyncio
async def test_get_chat_history_with_end_date(test_messages):
    """Test chat history retrieval with end_date filter."""
    # Arrange
    chat_id = "test_chat_end_date"
    base_time = get_test_base_time()
    await test_messages(
        chat_id=chat_id, content="Message 1", msg_time=base_time + timedelta(days=-14), msg_sender_id="user1"
    )
    await test_messages(
        chat_id=chat_id, content="Message 2", msg_time=base_time + timedelta(days=-13), msg_sender_id="user2"
    )
    await test_messages(
        chat_id=chat_id, content="Message 3", msg_time=base_time + timedelta(days=-12), msg_sender_id="user3"
    )

    # Act - Only get messages before Jan 3
    result = await get_chat_history(chat_id=chat_id, end_date="2025-01-02 23:59:59")

    # Assert - Should get msg1 and msg2, in chronological order (oldest first)
    assert len(result) == 2
    assert "Message 1" in result[0].text
    assert "Message 2" in result[1].text


@pytest.mark.asyncio
async def test_get_chat_history_with_start_date(test_messages):
    """Test chat history retrieval with start_date filter."""
    # Arrange
    chat_id = "test_chat_start_date"
    base_time = get_test_base_time()
    await test_messages(
        chat_id=chat_id, content="Message 1", msg_time=base_time + timedelta(days=-14), msg_sender_id="user1"
    )
    await test_messages(
        chat_id=chat_id, content="Message 2", msg_time=base_time + timedelta(days=-13), msg_sender_id="user2"
    )
    await test_messages(
        chat_id=chat_id, content="Message 3", msg_time=base_time + timedelta(days=-12), msg_sender_id="user3"
    )

    # Act - Only get messages from Jan 2 onwards
    result = await get_chat_history(chat_id=chat_id, start_date="2025-01-02 00:00:00")

    # Assert - Should get msg2 and msg3, in chronological order (oldest first)
    assert len(result) == 2
    assert "Message 2" in result[0].text
    assert "Message 3" in result[1].text


@pytest.mark.asyncio
async def test_get_chat_history_with_both_dates(test_messages):
    """Test chat history retrieval with both start_date and end_date filters."""
    # Arrange
    chat_id = "test_chat_both_dates"
    base_time = get_test_base_time()
    await test_messages(
        chat_id=chat_id, content="Message 1", msg_time=base_time + timedelta(days=-14), msg_sender_id="user1"
    )
    await test_messages(
        chat_id=chat_id, content="Message 2", msg_time=base_time + timedelta(days=-13), msg_sender_id="user2"
    )
    await test_messages(
        chat_id=chat_id, content="Message 3", msg_time=base_time + timedelta(days=-12), msg_sender_id="user3"
    )
    await test_messages(
        chat_id=chat_id, content="Message 4", msg_time=base_time + timedelta(days=-11), msg_sender_id="user4"
    )

    # Act - Get messages from Jan 2 to Jan 3
    result = await get_chat_history(
        chat_id=chat_id,
        start_date="2025-01-02 00:00:00",
        end_date="2025-01-03 23:59:59",
    )

    # Assert - Should get msg2 and msg3, in chronological order (oldest first)
    assert len(result) == 2
    assert "Message 2" in result[0].text
    assert "Message 3" in result[1].text


@pytest.mark.asyncio
async def test_get_chat_history_invalid_start_date(test_messages):
    """Test chat history retrieval with invalid start_date format."""
    # Arrange
    chat_id = "test_chat_invalid_start"
    base_time = get_test_base_time()
    await test_messages(
        chat_id=chat_id,
        content="Message 1",
        msg_time=base_time + timedelta(days=-14),
    )

    # Act - Use invalid date format (should be ignored)
    result = await get_chat_history(chat_id=chat_id, start_date="invalid-date-format")

    # Assert - Should still return the message (invalid date ignored)
    assert len(result) == 1
    assert "Message 1" in result[0].text


@pytest.mark.asyncio
async def test_get_chat_history_invalid_end_date(test_messages):
    """Test chat history retrieval with invalid end_date format."""
    # Arrange
    chat_id = "test_chat_invalid_end"
    base_time = get_test_base_time()
    await test_messages(
        chat_id=chat_id,
        content="Message 1",
        msg_time=base_time + timedelta(days=-14),
    )

    # Act - Use invalid date format (should be ignored)
    result = await get_chat_history(chat_id=chat_id, end_date="2025-99-99 99:99:99")

    # Assert - Should still return the message (invalid date ignored)
    assert len(result) == 1
    assert "Message 1" in result[0].text


@pytest.mark.asyncio
async def test_get_chat_history_empty_result():
    """Test chat history retrieval with no messages found."""
    # Arrange
    chat_id = "test_chat_empty"

    # Act - Query non-existent chat
    result = await get_chat_history(chat_id=chat_id)

    # Assert
    assert len(result) == 0


@pytest.mark.asyncio
async def test_get_chat_history_message_order(test_messages):
    """Test that messages are returned in chronological order (oldest first)."""
    # Arrange
    chat_id = "test_chat_order"
    base_time = get_test_base_time()
    await test_messages(
        chat_id=chat_id, content="Oldest", msg_time=base_time + timedelta(days=-14), msg_sender_id="user1"
    )
    await test_messages(
        chat_id=chat_id, content="Middle", msg_time=base_time + timedelta(days=-13), msg_sender_id="user2"
    )
    await test_messages(
        chat_id=chat_id, content="Newest", msg_time=base_time + timedelta(days=-12), msg_sender_id="user3"
    )

    # Act
    result = await get_chat_history(chat_id=chat_id)

    # Assert - chronological order (oldest first)
    assert len(result) == 3
    assert "Oldest" in result[0].text
    assert "Middle" in result[1].text
    assert "Newest" in result[2].text


@pytest.mark.asyncio
async def test_get_chat_history_different_chats(test_messages):
    """Test that messages from different chats are correctly isolated."""
    # Arrange
    chat_id_1 = "test_chat_isolation_1"
    chat_id_2 = "test_chat_isolation_2"
    base_time = get_test_base_time()
    await test_messages(
        chat_id=chat_id_1, content="Chat 1 Message", msg_time=base_time + timedelta(days=-14), msg_sender_id="user1"
    )
    await test_messages(
        chat_id=chat_id_2, content="Chat 2 Message", msg_time=base_time + timedelta(days=-14), msg_sender_id="user2"
    )

    # Act
    result_chat_1 = await get_chat_history(chat_id=chat_id_1)
    result_chat_2 = await get_chat_history(chat_id=chat_id_2)

    # Assert - Each chat should only see its own messages
    assert len(result_chat_1) == 1
    assert "Chat 1 Message" in result_chat_1[0].text
    assert len(result_chat_2) == 1
    assert "Chat 2 Message" in result_chat_2[0].text
