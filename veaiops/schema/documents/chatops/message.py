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

from datetime import datetime
from typing import Annotated, List, Optional

from beanie import Document, Indexed
from google.genai.types import Part
from pydantic import Field
from pymongo import IndexModel

from veaiops.schema.models.chatops import ExternalLinkReviewResult, Mention, ProactiveReply
from veaiops.schema.types import ChannelType, ChatType, MsgSenderType


class Message(Document):
    """Message data model."""

    # Metadata
    channel: ChannelType  # Message source channel
    bot_id: Annotated[str, Indexed()]  # BotID
    # Chat
    chat_id: Annotated[str, Indexed()]  # ChatID, aka. SessionID
    chat_type: ChatType
    # Message
    msg: str  # Original message payload
    msg_id: Annotated[str, Indexed()]  # Message ID for idempotence with channel
    msg_time: Annotated[datetime, Indexed()]  # Message timestamp
    msg_sender_id: str
    msg_sender_type: MsgSenderType

    # Mentions
    mentions: list[Mention] | None = None
    is_mentioned: bool = False

    # LLM
    msg_llm_compatible: Optional[List[Part]] = None

    # Proactive reply results
    proactive_reply: ProactiveReply = Field(default_factory=ProactiveReply)
    # Extracted links from the message for review
    extracted_links: List[ExternalLinkReviewResult] = []

    class Settings:
        """Create compound index for idempotence using bot_id + msg_id."""

        indexes = [IndexModel(["channel", "bot_id", "msg_id"], unique=True)]
        name = "veaiops__chatops_message"
