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

"""Test utilities for handler tests."""

from typing import Any, Dict, List, Optional

from fastapi.responses import JSONResponse
from google.genai.types import Part

from veaiops.channel.base import BaseChannel
from veaiops.schema.documents import Chat, Message
from veaiops.schema.types import AgentType, ChannelType


class MockChannelBase(BaseChannel):
    """Base mock channel implementation with all abstract methods implemented."""

    channel = ChannelType.Lark

    async def payload_to_msg(self, payload: Dict[str, Any]) -> Optional[Message]:
        """Mock implementation."""
        return None

    async def msg_to_llm_compatible(self, *args, **kwargs) -> List[Part]:
        """Mock implementation."""
        return []

    async def payload_to_chat(self, payload: Dict[str, Any]) -> Optional[Chat]:
        """Mock implementation."""
        return None

    async def payload_response(self, payload: Dict[str, Any]) -> JSONResponse:
        """Mock implementation - can be overridden in subclasses."""
        return JSONResponse(content={"challenge": payload.get("challenge", "test_challenge")}, status_code=200)

    async def recreate_chat_from_payload(self, payload: dict) -> None:
        """Mock implementation."""
        pass

    async def send_message(self, content: dict, agent_type: AgentType, *args, **kwargs) -> List[str]:
        """Mock implementation."""
        return []

    async def callback_handle(self, payload: Dict[str, Any]) -> Any:
        """Mock implementation - can be overridden in subclasses."""
        return {"status": "handled", "event_type": payload.get("type", "unknown")}
