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

"""Tests for lark message utilities - simplified and consolidated."""

import base64
import json
from io import BytesIO

import pytest
from PIL import Image

from veaiops.channel.lark.message import (
    Card,
    CardData,
    WebEventResp,
    WebEventToast,
    delete_ephemeral_message,
    forward_message,
    get_img_base64,
    get_lark_msg,
    reply_ephemeral_message,
    reply_message,
    send_message,
)


@pytest.mark.asyncio
async def test_card_data_and_creation():
    """Test CardData model with various template variables and Card serialization."""
    # Simple CardData
    card_data = CardData(template_id="template_123", template_variable={"key": "value"})
    assert card_data.template_id == "template_123"
    assert card_data.template_variable == {"key": "value"}

    # Complex template variables
    complex_var = {"title": "Alert", "details": {"level": "critical", "count": 5}, "items": ["item1", "item2"]}
    card_data_complex = CardData(template_id="template_456", template_variable=complex_var)
    assert card_data_complex.template_variable["title"] == "Alert"
    assert card_data_complex.template_variable["details"]["level"] == "critical"
    assert len(card_data_complex.template_variable["items"]) == 2

    # Card model with template
    card = Card(data=card_data, type="template")
    assert card.type == "template"
    assert card.data.template_id == "template_123"

    # Card default type
    card_default = Card(data=CardData(template_id="template_789", template_variable={}))
    assert card_default.type == "template"

    # Card serialization to JSON and dict
    json_str = card.model_dump_json()
    assert isinstance(json_str, str)
    assert "template_123" in json_str
    assert "template" in json_str

    card_dict = card.model_dump()
    assert isinstance(card_dict, dict)
    assert card_dict["type"] == "template"
    assert card_dict["data"]["template_id"] == "template_123"


@pytest.mark.asyncio
async def test_web_event_toast_and_resp():
    """Test WebEventToast creation with various types and WebEventResp combinations."""
    # Toast creation with default type
    toast = WebEventToast(content="Operation successful")
    assert toast.type == "info"
    assert toast.content == "Operation successful"

    # Toast with error type
    toast_error = WebEventToast(type="error", content="Operation failed")
    assert toast_error.type == "error"

    # Toast with warning type
    toast_warning = WebEventToast(type="warning", content="Warning message")
    assert toast_warning.type == "warning"

    # WebEventResp with toast only
    resp_toast = WebEventResp(toast=toast, card=None)
    assert resp_toast.toast is not None
    assert resp_toast.toast.content == "Operation successful"
    assert resp_toast.card is None

    # WebEventResp with card only
    card_data = CardData(template_id="template_123", template_variable={})
    card = Card(data=card_data)
    resp_card = WebEventResp(toast=None, card=card)
    assert resp_card.toast is None
    assert resp_card.card is not None
    assert resp_card.card.data.template_id == "template_123"

    # WebEventResp with both toast and card
    toast_both = WebEventToast(content="Card updated")
    card_data_both = CardData(template_id="template_456", template_variable={"status": "updated"})
    card_both = Card(data=card_data_both)
    resp_both = WebEventResp(toast=toast_both, card=card_both)
    assert resp_both.toast is not None
    assert resp_both.card is not None

    # JSON serialization
    toast_ser = WebEventToast(type="success", content="Done")
    card_data_ser = CardData(template_id="template_789", template_variable={"result": "ok"})
    card_ser = Card(data=card_data_ser)
    resp_ser = WebEventResp(toast=toast_ser, card=card_ser)

    json_str = resp_ser.model_dump_json()
    parsed = json.loads(json_str)

    assert parsed["toast"]["type"] == "success"
    assert parsed["toast"]["content"] == "Done"
    assert parsed["card"]["type"] == "template"
    assert parsed["card"]["data"]["template_id"] == "template_789"


@pytest.mark.asyncio
async def test_get_lark_msg_scenarios(mocker):
    """Test get_lark_msg with no client, success, and failure scenarios."""

    # Test no client
    async def mock_get_bot_client_none(*args, **kwargs):
        return None

    mocker.patch("veaiops.channel.lark.message.get_bot_client", side_effect=mock_get_bot_client_none)
    result = await get_lark_msg(bot_id="test_bot", msg_id="test_msg")
    assert result is None

    # Test success
    mock_client = mocker.MagicMock()
    mock_response = mocker.MagicMock()
    mock_response.success.return_value = True
    mock_response.raw.content = json.dumps({"data": {"message_id": "test_msg", "content": "test content"}}).encode()

    mock_client.im.v1.message.aget = mocker.AsyncMock(return_value=mock_response)

    async def mock_get_bot_client_success(*args, **kwargs):
        return mock_client

    mocker.patch("veaiops.channel.lark.message.get_bot_client", side_effect=mock_get_bot_client_success)

    result = await get_lark_msg(bot_id="test_bot", msg_id="test_msg")
    assert result["message_id"] == "test_msg"
    assert result["content"] == "test content"

    # Test failure
    mock_response_fail = mocker.MagicMock()
    mock_response_fail.success.return_value = False
    mock_response_fail.code = 500
    mock_response_fail.msg = "Internal Server Error"

    mock_client_fail = mocker.MagicMock()
    mock_client_fail.im.v1.message.aget = mocker.AsyncMock(return_value=mock_response_fail)

    async def mock_get_bot_client_fail(*args, **kwargs):
        return mock_client_fail

    mocker.patch("veaiops.channel.lark.message.get_bot_client", side_effect=mock_get_bot_client_fail)

    result = await get_lark_msg(bot_id="test_bot", msg_id="test_msg")
    assert result is None


@pytest.mark.asyncio
async def test_get_img_base64_scenarios(mocker):
    """Test get_img_base64 with no client and success scenarios."""

    # Test no client
    async def mock_get_bot_client_none(*args, **kwargs):
        return None

    mocker.patch("veaiops.channel.lark.message.get_bot_client", side_effect=mock_get_bot_client_none)

    result = await get_img_base64(bot_id="test_bot", image_key="test_key", message_id="test_msg", file_type="image")
    assert result is None

    # Test success - create small test image
    img = Image.new("RGB", (100, 100), color="red")
    img_buffer = BytesIO()
    img.save(img_buffer, format="JPEG")
    img_bytes = img_buffer.getvalue()

    mock_client = mocker.MagicMock()
    mock_response = mocker.MagicMock()
    mock_response.success.return_value = True
    mock_response.raw.content = img_bytes

    mock_client.im.v1.message_resource.aget = mocker.AsyncMock(return_value=mock_response)

    async def mock_get_bot_client_success(*args, **kwargs):
        return mock_client

    mocker.patch("veaiops.channel.lark.message.get_bot_client", side_effect=mock_get_bot_client_success)

    result = await get_img_base64(bot_id="test_bot", image_key="test_key", message_id="test_msg", file_type="image")

    assert result is not None
    assert isinstance(result, str)
    # Verify it's valid base64
    base64.b64decode(result)


@pytest.mark.asyncio
async def test_reply_message_scenarios(mocker):
    """Test reply_message with success and failure scenarios."""
    # Test success
    mock_client = mocker.MagicMock()
    mock_response = mocker.MagicMock()
    mock_response.success.return_value = True
    mock_response.data = mocker.MagicMock()
    mock_response.data.message_id = "reply_msg_123"

    mock_client.im.v1.message.areply = mocker.AsyncMock(return_value=mock_response)

    result = await reply_message(cli=mock_client, card_content='{"key": "value"}', msg_id="original_msg")
    assert result == "reply_msg_123"

    # Test failure
    mock_response_fail = mocker.MagicMock()
    mock_response_fail.success.return_value = False
    mock_response_fail.code = 400

    mock_client_fail = mocker.MagicMock()
    mock_client_fail.im.v1.message.areply = mocker.AsyncMock(return_value=mock_response_fail)

    with pytest.raises(Exception, match="Reply Message failed"):
        await reply_message(cli=mock_client_fail, card_content='{"key": "value"}', msg_id="original_msg")

    # Test no data
    mock_response_no_data = mocker.MagicMock()
    mock_response_no_data.success.return_value = True
    mock_response_no_data.data = None
    mock_response_no_data.code = 200

    mock_client_no_data = mocker.MagicMock()
    mock_client_no_data.im.v1.message.areply = mocker.AsyncMock(return_value=mock_response_no_data)

    with pytest.raises(Exception, match="Reply Message failed"):
        await reply_message(cli=mock_client_no_data, card_content='{"key": "value"}', msg_id="original_msg")


@pytest.mark.asyncio
async def test_forward_message_scenarios(mocker):
    """Test forward_message with success and failure scenarios."""
    # Test success
    mock_client = mocker.MagicMock()
    mock_response = mocker.MagicMock()
    mock_response.success.return_value = True
    mock_response.data = mocker.MagicMock()
    mock_response.data.message = mocker.MagicMock()
    mock_response.data.message.message_id = "forwarded_msg_123"

    mock_client.im.v1.message.merge_forward.return_value = mock_response

    result = await forward_message(cli=mock_client, msg_id="original_msg", receive_id="target_chat")
    assert result == "forwarded_msg_123"

    # Test failure
    mock_response_fail = mocker.MagicMock()
    mock_response_fail.success.return_value = False
    mock_response_fail.code = 400

    mock_client_fail = mocker.MagicMock()
    mock_client_fail.im.v1.message.merge_forward.return_value = mock_response_fail

    with pytest.raises(Exception, match="Reply Message failed"):
        await forward_message(cli=mock_client_fail, msg_id="original_msg", receive_id="target_chat")


@pytest.mark.asyncio
async def test_send_message_scenarios(mocker):
    """Test send_message with success and failure scenarios."""
    # Test success
    mock_client = mocker.MagicMock()
    mock_response = mocker.MagicMock()
    mock_response.success.return_value = True
    mock_response.data = mocker.MagicMock()
    mock_response.data.message_id = "sent_msg_123"

    mock_client.im.v1.message.acreate = mocker.AsyncMock(return_value=mock_response)

    result = await send_message(cli=mock_client, card_content='{"key": "value"}', chat_id="test_chat")
    assert result == "sent_msg_123"

    # Test failure
    mock_response_fail = mocker.MagicMock()
    mock_response_fail.success.return_value = False
    mock_response_fail.code = 403

    mock_client_fail = mocker.MagicMock()
    mock_client_fail.im.v1.message.acreate = mocker.AsyncMock(return_value=mock_response_fail)

    with pytest.raises(Exception, match="Send Message failed"):
        await send_message(cli=mock_client_fail, card_content='{"key": "value"}', chat_id="test_chat")

    # Test no data
    mock_response_no_data = mocker.MagicMock()
    mock_response_no_data.success.return_value = True
    mock_response_no_data.data = None
    mock_response_no_data.code = 200

    mock_client_no_data = mocker.MagicMock()
    mock_client_no_data.im.v1.message.acreate = mocker.AsyncMock(return_value=mock_response_no_data)

    with pytest.raises(Exception, match="Send Message failed"):
        await send_message(cli=mock_client_no_data, card_content='{"key": "value"}', chat_id="test_chat")


@pytest.mark.asyncio
async def test_ephemeral_message_operations(mocker, mock_async_http_client):
    """Test reply_ephemeral_message and delete_ephemeral_message scenarios."""
    # Setup mock client
    mock_client = mocker.MagicMock()
    mock_client._config = mocker.MagicMock()

    mocker.patch("veaiops.channel.lark.message.TokenManager.get_self_tenant_token", return_value="test_token")

    # Test reply_ephemeral_message success
    mock_response = mocker.MagicMock()
    mock_response.is_success = True
    mock_response.json.return_value = {"data": {"message_id": "ephemeral_msg_123"}}

    mock_http_client = mock_async_http_client(response=mock_response)
    mocker.patch("veaiops.channel.lark.message.AsyncClientWithCtx", return_value=mock_http_client)

    result = await reply_ephemeral_message(
        cli=mock_client, card_content={"key": "value"}, chat_id="test_chat", user_id="test_user"
    )
    assert result == "ephemeral_msg_123"

    # Test reply_ephemeral_message failure
    mock_response_fail = mocker.MagicMock()
    mock_response_fail.is_success = False
    mock_response_fail.text = "Error message"
    mock_response_fail.raise_for_status = mocker.MagicMock(side_effect=Exception("HTTP Error"))

    mock_http_client_fail = mock_async_http_client(response=mock_response_fail)
    mocker.patch("veaiops.channel.lark.message.AsyncClientWithCtx", return_value=mock_http_client_fail)

    with pytest.raises(Exception, match="HTTP Error"):
        await reply_ephemeral_message(
            cli=mock_client, card_content={"key": "value"}, chat_id="test_chat", user_id="test_user"
        )

    # Test delete_ephemeral_message success
    mock_response_del = mocker.MagicMock()
    mock_response_del.is_success = True
    mock_response_del.json.return_value = {"msg": "success"}

    mock_http_client_del = mock_async_http_client(response=mock_response_del)
    mocker.patch("veaiops.channel.lark.message.AsyncClientWithCtx", return_value=mock_http_client_del)

    result = await delete_ephemeral_message(cli=mock_client, message_id="test_msg_123")
    assert result == "success"

    # Test delete_ephemeral_message failure
    mock_response_del_fail = mocker.MagicMock()
    mock_response_del_fail.is_success = False
    mock_response_del_fail.text = "Delete failed"
    mock_response_del_fail.raise_for_status = mocker.MagicMock(side_effect=Exception("Delete Error"))

    mock_http_client_del_fail = mock_async_http_client(response=mock_response_del_fail)
    mocker.patch("veaiops.channel.lark.message.AsyncClientWithCtx", return_value=mock_http_client_del_fail)

    with pytest.raises(Exception, match="Delete Error"):
        await delete_ephemeral_message(cli=mock_client, message_id="test_msg_123")
