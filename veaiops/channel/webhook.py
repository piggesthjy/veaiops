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

import json
from datetime import datetime
from typing import Any, Dict, List, Optional

import httpx
from google.genai.types import Part
from starlette.responses import JSONResponse

from veaiops.channel.registry import register_channel
from veaiops.schema.documents import Chat, Message
from veaiops.schema.types import AgentType, ChannelType
from veaiops.utils.log import logger

from ..utils.client import AsyncClientWithCtx
from .base import BaseChannel


class DateTimeEncoder(json.JSONEncoder):
    """Datetime encoder."""

    def default(self, o):
        """Pydantic encoder for datetime."""
        if isinstance(o, datetime):
            return o.isoformat()
        return super().default(o)


@register_channel()
class WebhookChannel(BaseChannel):
    """Webhook channel implementation."""

    channel = ChannelType.Webhook

    async def payload_to_msg(self, payload: Dict[str, Any]) -> Optional[Message]:
        """Convert provider payload -> Message.

        Args:
            payload (Dict[str, Any]): The incoming webhook payload from the provider.

        Returns:
            Optional[Message]: The constructed Message object.
        """
        pass

    async def msg_to_llm_compatible(self, *args, **kwargs) -> List[Part]:
        """Convert message to LLM-compatible input content."""
        pass

    async def recreate_chat_from_payload(self, payload: Dict) -> None:
        """Recreate chat from payload.

        Args:
            payload (Dict): The incoming webhook payload from the provider.
        """
        pass

    async def payload_to_chat(self, payload: Dict[str, Any]) -> Optional[Chat]:
        """Convert provider payload -> Chat.

        Args:
            payload (Dict[str, Any]): The incoming webhook payload from the provider.

        Returns:
            Optional[Chat]: The constructed Chat object.
        """
        pass

    async def payload_response(self, payload: Dict[str, Any]) -> JSONResponse:
        """Convert provider payload -> Dict response.

        Args:
            payload (Dict[str, Any]): The incoming webhook payload from the provider.

        Returns:
            JSONResponse: The response object to be sent back to the provider.
        """
        pass

    async def callback_handle(self, payload: Dict[str, Any]) -> Any:
        """Convert provider payload -> response.

        Args:
            payload (Dict[str, Any]): The incoming payload from the provider.

        Returns:
            The response object to be sent back to the provider.
        """
        pass

    async def send_message(self, content: dict, agent_type: AgentType, target: str, *args, **kwargs) -> List[str]:
        """Send a webhook message.

        Args:
            content (dict): The content of the template card.
            agent_type (AgentType): The type of agent sending the message.
            target (str): The target to be notified.
            *args: Additional positional arguments.
            **kwargs: Additional keyword arguments.

        Returns:
            List[str]: The output message id list.
        """
        logger.info(f"send message to webhook {target} with content {content}")
        headers = kwargs.get("headers") or {}
        if not headers.get("Content-Type"):
            headers["Content-Type"] = "application/json"

        if not headers.get("Agent-Type"):
            headers["Agent-Type"] = agent_type.value

        async with AsyncClientWithCtx(timeout=httpx.Timeout(10.0)) as client:
            resp = await client.post(
                url=target,
                headers=headers,
                content=json.dumps(content, cls=DateTimeEncoder),
            )
            if not resp.is_success:
                logger.error(f"Failed to send message to={target}: {resp.text}")
                raise Exception(f"Failed to send message to={target}: {resp.text}")
        logger.info(f"Send message to={target}. response:{resp.text}")
        return ["webhook-message"]
