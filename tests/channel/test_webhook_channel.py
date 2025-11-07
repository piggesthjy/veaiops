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

"""Tests for webhook channel."""

import json

import pytest

from veaiops.channel.webhook import WebhookChannel
from veaiops.schema.types import AgentType, ChannelType


@pytest.mark.asyncio
async def test_webhook_channel_type():
    """Test WebhookChannel has correct channel type."""
    channel = WebhookChannel()
    assert channel.channel == ChannelType.Webhook


@pytest.mark.asyncio
async def test_send_message_success(mocker, mock_async_http_client):
    """Test send_message sends webhook successfully."""
    channel = WebhookChannel()

    mock_response = mocker.MagicMock()
    mock_response.is_success = True
    mock_response.text = "OK"

    mock_client_instance = mock_async_http_client(response=mock_response)
    mocker.patch("veaiops.channel.webhook.AsyncClientWithCtx", return_value=mock_client_instance)

    content = {"message": "Test notification"}
    target = "https://example.com/webhook"

    result = await channel.send_message(content=content, agent_type=AgentType.INTELLIGENT_THRESHOLD, target=target)

    assert result == ["webhook-message"]
    mock_client_instance.post.assert_called_once()
    call_args = mock_client_instance.post.call_args

    assert call_args.kwargs["url"] == target
    assert "Content-Type" in call_args.kwargs["headers"]
    assert "Agent-Type" in call_args.kwargs["headers"]
    assert call_args.kwargs["headers"]["Agent-Type"] == AgentType.INTELLIGENT_THRESHOLD.value


@pytest.mark.asyncio
async def test_send_message_with_custom_headers(mocker, mock_async_http_client):
    """Test send_message preserves custom headers."""
    channel = WebhookChannel()

    mock_response = mocker.MagicMock()
    mock_response.is_success = True
    mock_response.text = "OK"

    mock_client_instance = mock_async_http_client(response=mock_response)
    mocker.patch("veaiops.channel.webhook.AsyncClientWithCtx", return_value=mock_client_instance)

    content = {"message": "Test"}
    target = "https://example.com/webhook"
    custom_headers = {"X-Custom-Header": "CustomValue", "Content-Type": "application/json"}

    result = await channel.send_message(
        content=content,
        agent_type=AgentType.INTELLIGENT_THRESHOLD,
        target=target,
        headers=custom_headers,
    )

    assert result == ["webhook-message"]
    call_args = mock_client_instance.post.call_args
    assert call_args.kwargs["headers"]["X-Custom-Header"] == "CustomValue"
    assert call_args.kwargs["headers"]["Content-Type"] == "application/json"


@pytest.mark.asyncio
async def test_send_message_failure(mocker, mock_async_http_client):
    """Test send_message raises exception on failure."""
    channel = WebhookChannel()

    mock_response = mocker.MagicMock()
    mock_response.is_success = False
    mock_response.text = "Bad Request"

    mock_client_instance = mock_async_http_client(response=mock_response)
    mocker.patch("veaiops.channel.webhook.AsyncClientWithCtx", return_value=mock_client_instance)

    content = {"message": "Test"}
    target = "https://example.com/webhook"

    with pytest.raises(Exception, match="Failed to send message"):
        await channel.send_message(content=content, agent_type=AgentType.INTELLIGENT_THRESHOLD, target=target)


@pytest.mark.asyncio
async def test_send_message_content_serialization(mocker, mock_async_http_client):
    """Test send_message properly serializes content with datetime."""
    channel = WebhookChannel()

    mock_response = mocker.MagicMock()
    mock_response.is_success = True
    mock_response.text = "OK"

    mock_client_instance = mock_async_http_client(response=mock_response)
    mocker.patch("veaiops.channel.webhook.AsyncClientWithCtx", return_value=mock_client_instance)

    from datetime import datetime

    content = {"message": "Test", "timestamp": datetime(2025, 1, 1, 12, 0, 0)}
    target = "https://example.com/webhook"

    result = await channel.send_message(content=content, agent_type=AgentType.INTELLIGENT_THRESHOLD, target=target)

    assert result == ["webhook-message"]
    call_args = mock_client_instance.post.call_args
    # Verify datetime was properly serialized
    sent_content = call_args.kwargs["content"]
    assert isinstance(sent_content, str)
    parsed_content = json.loads(sent_content)
    assert "timestamp" in parsed_content
    # Check datetime was ISO formatted
    assert "2025-01-01" in parsed_content["timestamp"]


@pytest.mark.asyncio
async def test_send_message_with_different_agent_types(mocker, mock_async_http_client):
    """Test send_message works with different agent types."""
    channel = WebhookChannel()

    mock_response = mocker.MagicMock()
    mock_response.is_success = True
    mock_response.text = "OK"

    mock_client_instance = mock_async_http_client(response=mock_response)
    mocker.patch("veaiops.channel.webhook.AsyncClientWithCtx", return_value=mock_client_instance)

    content = {"message": "Test"}
    target = "https://example.com/webhook"

    agent_types = [
        AgentType.INTELLIGENT_THRESHOLD,
        AgentType.CHATOPS_REACTIVE_REPLY,
        AgentType.CHATOPS_PROACTIVE_REPLY,
    ]

    for agent_type in agent_types:
        result = await channel.send_message(content=content, agent_type=agent_type, target=target)
        assert result == ["webhook-message"]

        call_args = mock_client_instance.post.call_args
        assert call_args.kwargs["headers"]["Agent-Type"] == agent_type.value


@pytest.mark.asyncio
async def test_webhook_payload_to_msg_not_implemented():
    """Test payload_to_msg is not implemented (abstract method)."""
    channel = WebhookChannel()
    result = await channel.payload_to_msg({})
    assert result is None


@pytest.mark.asyncio
async def test_webhook_msg_to_llm_compatible_not_implemented():
    """Test msg_to_llm_compatible is not implemented (abstract method)."""
    channel = WebhookChannel()
    result = await channel.msg_to_llm_compatible()
    assert result is None


@pytest.mark.asyncio
async def test_webhook_recreate_chat_from_payload_not_implemented():
    """Test recreate_chat_from_payload is not implemented (abstract method)."""
    channel = WebhookChannel()
    result = await channel.recreate_chat_from_payload({})
    assert result is None


@pytest.mark.asyncio
async def test_webhook_payload_to_chat_not_implemented():
    """Test payload_to_chat is not implemented (abstract method)."""
    channel = WebhookChannel()
    result = await channel.payload_to_chat({})
    assert result is None


@pytest.mark.asyncio
async def test_webhook_payload_response_not_implemented():
    """Test payload_response is not implemented (abstract method)."""
    channel = WebhookChannel()
    result = await channel.payload_response({})
    assert result is None


@pytest.mark.asyncio
async def test_webhook_callback_handle_not_implemented():
    """Test callback_handle is not implemented (abstract method)."""
    channel = WebhookChannel()
    result = await channel.callback_handle({})
    assert result is None
