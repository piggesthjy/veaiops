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
from typing import Dict, List, Optional

from beanie import PydanticObjectId
from beanie.odm.operators.find.comparison import Eq, In
from pydantic import BaseModel, Field

from veaiops.handler.errors import RecordNotFoundError
from veaiops.schema.base import ChannelMsg
from veaiops.schema.documents import AgentNotification, Bot, Chat, InformStrategy
from veaiops.schema.types import AgentType, ChannelType, EventLevel


class EventCreatePayload(BaseModel):
    """Event create payload model."""

    agent_type: AgentType = Field(..., description="The type of the agent that generated the event.")
    event_level: EventLevel = Field(..., description="The level of the event.")
    region: List[str] = Field(default_factory=list, description="The region associated with the event.")
    project: List[str] = Field(default_factory=list, description="The project associated with the event.")
    product: List[str] = Field(default_factory=list, description="The product associated with the event.")
    customer: List[str] = Field(default_factory=list, description="The customer associated with the event.")
    raw_data: Optional[AgentNotification] = Field(..., description="The raw data of the event.")


class EventUpdatePayload(EventCreatePayload):
    """Event update payload model."""

    status: Optional[int] = Field(default=None, description="The status of the event.")
    channel_msg: Optional[Dict[ChannelType, ChannelMsg]] = Field(
        default=None, description="The message content for each channel."
    )


class GroupChatVO(BaseModel):
    """Group chat model."""

    id: PydanticObjectId = Field(..., description="The ID of the group chat.")
    open_chat_id: str = Field(..., description="The open chat ID for the group chat.")
    chat_name: str = Field(..., description="The name of the group chat.")
    is_active: bool = Field(True, description="Is bot in the chat.")

    @classmethod
    def from_orm(cls, group_chat: Chat) -> "GroupChatVO":
        """Convert Chat Document to GroupChatVO."""
        return cls(
            id=group_chat.id,
            open_chat_id=group_chat.chat_id,
            chat_name=group_chat.name,
            is_active=group_chat.is_active,
        )


class BotVO(BaseModel):
    """Bot model."""

    id: PydanticObjectId = Field(..., description="The ID of the bot.")
    channel: ChannelType = Field(..., description="The channel type for the bot.")
    bot_id: str = Field(..., description="The bot ID for the bot.")
    name: str = Field(..., description="The name of the bot.")
    is_active: bool = Field(True, description="Is bot active.")

    @classmethod
    def from_orm(cls, bot: Bot) -> "BotVO":
        """Convert Bot Document to BotVO."""
        return cls(
            id=bot.id,
            channel=bot.channel,
            bot_id=bot.bot_id,
            name=bot.name,
            is_active=bot.is_active,
        )


class InformStrategyVO(BaseModel):
    """Inform Strategy model."""

    id: PydanticObjectId = Field(..., description="The id of the inform strategy.")
    name: str = Field(..., description="The name of the inform strategy.")
    description: Optional[str] = Field(None, description="The description of the inform strategy.")
    channel: ChannelType = Field(..., description="The channel type for the inform strategy.")
    bot: BotVO = Field(..., description="The bot vo.")
    group_chats: List[GroupChatVO] = Field(..., description="The list of group chats to inform.")
    created_at: Optional[datetime] = Field(None, description="The creation time of the inform strategy.")
    updated_at: Optional[datetime] = Field(None, description="The update time of the inform strategy.")
    created_user: Optional[str] = Field(None, description="The created user of the inform strategy.")
    updated_user: Optional[str] = Field(None, description="The updated user of the inform strategy.")


async def convert_vo(item: InformStrategy) -> InformStrategyVO:
    """Convert InformStrategy Document to InformStrategyVO."""
    bot = await Bot.find_one({"channel": item.channel, "bot_id": item.bot_id})
    if not bot:
        raise RecordNotFoundError(message=f"Bot {item.bot_id} in {item.channel} not found")

    group_chats = []
    if item.chat_ids:
        group_chats = await Chat.find(
            *[Eq(Chat.bot_id, item.bot_id), Eq(Chat.channel, item.channel), In(Chat.chat_id, item.chat_ids)]
        ).to_list()

    return InformStrategyVO(
        id=item.id,
        name=item.name,
        description=item.description,
        channel=item.channel,
        bot=BotVO.from_orm(bot),
        group_chats=[GroupChatVO.from_orm(chat) for chat in group_chats],
        created_at=item.created_at,
        updated_at=item.updated_at,
        created_user=item.created_user,
        updated_user=item.updated_user,
    )


async def convert_vo_list(items: List[InformStrategy]) -> List[InformStrategyVO]:
    """Convert InformStrategy Documents to InformStrategyVO list."""
    if not items:
        return []
    return [await convert_vo(item) for item in items]
