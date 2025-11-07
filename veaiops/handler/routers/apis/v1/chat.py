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


from typing import Any, List, Optional

from beanie import PydanticObjectId
from beanie.odm.operators.find.comparison import Eq
from beanie.odm.operators.find.evaluation import RegEx
from fastapi import APIRouter, BackgroundTasks

from veaiops.handler.errors import RecordNotFoundError
from veaiops.schema.documents import Bot, Chat
from veaiops.schema.models.base import APIResponse, PaginatedAPIResponse
from veaiops.schema.models.chatops.chat import ChatConfigUpdatePayload
from veaiops.utils.bot import reload_bot_group_chat

chat_router = APIRouter(prefix="/config/chats", tags=["Chats"])


@chat_router.get("/{uid}", response_model=PaginatedAPIResponse[List[Chat]])
async def get_chats_by_bot_id(
    uid: PydanticObjectId,
    background_tasks: BackgroundTasks,
    skip: int = 0,
    limit: int = 100,
    force_update: bool = False,
    is_active: Optional[bool] = True,
    name: Optional[str] = None,
    enable_func_interest: Optional[bool] = None,
    enable_func_proactive_reply: Optional[bool] = None,
) -> PaginatedAPIResponse[List[Chat]]:
    """Get chats filtered by bot document uid with pagination.

    Args:
        uid (PydanticObjectId): Bot Document ID to filter chats.
        background_tasks (BackgroundTasks): FastAPI background tasks for async operations.
        skip (int): Number of chats to skip (default: 0).
        limit (int): Maximum number of chats to return (default: 100).
        force_update (bool): Force update (default: False).
        is_active (bool): Show chats by is_active param (default: True).
        name (Optional[str]): Filter chats by name (default: None).
        enable_func_interest (Optional[bool]): Show chats by enable_func_interest param.
        enable_func_proactive_reply (Optional[bool]): Show chats by enable_func_proactive_reply param.

    Returns:
        PaginatedAPIResponse[List[Chat]]: API response containing list of chats with pagination info.
    """
    bot = await Bot.get(uid)
    if not bot:
        raise RecordNotFoundError(message=f"Bot{uid} not found")
    if force_update:
        # If user want to force refresh group chat, we should add background update task
        background_tasks.add_task(reload_bot_group_chat, bot_id=bot.bot_id, channel=bot.channel)

    # Build query based on bot_id
    conditions: List[Any] = [Eq(Chat.is_active, is_active), Eq(Chat.bot_id, bot.bot_id), Eq(Chat.channel, bot.channel)]
    if name:
        conditions.append(RegEx(Chat.name, name, "i"))
    if enable_func_interest is not None:
        conditions.append(Eq(Chat.enable_func_interest, enable_func_interest))
    if enable_func_proactive_reply is not None:
        conditions.append(Eq(Chat.enable_func_proactive_reply, enable_func_proactive_reply))
    query = Chat.find(*conditions)

    # Calculate total count
    total = await query.count()

    # Apply skip and limit
    chats = await query.skip(skip).limit(limit).to_list()

    return PaginatedAPIResponse(
        message="Chats retrieved successfully",
        data=chats,
        limit=limit,
        skip=skip,
        total=total,
    )


@chat_router.put("/{uid}/config", response_model=APIResponse[Chat])
async def update_chat_config(uid: PydanticObjectId, config_update: ChatConfigUpdatePayload) -> APIResponse[Chat]:
    """Update chat configuration by document id.

    Args:
        uid (PydanticObjectId): Chat Document ID.
        config_update (ChatConfigUpdatePayload): Configuration fields to update.

    Returns:
        APIResponse[Chat]: API response containing updated chat object.
    """
    chat = await Chat.get(uid)

    if not chat:
        raise RecordNotFoundError(message="Chat not found")

    # Update configuration fields if provided
    if config_update.enable_func_proactive_reply is not None:
        chat.enable_func_proactive_reply = config_update.enable_func_proactive_reply

    if config_update.enable_func_interest is not None:
        chat.enable_func_interest = config_update.enable_func_interest

    # Save the updated chat
    await chat.save()

    return APIResponse(message="Chat configuration updated successfully", data=chat)
