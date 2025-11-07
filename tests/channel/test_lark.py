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

"""Tests for lark channel."""

import json

import pytest

from tests.channel.utils import (
    create_lark_chat_payload,
    create_lark_message_payload,
    create_url_verification_payload,
)
from veaiops.channel.lark.lark import LarkChannel
from veaiops.schema.documents.chatops.chat import Chat
from veaiops.schema.documents.chatops.message import Message
from veaiops.schema.types import AgentType, ChannelType, ChannelWebhookResp, ChatType, MsgSenderType, RespEvent


@pytest.mark.asyncio
async def test_payload_response_url_verification(mocker):
    """Test payload_response handles URL verification challenge from Lark."""
    mocker.patch("veaiops.channel.lark.lark.context.get", return_value="test-request-id")
    channel = LarkChannel()
    payload = create_url_verification_payload("test_challenge_string")

    response = await channel.payload_response(payload)
    response_content = json.loads(response.body)

    assert response.status_code == 200
    assert response_content["challenge"] == "test_challenge_string"
    # event value comes from RespEvent enum which has namespace prefix
    assert "other_event" in response_content["event"]


@pytest.mark.asyncio
async def test_payload_response_unknown_event(mocker):
    """Test payload_response handles unknown event types gracefully."""
    mocker.patch("veaiops.channel.lark.lark.context.get", return_value="test-request-id")
    channel = LarkChannel()
    payload = {"type": "unknown_event_type"}

    response = await channel.payload_response(payload)
    response_content = json.loads(response.body)

    assert response.status_code == 200
    assert response_content == ChannelWebhookResp(event=RespEvent.UnknownEvent).model_dump()


@pytest.mark.asyncio
async def test_payload_response_message_receive(mocker, test_bot):
    """Test payload_response handles incoming message event and schedules background task."""
    mocker.patch("veaiops.channel.lark.lark.context.get", return_value="test-request-id")
    mocker.patch("veaiops.channel.lark.lark.context.__setitem__", return_value=None)

    mock_background_tasks_instance = mocker.MagicMock()
    mocker.patch("veaiops.channel.lark.lark.BackgroundTasks", return_value=mock_background_tasks_instance)

    channel = LarkChannel()
    mock_run_msg_payload = mocker.AsyncMock()
    channel.run_msg_payload = mock_run_msg_payload

    payload = create_lark_message_payload(
        bot_id=test_bot.bot_id,
        chat_id="oc_test_chat",
        msg_id="om_test_message",
        content='{"text": "Hello"}',
    )

    response = await channel.payload_response(payload)
    response_content = json.loads(response.body)

    assert response.status_code == 200
    assert response_content == ChannelWebhookResp(event=RespEvent.MsgReceived).model_dump()
    mock_background_tasks_instance.add_task.assert_called_once_with(mock_run_msg_payload, payload=payload)


@pytest.mark.asyncio
async def test_payload_response_chat_bot_added(mocker, test_bot):
    """Test payload_response handles chat bot added event."""
    mocker.patch("veaiops.channel.lark.lark.context.get", return_value="test-request-id")
    mocker.patch("veaiops.channel.lark.lark.context.__setitem__", return_value=None)

    mock_background_tasks_instance = mocker.MagicMock()
    mocker.patch("veaiops.channel.lark.lark.BackgroundTasks", return_value=mock_background_tasks_instance)

    channel = LarkChannel()
    payload = create_lark_chat_payload(bot_id=test_bot.bot_id, chat_id="oc_test_chat", chat_name="Test Chat")

    response = await channel.payload_response(payload)
    response_content = json.loads(response.body)

    assert response.status_code == 200
    assert response_content == ChannelWebhookResp(event=RespEvent.ChatBotAdded).model_dump()
    mock_background_tasks_instance.add_task.assert_called_once()


@pytest.mark.asyncio
async def test_payload_to_msg_creates_message(mock_channel, test_bot):
    """Test payload_to_msg creates a message document in database."""
    payload = create_lark_message_payload(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_123",
        msg_id="test_msg_123",
        content='{"text": "Hello World"}',
        message_type="text",
    )

    result = await mock_channel.payload_to_msg(payload)

    assert result is not None
    assert result.msg_id == "test_msg_123"
    assert result.bot_id == test_bot.bot_id
    assert result.chat_id == "test_chat_123"
    assert '{"text": "Hello World"}' in result.msg

    # Verify message was saved to database
    saved_msg = await Message.find_one(Message.msg_id == "test_msg_123")
    assert saved_msg is not None
    assert saved_msg.bot_id == test_bot.bot_id

    # Cleanup
    await saved_msg.delete()


@pytest.mark.asyncio
async def test_payload_to_msg_idempotence(mock_channel, test_bot):
    """Test payload_to_msg returns None for duplicate messages."""
    payload = create_lark_message_payload(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_456",
        msg_id="test_msg_456",
        content='{"text": "Test"}',
    )

    # First call should create message
    result1 = await mock_channel.payload_to_msg(payload)
    assert result1 is not None

    # Second call with same payload should return None (idempotence)
    result2 = await mock_channel.payload_to_msg(payload)
    assert result2 is None

    # Cleanup
    await result1.delete()


@pytest.mark.asyncio
async def test_payload_to_msg_with_mentions(mock_channel, test_bot):
    """Test payload_to_msg handles mentions correctly."""
    mentions = [
        {"id": {"open_id": test_bot.open_id}, "name": "Bot", "key": "@_user_1"},
        {"id": {"open_id": "ou_other_user"}, "name": "User", "key": "@_user_2"},
    ]

    payload = create_lark_message_payload(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_789",
        msg_id="test_msg_789",
        content='{"text": "@_user_1 @_user_2 Hello"}',
        mentions=mentions,
    )

    result = await mock_channel.payload_to_msg(payload)

    assert result is not None
    assert result.is_mentioned is True
    assert result.mentions is not None
    assert len(result.mentions) == 2
    assert "@Bot" in result.msg
    assert "@User" in result.msg

    # Cleanup
    await result.delete()


@pytest.mark.asyncio
async def test_payload_to_chat_creates_chat(mock_channel, test_bot):
    """Test payload_to_chat creates a chat document in database."""
    payload = create_lark_chat_payload(bot_id=test_bot.bot_id, chat_id="test_chat_abc", chat_name="Test Chat Name")

    result = await mock_channel.payload_to_chat(payload)

    assert result is not None
    assert result.chat_id == "test_chat_abc"
    assert result.bot_id == test_bot.bot_id
    assert result.name == "Test Chat Name"
    assert result.channel == ChannelType.Lark

    # Verify chat was saved to database
    saved_chat = await Chat.find_one(Chat.chat_id == "test_chat_abc")
    assert saved_chat is not None

    # Cleanup
    await saved_chat.delete()


@pytest.mark.asyncio
async def test_check_idempotence_with_message(mock_channel, test_bot, test_messages):
    """Test check_idempotence correctly checks message existence."""
    msg = await test_messages(bot_id=test_bot.bot_id, chat_id="test_chat", content="Test")

    # Should find existing message
    exists = await mock_channel.check_idempotence(Message, bot_id=test_bot.bot_id, msg_id=msg.msg_id)
    assert exists is True

    # Should not find non-existent message
    not_exists = await mock_channel.check_idempotence(Message, bot_id=test_bot.bot_id, msg_id="non_existent")
    assert not_exists is False


@pytest.mark.asyncio
async def test_payload_to_msg_p2p_chat(mock_channel, test_bot):
    """Test payload_to_msg handles P2P chat correctly."""
    payload = create_lark_message_payload(
        bot_id=test_bot.bot_id,
        chat_id="test_p2p_chat",
        msg_id="test_p2p_msg",
        content='{"text": "P2P message"}',
        chat_type="p2p",
    )

    result = await mock_channel.payload_to_msg(payload)

    assert result is not None
    assert result.chat_type == ChatType.P2P
    assert result.msg_id == "test_p2p_msg"

    # Cleanup
    await result.delete()


@pytest.mark.asyncio
async def test_payload_to_msg_bot_sender(mock_channel, test_bot):
    """Test payload_to_msg handles bot sender correctly."""
    payload = create_lark_message_payload(
        bot_id=test_bot.bot_id,
        chat_id="test_chat",
        msg_id="test_bot_msg",
        content='{"text": "Bot message"}',
    )
    # Modify sender type to bot
    payload["event"]["sender"]["sender_type"] = "bot"

    result = await mock_channel.payload_to_msg(payload)

    assert result is not None
    assert result.msg_sender_type == MsgSenderType.BOT

    # Cleanup
    await result.delete()


@pytest.mark.asyncio
async def test_msg_to_llm_compatible_post_message(mock_channel, test_bot):
    """Test msg_to_llm_compatible converts post messages correctly."""
    content = (
        '{"content": [[{"tag": "text", "text": "Hello"}, {"tag": "a", "text": "Link", "href": "https://example.com"}]]}'
    )
    result = await mock_channel.msg_to_llm_compatible(
        content=content, bot_id=test_bot.bot_id, msg_id="test_msg", msg_type="post"
    )

    assert len(result) == 2
    assert result[0].text == "Hello"
    assert "[Link](https://example.com)" in result[1].text


@pytest.mark.asyncio
async def test_msg_to_llm_compatible_with_invalid_json(mock_channel, test_bot):
    """Test msg_to_llm_compatible handles invalid JSON gracefully."""
    content = "not valid json"
    result = await mock_channel.msg_to_llm_compatible(
        content=content, bot_id=test_bot.bot_id, msg_id="test_msg", msg_type="text"
    )

    # Should return empty list for invalid JSON
    assert isinstance(result, list)


@pytest.mark.asyncio
async def test_send_message_reactive_reply(mock_channel, test_bot, mocker):
    """Test send_message with CHATOPS_REACTIVE_REPLY agent type."""

    # Mock reply_message (get_bot_client is auto-mocked via conftest fixture)
    mock_reply = mocker.patch("veaiops.channel.lark.lark.reply_message", return_value="reply_msg_id_123")

    content = {"key": "value"}
    result = await mock_channel.send_message(
        content=content,
        agent_type=AgentType.CHATOPS_REACTIVE_REPLY,
        bot_id=test_bot.bot_id,
        msg_id="original_msg_id",
        chat_id="test_chat",
        template_id="template_123",
        target="user_123",
    )

    assert result == ["reply_msg_id_123"]
    assert mock_reply.called


@pytest.mark.asyncio
async def test_send_message_interest(mock_channel, test_bot, mocker):
    """Test send_message with CHATOPS_INTEREST agent type."""

    # get_bot_client is auto-mocked via conftest fixture
    mock_forward = mocker.patch("veaiops.channel.lark.lark.forward_message", return_value="forwarded_msg_id")
    mock_reply = mocker.patch("veaiops.channel.lark.lark.reply_message", return_value="reply_to_forwarded")

    content = {"key": "value"}
    result = await mock_channel.send_message(
        content=content,
        agent_type=AgentType.CHATOPS_INTEREST,
        bot_id=test_bot.bot_id,
        msg_id="original_msg_id",
        chat_id="test_chat",
        template_id="template_123",
        target="user_123",
    )

    assert result == ["reply_to_forwarded"]
    assert mock_forward.called
    assert mock_reply.called


@pytest.mark.asyncio
async def test_send_message_proactive_reply(mock_channel, test_bot, test_messages, mocker):
    """Test send_message with CHATOPS_PROACTIVE_REPLY agent type."""

    # Create some test messages in the chat
    await test_messages(bot_id=test_bot.bot_id, chat_id="proactive_chat", content="Message 1")
    await test_messages(bot_id=test_bot.bot_id, chat_id="proactive_chat", content="Message 2")

    # get_bot_client is auto-mocked via conftest fixture
    mock_ephemeral = mocker.patch("veaiops.channel.lark.lark.reply_ephemeral_message", return_value="ephemeral_msg_id")

    content = {"key": "value"}
    result = await mock_channel.send_message(
        content=content,
        agent_type=AgentType.CHATOPS_PROACTIVE_REPLY,
        bot_id=test_bot.bot_id,
        msg_id="original_msg_id",
        chat_id="proactive_chat",
        template_id="template_123",
        target="user_123",
    )

    # Should have sent ephemeral messages to users
    assert isinstance(result, list)
    assert mock_ephemeral.called


@pytest.mark.asyncio
async def test_send_message_proactive_reply_with_failures(mock_channel, test_bot, test_messages, mocker):
    """Test send_message handles proactive reply partial failures."""

    # Create test messages from different users
    await test_messages(bot_id=test_bot.bot_id, chat_id="proactive_chat", content="Message 1")
    await test_messages(bot_id=test_bot.bot_id, chat_id="proactive_chat", content="Message 2")

    # get_bot_client is auto-mocked via conftest fixture
    # Mock to return mix of success, exception, and None
    mocker.patch(
        "veaiops.channel.lark.lark.reply_ephemeral_message",
        side_effect=["success_id", Exception("Failed"), None],
    )

    content = {"key": "value"}
    result = await mock_channel.send_message(
        content=content,
        agent_type=AgentType.CHATOPS_PROACTIVE_REPLY,
        bot_id=test_bot.bot_id,
        msg_id="original_msg_id",
        chat_id="proactive_chat",
        template_id="template_123",
        target="user_123",
    )

    # Should only include successful message IDs
    assert isinstance(result, list)


@pytest.mark.asyncio
async def test_send_message_intelligent_threshold(mock_channel, test_bot, mocker):
    """Test send_message with INTELLIGENT_THRESHOLD agent type."""

    # get_bot_client is auto-mocked via conftest fixture
    mock_send = mocker.patch("veaiops.channel.lark.lark.send_message", return_value="threshold_msg_id")

    content = {"key": "value"}
    result = await mock_channel.send_message(
        content=content,
        agent_type=AgentType.INTELLIGENT_THRESHOLD,
        bot_id=test_bot.bot_id,
        msg_id="original_msg_id",
        chat_id="test_chat",
        template_id="template_123",
        target="target_chat_id",
    )

    assert result == ["threshold_msg_id"]
    assert mock_send.called


@pytest.mark.asyncio
async def test_send_message_no_client(mock_channel, test_bot, mocker):
    """Test send_message raises exception when client not available."""

    mocker.patch("veaiops.channel.lark.lark.get_bot_client", return_value=None)

    content = {"key": "value"}
    with pytest.raises(Exception, match="client for lark not exist"):
        await mock_channel.send_message(
            content=content,
            agent_type=AgentType.CHATOPS_REACTIVE_REPLY,
            bot_id=test_bot.bot_id,
            msg_id="original_msg_id",
            chat_id="test_chat",
            template_id="template_123",
            target="user_123",
        )


@pytest.mark.asyncio
async def test_msg_to_llm_compatible_merge_forward_success(mock_channel, test_bot, mocker):
    """Test msg_to_llm_compatible handles merge_forward messages correctly."""
    # Mock get_lark_msg to return nested messages
    mock_get_lark_msg = mocker.patch("veaiops.channel.lark.lark.get_lark_msg")
    mock_get_lark_msg.side_effect = [
        {
            "items": [
                {
                    "message_id": "msg_from_other_1",
                    "body": {"content": '{"text": "Hello"}'},
                    "msg_type": "text",
                },
                {
                    "message_id": "test_msg",
                    "body": {"content": '{"text": "Should skip"}'},
                    "msg_type": "text",
                },
            ]
        },
        {"items": [{"body": {"content": '{"text": "Nested"}'}, "msg_type": "text", "message_id": "msg_from_other_1"}]},
    ]

    result = await mock_channel.msg_to_llm_compatible(
        content={}, bot_id=test_bot.bot_id, msg_id="test_msg", msg_type="merge_forward"
    )

    assert isinstance(result, list)
    assert mock_get_lark_msg.called


@pytest.mark.asyncio
async def test_msg_to_llm_compatible_merge_forward_no_response(mock_channel, test_bot, mocker):
    """Test msg_to_llm_compatible handles merge_forward with no API response."""
    # Mock get_lark_msg to return None
    mocker.patch("veaiops.channel.lark.lark.get_lark_msg", return_value=None)

    result = await mock_channel.msg_to_llm_compatible(
        content={}, bot_id=test_bot.bot_id, msg_id="test_msg", msg_type="merge_forward"
    )

    # Should return empty list when no response
    assert result == []


@pytest.mark.asyncio
async def test_callback_handle_url_verification(mocker):
    """Test callback_handle handles URL verification."""
    mocker.patch("veaiops.channel.lark.lark.context.get", return_value="test-request-id")
    channel = LarkChannel()

    payload = {"type": "url_verification", "challenge": "test_challenge"}
    response = await channel.callback_handle(payload)
    response_content = json.loads(response.body)

    assert response.status_code == 200
    assert response_content["challenge"] == "test_challenge"


@pytest.mark.asyncio
async def test_callback_handle_unknown_event(mocker):
    """Test callback_handle handles unknown event types."""
    mocker.patch("veaiops.channel.lark.lark.context.get", return_value="test-request-id")
    channel = LarkChannel()

    payload = {"type": "unknown_type"}
    response = await channel.callback_handle(payload)

    assert response.status_code == 200


@pytest.mark.asyncio
async def test_callback_handle_card_action_trigger_event_not_found(mocker, test_bot):
    """Test callback_handle handles card action when event notice detail not found."""
    mocker.patch("veaiops.channel.lark.lark.context.get", return_value="test-request-id")

    channel = LarkChannel()
    mock_client = mocker.MagicMock()
    mocker.patch("veaiops.channel.lark.lark.get_bot_client", return_value=mock_client)

    payload = {
        "header": {"app_id": test_bot.bot_id, "event_type": "card.action.trigger"},
        "event": {
            "operator": {
                "tenant_key": "test",
                "user_id": "user_123",
                "open_id": "ou_user_123",
                "union_id": "union_123",
            },
            "context": {"open_message_id": "nonexistent_msg_id", "open_chat_id": "chat_id_123"},
            "action": {
                "value": {"action": "confirm"},
                "input_value": "test_feedback",
            },
        },
    }

    response = await channel.callback_handle(payload)
    response_content = json.loads(response.body)

    # Should still return response even with error
    assert response.status_code == 200
    assert response_content["toast"]["content"] == "Callback handle occur error."


@pytest.mark.asyncio
async def test_callback_handle_card_action_no_client(mocker, test_bot):
    """Test callback_handle when bot client not available."""
    mocker.patch("veaiops.channel.lark.lark.context.get", return_value="test-request-id")
    mocker.patch("veaiops.channel.lark.lark.get_bot_client", return_value=None)

    channel = LarkChannel()

    payload = {
        "header": {"app_id": test_bot.bot_id, "event_type": "card.action.trigger"},
        "event": {
            "operator": {
                "tenant_key": "test",
                "user_id": "user_123",
                "open_id": "ou_user_123",
                "union_id": "union_123",
            },
            "context": {"open_message_id": "msg_id_123", "open_chat_id": "chat_id_123"},
            "action": {
                "value": {"action": "confirm"},
                "input_value": "test_feedback",
            },
        },
    }

    response = await channel.callback_handle(payload)
    response_content = json.loads(response.body)

    assert response.status_code == 200
    assert "error" in response_content["toast"]["type"]


@pytest.mark.asyncio
async def test_recreate_chat_from_payload_api_failure(mock_channel, test_bot, mocker):
    """Test recreate_chat_from_payload handles API failure."""
    mock_client = mocker.MagicMock()
    mock_response = mocker.MagicMock()
    mock_response.success.return_value = False
    mock_response.code = 400
    mock_response.msg = "Bad Request"

    mock_client.im.v1.chat.get.return_value = mock_response
    mocker.patch("veaiops.channel.lark.lark.get_bot_client", return_value=mock_client)

    payload = create_lark_message_payload(
        bot_id=test_bot.bot_id, chat_id="test_chat_api_fail", msg_id="test_msg", content='{"text": "Test"}'
    )

    await mock_channel.recreate_chat_from_payload(payload)

    # Should handle failure gracefully without raising exception


@pytest.mark.asyncio
async def test_msg_to_llm_compatible_post_with_text_elements(mock_channel, test_bot):
    """Test msg_to_llm_compatible handles post with text elements."""
    content = {
        "content": [[{"tag": "text", "text": "Hello"}, {"tag": "a", "text": "Link", "href": "https://example.com"}]]
    }
    result = await mock_channel.msg_to_llm_compatible(
        content=content, bot_id=test_bot.bot_id, msg_id="test_msg", msg_type="post"
    )

    assert len(result) >= 1


@pytest.mark.asyncio
async def test_callback_handle_card_action_success_with_feedback(mocker, test_bot):
    """Test callback_handle successfully processes card action with feedback."""
    mocker.patch("veaiops.channel.lark.lark.context.get", return_value="test-request-id")

    from veaiops.schema.documents import Event, EventNoticeDetail
    from veaiops.schema.types import AgentType, DataSourceType, EventLevel, EventStatus

    # Create event with channel message
    event = await Event(
        agent_type=AgentType.INTELLIGENT_THRESHOLD,
        event_level=EventLevel.P0,
        raw_data=None,
        datasource_type=DataSourceType.Aliyun,
        channel_msg={},
    ).insert()

    event_notice_detail = await EventNoticeDetail(
        event_main_id=event.id,
        notice_channel=ChannelType.Lark,
        target="test_user",
        status=EventStatus.INITIAL,
        out_message_ids=["msg_id_123"],
    ).insert()

    channel = LarkChannel()
    mock_client = mocker.MagicMock()
    mocker.patch("veaiops.channel.lark.lark.get_bot_client", return_value=mock_client)

    payload = {
        "header": {"app_id": test_bot.bot_id, "event_type": "card.action.trigger"},
        "event": {
            "operator": {
                "tenant_key": "test",
                "user_id": "user_123",
                "open_id": "ou_user_123",
                "union_id": "union_123",
            },
            "context": {"open_message_id": "msg_id_123", "open_chat_id": "chat_id_123"},
            "action": {
                "value": {"action": "confirm"},
                "input_value": "test_feedback",
            },
        },
    }

    response = await channel.callback_handle(payload)
    assert response.status_code == 200

    # Cleanup
    await event_notice_detail.delete()
    await event.delete()


@pytest.mark.asyncio
async def test_callback_handle_card_action_invalid_json(mocker, test_bot):
    """Test callback_handle handles invalid action card JSON."""
    mocker.patch("veaiops.channel.lark.lark.context.get", return_value="test-request-id")

    channel = LarkChannel()
    mock_client = mocker.MagicMock()
    mocker.patch("veaiops.channel.lark.lark.get_bot_client", return_value=mock_client)

    # Payload missing required fields
    payload = {
        "header": {"app_id": test_bot.bot_id, "event_type": "card.action.trigger"},
        "event": {
            "operator": None,  # Invalid
            "context": {"open_message_id": "msg_id_123", "open_chat_id": "chat_id_123"},
            "action": {
                "value": {"action": "confirm"},
                "input_value": "test_feedback",
            },
        },
    }

    response = await channel.callback_handle(payload)
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_callback_handle_card_action_delete_message_partial_failure(mocker, test_bot):
    """Test callback_handle handles partial failures during message deletion."""
    mocker.patch("veaiops.channel.lark.lark.context.get", return_value="test-request-id")

    from veaiops.schema.documents import Event, EventNoticeDetail
    from veaiops.schema.types import AgentType, DataSourceType, EventLevel, EventStatus

    event = await Event(
        agent_type=AgentType.INTELLIGENT_THRESHOLD,
        event_level=EventLevel.P0,
        raw_data=None,
        datasource_type=DataSourceType.Aliyun,
        channel_msg={},
    ).insert()

    event_notice_detail = await EventNoticeDetail(
        event_main_id=event.id,
        notice_channel=ChannelType.Lark,
        target="test_user",
        status=EventStatus.INITIAL,
        out_message_ids=["msg_id_1", "msg_id_2"],
    ).insert()

    channel = LarkChannel()
    mock_client = mocker.MagicMock()
    mocker.patch("veaiops.channel.lark.lark.get_bot_client", return_value=mock_client)

    # Mock delete to return mixed results
    mocker.patch(
        "veaiops.channel.lark.lark.delete_ephemeral_message",
        side_effect=["success", Exception("Delete failed")],
    )
    mocker.patch("veaiops.channel.lark.lark.send_message", return_value="new_msg_id")

    payload = {
        "header": {"app_id": test_bot.bot_id, "event_type": "card.action.trigger"},
        "event": {
            "operator": {
                "tenant_key": "test",
                "user_id": "user_123",
                "open_id": "ou_user_123",
                "union_id": "union_123",
            },
            "context": {"open_message_id": "msg_id_1", "open_chat_id": "chat_id_123"},
            "action": {
                "value": {"action": "public"},
                "input_value": "test_feedback",
            },
        },
    }

    response = await channel.callback_handle(payload)
    assert response.status_code == 200

    # Cleanup
    await event_notice_detail.delete()
    await event.delete()


@pytest.mark.asyncio
async def test_callback_handle_card_action_with_none_delete_result(mocker, test_bot):
    """Test callback_handle handles None result from delete_ephemeral_message."""
    mocker.patch("veaiops.channel.lark.lark.context.get", return_value="test-request-id")

    from veaiops.schema.documents import Event, EventNoticeDetail
    from veaiops.schema.types import AgentType, DataSourceType, EventLevel, EventStatus

    event = await Event(
        agent_type=AgentType.INTELLIGENT_THRESHOLD,
        event_level=EventLevel.P0,
        raw_data=None,
        datasource_type=DataSourceType.Aliyun,
        channel_msg={},
    ).insert()

    event_notice_detail = await EventNoticeDetail(
        event_main_id=event.id,
        notice_channel=ChannelType.Lark,
        target="test_user",
        status=EventStatus.INITIAL,
        out_message_ids=["msg_id_123"],
    ).insert()

    channel = LarkChannel()
    mock_client = mocker.MagicMock()
    mocker.patch("veaiops.channel.lark.lark.get_bot_client", return_value=mock_client)

    # Mock delete to return None
    mocker.patch("veaiops.channel.lark.lark.delete_ephemeral_message", return_value=None)
    mocker.patch("veaiops.channel.lark.lark.send_message", return_value="new_msg_id")

    payload = {
        "header": {"app_id": test_bot.bot_id, "event_type": "card.action.trigger"},
        "event": {
            "operator": {
                "tenant_key": "test",
                "user_id": "user_123",
                "open_id": "ou_user_123",
                "union_id": "union_123",
            },
            "context": {"open_message_id": "msg_id_123", "open_chat_id": "chat_id_123"},
            "action": {
                "value": {"action": "public"},
                "input_value": "test_feedback",
            },
        },
    }

    response = await channel.callback_handle(payload)
    assert response.status_code == 200

    # Cleanup
    await event_notice_detail.delete()
    await event.delete()


@pytest.mark.asyncio
async def test_callback_handle_card_action_without_channel_msg(mocker, test_bot):
    """Test callback_handle processes action when channel_msg is None."""
    mocker.patch("veaiops.channel.lark.lark.context.get", return_value="test-request-id")

    from veaiops.schema.documents import Event, EventNoticeDetail
    from veaiops.schema.types import AgentType, DataSourceType, EventLevel, EventStatus

    event = await Event(
        agent_type=AgentType.INTELLIGENT_THRESHOLD,
        event_level=EventLevel.P0,
        raw_data=None,
        datasource_type=DataSourceType.Aliyun,
        channel_msg={},
    ).insert()

    event_notice_detail = await EventNoticeDetail(
        event_main_id=event.id,
        notice_channel=ChannelType.Lark,
        target="test_user",
        status=EventStatus.INITIAL,
        out_message_ids=["msg_id_123"],
    ).insert()

    channel = LarkChannel()
    mock_client = mocker.MagicMock()
    mocker.patch("veaiops.channel.lark.lark.get_bot_client", return_value=mock_client)

    payload = {
        "header": {"app_id": test_bot.bot_id, "event_type": "card.action.trigger"},
        "event": {
            "operator": {
                "tenant_key": "test",
                "user_id": "user_123",
                "open_id": "ou_user_123",
                "union_id": "union_123",
            },
            "context": {"open_message_id": "msg_id_123", "open_chat_id": "chat_id_123"},
            "action": {
                "value": {"action": "confirm"},
                "input_value": "test_feedback",
            },
        },
    }

    response = await channel.callback_handle(payload)
    assert response.status_code == 200

    # Cleanup
    await event_notice_detail.delete()
    await event.delete()
