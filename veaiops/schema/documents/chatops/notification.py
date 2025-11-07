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

from typing import List, Optional

from beanie import Document
from pydantic import Field
from pymongo import IndexModel

from veaiops.schema.models.chatops import AgentReplyResp
from veaiops.schema.types import AgentType, ChannelType, EventLevel

from .response import InterestAgentResp


class AgentNotification(Document):
    """Base model for agent notifications."""

    bot_id: str
    channel: ChannelType
    msg_id: str  # ID of the message that triggered the notification
    chat_id: str  # ID of the chat where the message was sent
    agent_type: AgentType  # Type of agent triggering the notification
    description: Optional[str] = None  # Configuration description
    data: List[InterestAgentResp] | AgentReplyResp
    level: Optional[EventLevel] = Field(default=None, description="Level of notification.")

    class Settings:
        """Create compound index for idempotence using bot_id + channel."""

        name = "veaiops__chatops_agent_notification"
        indexes = [IndexModel(["bot_id", "channel", "chat_id", "msg_id", "agent_type"], unique=True)]
