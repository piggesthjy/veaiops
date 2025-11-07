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

import httpx
import pytest
from beanie import PydanticObjectId
from pydantic import BaseModel, SecretStr

from veaiops.schema.types import ChannelType
from veaiops.utils.webhook import send_bot_notification, send_http_request


class PydanticModel(BaseModel):
    field: str


@pytest.mark.asyncio
async def test_send_http_request_success(mocker, mock_async_http_client):
    """Test send_http_request success case"""
    mock_response = mocker.MagicMock(spec=httpx.Response)
    mock_response.status_code = 200
    mock_response.text = "Success"

    mock_async_client = mocker.AsyncMock()
    mock_async_client.request.return_value = mock_response

    mock_cm = mock_async_http_client()
    mock_cm.__aenter__.return_value = mock_async_client

    mocker.patch("veaiops.utils.webhook.AsyncClientWithCtx", return_value=mock_cm)

    url = "http://test.com"
    data = {"key": "value"}
    response = await send_http_request(url, data)

    assert response.status_code == 200
    assert response.text == "Success"
    mock_async_client.request.assert_called_once_with(method="POST", url=url, json=data, headers=None)


@pytest.mark.asyncio
async def test_send_http_request_pydantic_model(mocker, mock_async_http_client):
    """Test send_http_request with a Pydantic model"""
    mock_response = mocker.MagicMock(spec=httpx.Response)
    mock_async_client = mocker.AsyncMock()
    mock_async_client.request.return_value = mock_response

    mock_cm = mock_async_http_client()
    mock_cm.__aenter__.return_value = mock_async_client
    mocker.patch("veaiops.utils.webhook.AsyncClientWithCtx", return_value=mock_cm)

    url = "http://test.com"
    data = PydanticModel(field="test")
    await send_http_request(url, data)

    mock_async_client.request.assert_called_once_with(method="POST", url=url, json={"field": "test"}, headers=None)


@pytest.mark.asyncio
async def test_send_http_request_serialization_error(mocker):
    """Test send_http_request with a serialization error"""
    mocker.patch("veaiops.utils.webhook.jsonable_encoder", side_effect=TypeError("Serialization failed"))

    with pytest.raises(TypeError, match="Serialization failed"):
        await send_http_request("http://test.com", {"key": "value"})


@pytest.mark.asyncio
async def test_send_http_request_http_status_error(mocker, mock_async_http_client):
    """Test send_http_request with HTTPStatusError"""
    mock_req = mocker.MagicMock(spec=httpx.Request)
    mock_resp = mocker.MagicMock(spec=httpx.Response)
    mock_resp.status_code = 500
    mock_resp.text = "Internal Server Error"
    error = httpx.HTTPStatusError("Server error", request=mock_req, response=mock_resp)

    mock_async_client = mocker.AsyncMock()
    mock_async_client.request.side_effect = error
    mock_cm = mock_async_http_client()
    mock_cm.__aenter__.return_value = mock_async_client
    mocker.patch("veaiops.utils.webhook.AsyncClientWithCtx", return_value=mock_cm)

    with pytest.raises(httpx.HTTPStatusError):
        await send_http_request("http://test.com", {"key": "value"})


@pytest.mark.asyncio
async def test_send_http_request_request_error(mocker, mock_async_http_client):
    """Test send_http_request with RequestError"""
    error = httpx.RequestError("Connection failed", request=mocker.MagicMock(spec=httpx.Request))
    mock_async_client = mocker.AsyncMock()
    mock_async_client.request.side_effect = error
    mock_cm = mock_async_http_client()
    mock_cm.__aenter__.return_value = mock_async_client
    mocker.patch("veaiops.utils.webhook.AsyncClientWithCtx", return_value=mock_cm)

    with pytest.raises(httpx.RequestError):
        await send_http_request("http://test.com", {"key": "value"})


@pytest.mark.asyncio
async def test_send_bot_notification_success(mocker):
    """Test send_bot_notification success case"""
    mock_send_http = mocker.patch("veaiops.utils.webhook.send_http_request")
    mocker.patch(
        "veaiops.utils.webhook.get_settings",
        return_value=mocker.MagicMock(event_center_url="http://events.com"),
    )

    from veaiops.schema.documents.config.bot import Bot

    bot = Bot(id=PydanticObjectId(), bot_id="test_bot", channel=ChannelType.Lark, secret=SecretStr("secret"))
    data = mocker.MagicMock()

    await send_bot_notification(bot, data)

    expected_url = "http://events.com/apis/v1/manager/event-center/event/chatops/"
    expected_headers = {"X-Bot-ID": "test_bot", "X-Channel-Type": "Lark"}

    mock_send_http.assert_called_once_with(url=expected_url, data=data, timeout=30, headers=expected_headers)


@pytest.mark.asyncio
async def test_send_bot_notification_exception(mocker):
    """Test send_bot_notification when an exception occurs"""
    mocker.patch("veaiops.utils.webhook.send_http_request", side_effect=Exception("Request failed"))
    mocker.patch(
        "veaiops.utils.webhook.get_settings",
        return_value=mocker.MagicMock(event_center_url="http://events.com"),
    )

    from veaiops.schema.documents.config.bot import Bot

    bot = Bot(id=PydanticObjectId(), bot_id="test_bot", channel=ChannelType.Lark, secret=SecretStr("secret"))
    data = mocker.MagicMock()

    await send_bot_notification(bot, data)
