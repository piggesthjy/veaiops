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

"""Webhook utilities for sending HTTP notifications."""

from typing import Any, Dict, Optional

import httpx
from beanie import PydanticObjectId
from fastapi.encoders import jsonable_encoder
from httpx import Response

from veaiops.schema.documents import AgentNotification, Bot
from veaiops.settings import WebhookSettings, get_settings
from veaiops.utils.client import AsyncClientWithCtx
from veaiops.utils.log import logger


async def send_bot_notification(bot: Bot, data: AgentNotification):
    """Send notification to webhook URL for a specific bot.

    Args:
        bot (Bot): Bot instance.
        url (str): Webhook URL.
        data (Any): Data to send (will be JSON serialized).

    """
    header = {"X-Bot-ID": bot.bot_id, "X-Channel-Type": bot.channel.value}

    try:
        await send_http_request(
            url=f"{get_settings(WebhookSettings).event_center_url}/apis/v1/manager/event-center/event/chatops/",
            data=data,
            timeout=30,
            headers=header,
        )
    except Exception:
        logger.error(f"Send notification failed bot_id={bot.bot_id}, msg_id={data.msg_id} agent_type={data.agent_type}")


async def send_http_request(
    url: str,
    data: Any,
    method: str = "POST",
    headers: Optional[Dict[str, str]] = None,
    timeout: int = 30,
) -> Response:
    """Send notification to webhook URL.

    Args:
        url: Webhook URL.
        data: Data to send (will be JSON serialized).
        method: HTTP method (default: POST).
        headers: Additional HTTP headers.
        timeout: Request timeout in seconds.

    Returns:
        Response: Response details.
    """
    # Prepare data
    try:
        if hasattr(data, "model_dump"):  # Pydantic model
            payload = data.model_dump()
        elif isinstance(data, dict):
            payload = data
        else:
            payload = {"data": str(data)}

        json_data = jsonable_encoder(payload, custom_encoder={PydanticObjectId: lambda r: str(r)})
    except Exception as e:
        logger.error(f"Failed to serialize data for webhook notification: {e}")
        raise e

    try:
        async with AsyncClientWithCtx(timeout=timeout) as client:
            response = await client.request(
                method=method,
                url=url,
                json=json_data,
                headers=headers,
            )

    except httpx.HTTPStatusError as e:
        logger.error(
            f"HTTP error while sending webhook notification to {url}: {e.response.status_code} - {e.response.text}"
        )
        raise e
    except httpx.RequestError as e:
        logger.error(f"Request error while sending webhook notification to {url}: {str(e)}")
        raise e
    except Exception as e:
        logger.error(f"Unexpected error while sending webhook notification to {url}: {str(e)}")
        raise e

    return response
