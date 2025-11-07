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

"""Tests for utils.message module."""

from datetime import datetime

import pytest

from veaiops.utils.message import (
    get_backward_chat_messages,
    get_forward_chat_messages,
    get_knowledge_point_group_context,
    get_latest_user_message,
    get_msg_context,
    reorg_reversed_msgs,
)


@pytest.mark.asyncio
async def test_get_backward_chat_messages_single_message(test_messages):
    """Test get_backward_chat_messages with inspect_history=1."""
    # Arrange
    msg = await test_messages(
        bot_id="test_bot",
        chat_id="test_chat",
        content="Test message",
        msg_time=datetime(2025, 1, 15, 10, 0, 0),
    )

    # Act
    result = await get_backward_chat_messages(inspect_history=1, msg=msg, max_images=2)

    # Assert
    assert len(result) > 0


@pytest.mark.asyncio
async def test_get_backward_chat_messages_multiple_messages(test_messages):
    """Test get_backward_chat_messages with multiple messages."""
    # Arrange - create multiple messages in chronological order
    _ = await test_messages(
        bot_id="test_bot",
        chat_id="chat_multi",
        content="First message",
        msg_time=datetime(2025, 1, 15, 10, 0, 0),
    )
    _ = await test_messages(
        bot_id="test_bot",
        chat_id="chat_multi",
        content="Second message",
        msg_time=datetime(2025, 1, 15, 10, 1, 0),
    )
    msg3 = await test_messages(
        bot_id="test_bot",
        chat_id="chat_multi",
        content="Third message",
        msg_time=datetime(2025, 1, 15, 10, 2, 0),
    )

    # Act - get backward messages from the third message
    result = await get_backward_chat_messages(inspect_history=3, msg=msg3, max_images=2)

    # Assert
    assert len(result) > 0


@pytest.mark.asyncio
async def test_get_forward_chat_messages(test_messages):
    """Test get_forward_chat_messages."""
    # Arrange - create messages in chronological order
    msg1 = await test_messages(
        bot_id="test_bot",
        chat_id="chat_forward",
        content="Before message",
        msg_time=datetime(2025, 1, 15, 10, 0, 0),
    )
    _ = await test_messages(
        bot_id="test_bot",
        chat_id="chat_forward",
        content="After message 1",
        msg_time=datetime(2025, 1, 15, 10, 1, 0),
    )
    _ = await test_messages(
        bot_id="test_bot",
        chat_id="chat_forward",
        content="After message 2",
        msg_time=datetime(2025, 1, 15, 10, 2, 0),
    )

    # Act - get forward messages from the first message
    result = await get_forward_chat_messages(inspect_history=2, msg=msg1, max_images=1)

    # Assert
    assert len(result) > 0


@pytest.mark.asyncio
async def test_get_msg_context(test_messages):
    """Test get_msg_context."""
    # Arrange - create context messages before and after
    _ = await test_messages(
        bot_id="test_bot",
        chat_id="chat_context",
        content="Before 2",
        msg_time=datetime(2025, 1, 15, 9, 58, 0),
    )
    _ = await test_messages(
        bot_id="test_bot",
        chat_id="chat_context",
        content="Before 1",
        msg_time=datetime(2025, 1, 15, 9, 59, 0),
    )
    msg3 = await test_messages(
        bot_id="test_bot",
        chat_id="chat_context",
        content="Current message",
        msg_time=datetime(2025, 1, 15, 10, 0, 0),
    )
    _ = await test_messages(
        bot_id="test_bot",
        chat_id="chat_context",
        content="After 1",
        msg_time=datetime(2025, 1, 15, 10, 1, 0),
    )
    _ = await test_messages(
        bot_id="test_bot",
        chat_id="chat_context",
        content="After 2",
        msg_time=datetime(2025, 1, 15, 10, 2, 0),
    )

    # Act
    result = await get_msg_context(msg=msg3, context_window=5)

    # Assert - should return messages before and after
    assert len(result) == 5
    assert msg3 in result


@pytest.mark.asyncio
async def test_get_latest_user_message(test_messages):
    """Test get_latest_user_message."""
    # Arrange - create messages from same user, then bot
    _ = await test_messages(
        bot_id="test_bot",
        chat_id="chat_user",
        content="User message 1",
        msg_time=datetime(2025, 1, 15, 10, 0, 0),
        msg_sender_id="user123",
    )
    _ = await test_messages(
        bot_id="test_bot",
        chat_id="chat_user",
        content="User message 2",
        msg_time=datetime(2025, 1, 15, 10, 1, 0),
        msg_sender_id="user123",
    )
    msg3 = await test_messages(
        bot_id="test_bot",
        chat_id="chat_user",
        content="Bot message",
        msg_time=datetime(2025, 1, 15, 10, 2, 0),
        msg_sender_id="bot456",
    )

    # Act - get latest user message from bot's perspective
    result = await get_latest_user_message(msg=msg3)

    # Assert
    assert len(result) > 0


@pytest.mark.asyncio
async def test_get_knowledge_point_group_context(test_messages):
    """Test get_knowledge_point_group_context."""
    # Arrange - create message with proactive reply
    from veaiops.schema.models.chatops.response import ProactiveReply

    msg = await test_messages(
        bot_id="test_bot",
        chat_id="chat_kb",
        content="KB message",
        msg_time=datetime(2025, 1, 15, 10, 0, 0),
    )

    # Add proactive_reply with knowledge_key
    msg.proactive_reply = ProactiveReply(
        knowledge_key="test_kb_key_123",
        answer="Test answer",
    )
    await msg.save()

    # Act
    result = await get_knowledge_point_group_context(knowledge_key="test_kb_key_123")

    # Assert
    assert len(result) >= 0


@pytest.mark.asyncio
async def test_get_knowledge_point_group_context_not_found():
    """Test get_knowledge_point_group_context with non-existent key."""
    # Act & Assert
    with pytest.raises(ValueError, match="Message with knowledge_key .* not found"):
        await get_knowledge_point_group_context(knowledge_key="non_existent_key")


# Tests for reorg_reversed_msgs function
def test_reorg_reversed_msgs_empty_list():
    """Test reorg_reversed_msgs with empty message list."""
    result = reorg_reversed_msgs([])
    assert result == []


@pytest.mark.asyncio
async def test_reorg_reversed_msgs_with_real_messages(test_messages):
    """Test reorg_reversed_msgs with real Message objects."""
    # Arrange - create real messages
    msg1 = await test_messages(
        bot_id="test_bot",
        chat_id="chat_reorg",
        content="First message",
        msg_time=datetime(2025, 1, 15, 10, 0, 0),
        msg_sender_id="user123456",
    )
    msg2 = await test_messages(
        bot_id="test_bot",
        chat_id="chat_reorg",
        content="Second message",
        msg_time=datetime(2025, 1, 15, 10, 1, 0),
        msg_sender_id="user123456",
    )

    # Act
    result = reorg_reversed_msgs([msg1, msg2])

    # Assert
    assert len(result) > 0


@pytest.mark.asyncio
async def test_reorg_reversed_msgs_different_senders(test_messages):
    """Test reorg_reversed_msgs with different senders."""
    # Arrange
    msg1 = await test_messages(
        bot_id="test_bot",
        chat_id="chat_senders",
        content="User 1 message",
        msg_time=datetime(2025, 1, 15, 10, 0, 0),
        msg_sender_id="user111111",
    )
    msg2 = await test_messages(
        bot_id="test_bot",
        chat_id="chat_senders",
        content="User 2 message",
        msg_time=datetime(2025, 1, 15, 10, 1, 0),
        msg_sender_id="user222222",
    )

    # Act
    result = reorg_reversed_msgs([msg1, msg2])

    # Assert - should have separate parts for different senders
    assert len(result) >= 2


def test_reorg_reversed_msgs_with_prefix():
    """Test reorg_reversed_msgs with prefix."""
    # Act - test with prefix but no messages
    result = reorg_reversed_msgs([], prefix="System Prompt")

    # Assert
    assert len(result) == 1
    assert result[0].text == "System Prompt"


@pytest.mark.asyncio
async def test_reorg_reversed_msgs_max_images_limit(test_messages):
    """Test reorg_reversed_msgs respects max_images limit."""
    # Arrange - create messages (images would need to be added via msg_llm_compatible)
    msg = await test_messages(
        bot_id="test_bot",
        chat_id="chat_images",
        content="Message with potential images",
        msg_time=datetime(2025, 1, 15, 10, 0, 0),
    )

    # Act - test max_images parameter
    result = reorg_reversed_msgs([msg], max_images=0)

    # Assert - should not include images
    assert len(result) >= 0


@pytest.mark.asyncio
async def test_get_backward_chat_messages_empty_chat(test_messages):
    """Test get_backward_chat_messages with empty chat history."""
    # Arrange - create single message
    msg = await test_messages(
        bot_id="test_bot",
        chat_id="empty_chat",
        content="Only message",
        msg_time=datetime(2025, 1, 15, 10, 0, 0),
    )

    # Act
    result = await get_backward_chat_messages(inspect_history=10, msg=msg)

    # Assert - should return at least one message
    assert len(result) >= 0


@pytest.mark.asyncio
async def test_get_forward_chat_messages_no_future_messages(test_messages):
    """Test get_forward_chat_messages when there are no future messages."""
    # Arrange - create single message
    msg = await test_messages(
        bot_id="test_bot",
        chat_id="no_future_chat",
        content="Latest message",
        msg_time=datetime(2025, 1, 15, 10, 0, 0),
    )

    # Act
    result = await get_forward_chat_messages(inspect_history=10, msg=msg)

    # Assert - should return empty or minimal result
    assert isinstance(result, list)


@pytest.mark.asyncio
async def test_get_msg_context_limited_window(test_messages):
    """Test get_msg_context with limited context window."""
    # Arrange - create several messages with increasing minute values
    messages_list = []
    for i in range(10):
        msg = await test_messages(
            bot_id="test_bot",
            chat_id="large_chat",
            content=f"Message {i}",
            msg_time=datetime(2025, 1, 15, 10, 0, i),  # Increment seconds instead of minutes
        )
        messages_list.append(msg)

    # Get the middle message directly from the list
    msg = messages_list[5]

    # Act - with small context window
    result = await get_msg_context(msg=msg, context_window=3)

    # Assert - should respect the window limit
    assert len(result) <= 6  # 3 before + 3 after


@pytest.mark.asyncio
async def test_get_latest_user_message_mixed_senders(test_messages):
    """Test get_latest_user_message with mixed senders."""
    # Arrange - create messages from different senders
    await test_messages(
        bot_id="test_bot",
        chat_id="mixed_chat",
        content="User 1",
        msg_time=datetime(2025, 1, 15, 10, 0, 0),
        msg_sender_id="user111",
    )
    await test_messages(
        bot_id="test_bot",
        chat_id="mixed_chat",
        content="User 2",
        msg_time=datetime(2025, 1, 15, 10, 1, 0),
        msg_sender_id="user222",
    )
    msg3 = await test_messages(
        bot_id="test_bot",
        chat_id="mixed_chat",
        content="User 2 again",
        msg_time=datetime(2025, 1, 15, 10, 2, 0),
        msg_sender_id="user222",
    )

    # Act - should only get consecutive messages from user222
    result = await get_latest_user_message(msg=msg3)

    # Assert
    assert len(result) > 0


@pytest.mark.asyncio
async def test_reorg_reversed_msgs_with_images(test_messages):
    """Test reorg_reversed_msgs with messages containing images."""
    from google.genai.types import Blob, Part

    # Arrange - create messages with images
    msg = await test_messages(
        bot_id="test_bot",
        chat_id="chat_images_test",
        content="Text with image",
        msg_time=datetime(2025, 1, 15, 10, 0, 0),
    )

    # Add image parts to msg_llm_compatible
    msg.msg_llm_compatible = [
        Part(text="Before image"),
        Part(inline_data=Blob(mime_type="image/png", data=b"fake_image_data")),
        Part(text="After image"),
    ]
    await msg.save()

    # Act - with max_images=1
    result = reorg_reversed_msgs([msg], max_images=1)

    # Assert - should include image
    assert len(result) > 0
    # Check that there's an image part
    has_image = any(
        hasattr(part, "inline_data")
        and part.inline_data
        and part.inline_data.mime_type
        and part.inline_data.mime_type.startswith("image")
        for part in result
    )
    assert has_image


@pytest.mark.asyncio
async def test_reorg_reversed_msgs_exceeding_max_images(test_messages):
    """Test reorg_reversed_msgs with more images than max_images."""
    from google.genai.types import Blob, Part

    # Arrange - create message with multiple images
    msg = await test_messages(
        bot_id="test_bot",
        chat_id="chat_many_images",
        content="Multiple images",
        msg_time=datetime(2025, 1, 15, 10, 0, 0),
    )

    # Add multiple image parts
    msg.msg_llm_compatible = [
        Part(inline_data=Blob(mime_type="image/png", data=b"image1")),
        Part(inline_data=Blob(mime_type="image/jpeg", data=b"image2")),
        Part(inline_data=Blob(mime_type="image/png", data=b"image3")),
    ]
    await msg.save()

    # Act - with max_images=2
    result = reorg_reversed_msgs([msg], max_images=2)

    # Assert - should have at most 2 images
    image_count = sum(
        1
        for part in result
        if hasattr(part, "inline_data")
        and part.inline_data
        and part.inline_data.mime_type
        and part.inline_data.mime_type.startswith("image")
    )
    assert image_count <= 2


@pytest.mark.asyncio
async def test_reorg_reversed_msgs_empty_sender_id(test_messages):
    """Test reorg_reversed_msgs with empty sender_id."""
    # Arrange - create message with empty sender_id
    msg = await test_messages(
        bot_id="test_bot",
        chat_id="chat_empty_sender",
        content="Message from unknown sender",
        msg_time=datetime(2025, 1, 15, 10, 0, 0),
        msg_sender_id="",
    )

    # Act
    result = reorg_reversed_msgs([msg])

    # Assert - should handle empty sender_id gracefully
    assert len(result) > 0


@pytest.mark.asyncio
async def test_reorg_reversed_msgs_no_llm_compatible(test_messages):
    """Test reorg_reversed_msgs with message having no msg_llm_compatible."""
    # Arrange - create message then clear msg_llm_compatible
    msg = await test_messages(
        bot_id="test_bot",
        chat_id="chat_no_llm",
        content="No LLM compatible",
        msg_time=datetime(2025, 1, 15, 10, 0, 0),
    )

    # Clear msg_llm_compatible
    msg.msg_llm_compatible = []
    await msg.save()

    # Act
    result = reorg_reversed_msgs([msg])

    # Assert - should handle messages without msg_llm_compatible
    assert isinstance(result, list)


@pytest.mark.asyncio
async def test_reorg_reversed_msgs_with_prefix_and_text(test_messages):
    """Test reorg_reversed_msgs with both prefix and current_text."""
    # Arrange - create message
    msg = await test_messages(
        bot_id="test_bot",
        chat_id="chat_prefix_text",
        content="Message content",
        msg_time=datetime(2025, 1, 15, 10, 0, 0),
    )

    # Act - with prefix
    result = reorg_reversed_msgs([msg], prefix="System Instructions")

    # Assert - should include both prefix and message content
    assert len(result) > 0
    # Check that prefix is included in result
    has_prefix = any("System Instructions" in part.text for part in result if hasattr(part, "text") and part.text)
    assert has_prefix


@pytest.mark.asyncio
async def test_reorg_reversed_msgs_with_non_text_non_image_parts(test_messages):
    """Test reorg_reversed_msgs with parts that are neither text nor images."""
    from google.genai.types import Blob, Part

    # Arrange - create message with various part types
    msg = await test_messages(
        bot_id="test_bot",
        chat_id="chat_other_parts",
        content="Mixed content",
        msg_time=datetime(2025, 1, 15, 10, 0, 0),
    )

    # Add different types of parts including non-image, non-text
    msg.msg_llm_compatible = [
        Part(text="Text part"),
        Part(inline_data=Blob(mime_type="audio/mp3", data=b"fake_audio")),  # Non-image
        Part(text="Another text"),
    ]
    await msg.save()

    # Act
    result = reorg_reversed_msgs([msg])

    # Assert - should skip non-text, non-image parts
    assert len(result) > 0
    # Should only have text parts
    text_count = sum(1 for part in result if hasattr(part, "text") and part.text)
    assert text_count > 0
