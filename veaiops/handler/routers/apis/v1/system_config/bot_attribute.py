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

from beanie import PydanticObjectId
from beanie.odm.operators.find.comparison import Eq, In
from fastapi import APIRouter, Depends, Query, status

from veaiops.handler.errors import RecordNotFoundError
from veaiops.handler.services.user import get_current_user
from veaiops.schema.documents import Bot, BotAttribute
from veaiops.schema.documents.meta.user import User
from veaiops.schema.models.base import APIResponse, PaginatedAPIResponse
from veaiops.schema.models.config import BotAttributePayload
from veaiops.schema.types import AttributeKey, ChannelType
from veaiops.utils.log import logger

bot_attribute_router = APIRouter(prefix="/bot-attributes", tags=["BotAttributes"])


@bot_attribute_router.post("/", response_model=APIResponse[List[BotAttribute]], status_code=status.HTTP_201_CREATED)
async def create_bot_attribute(
    bot_attribute: BotAttributePayload,
    current_user: User = Depends(get_current_user),
) -> APIResponse[List[BotAttribute]]:
    """Create a new bot attribute.

    Args:
        bot_attribute: The bot attribute payload
        current_user: The current authenticated user
    """
    bot = await Bot.find_one(Eq(Bot.bot_id, bot_attribute.bot_id), Eq(Bot.channel, bot_attribute.channel))
    if not bot or bot.is_active is False:
        logger.error(f"Channel {bot_attribute.channel} Bot {bot_attribute.bot_id} not found")
        raise RecordNotFoundError(message="Can not find Bot.")

    # Bulk check for existing attributes
    existing_attributes = await BotAttribute.find(
        Eq(BotAttribute.channel, bot_attribute.channel),
        Eq(BotAttribute.bot_id, bot_attribute.bot_id),
        Eq(BotAttribute.name, bot_attribute.name),
        In(BotAttribute.value, bot_attribute.values),
    ).to_list()

    existing_values = []
    if existing_attributes:
        existing_values = [attr.value for attr in existing_attributes]

    db_bot_attributes = []
    for value in [val for val in bot_attribute.values if val not in existing_values]:
        db_bot_attribute = BotAttribute(
            channel=bot_attribute.channel,
            bot_id=bot_attribute.bot_id,
            name=bot_attribute.name,
            value=value,
            created_user=current_user.username,
            updated_user=current_user.username,
        )
        db_bot_attributes.append(db_bot_attribute)

    if db_bot_attributes:
        await BotAttribute.insert_many(db_bot_attributes)

    return APIResponse(data=db_bot_attributes)


@bot_attribute_router.get("/{bot_attribute_id}", response_model=APIResponse[BotAttribute])
async def get_bot_attribute(bot_attribute_id: PydanticObjectId) -> APIResponse[BotAttribute]:
    """Get a bot attribute by id."""
    db_bot_attribute = await BotAttribute.get(bot_attribute_id)
    if not db_bot_attribute:
        raise RecordNotFoundError(message="Bot attribute not found")
    return APIResponse(data=db_bot_attribute)


@bot_attribute_router.get("/", response_model=PaginatedAPIResponse[List[BotAttribute]])
async def get_bot_attributes(
    skip: Optional[int] = Query(0, ge=0, description="skip item count, default is 0."),
    limit: Optional[int] = Query(10, le=100, ge=0, description="page size, default is 10, cannot > 100."),
    names: Optional[List[AttributeKey]] = Query(None),
    value: Optional[str] = None,
) -> PaginatedAPIResponse[List[BotAttribute]]:
    """Get all bot attributes.

    Args:
        skip (int, optional): Skip items. Defaults to 0, must >= 0.
        limit (int, optional): Limit items. Defaults to 10, must <= 100 & > 0
        names (Optional[List[AttributeKey]]): names of attributes. Defaults to None.
        value (Optional[str]): The value of attribute. Defaults to None.
    """
    query_conditions = {}
    if names:
        query_conditions["name"] = {"$in": names}
    if value:
        query_conditions["value"] = {"$regex": value, "$options": "i"}

    query = BotAttribute.find(query_conditions)
    total = await query.count()
    items = await query.skip(skip).limit(limit).to_list()
    return PaginatedAPIResponse(data=items, total=total, skip=skip, limit=limit)


@bot_attribute_router.put("/{bot_attribute_id}", response_model=APIResponse[BotAttribute])
async def update_bot_attribute(
    bot_attribute_id: PydanticObjectId, value: str, current_user: User = Depends(get_current_user)
) -> APIResponse[BotAttribute]:
    """Update a bot attribute.

    Args:
        bot_attribute_id: The ID of the bot attribute to update
        value: The new value for the bot attribute
        current_user: The current authenticated user
    """
    db_bot_attribute = await BotAttribute.get(bot_attribute_id)
    if not db_bot_attribute:
        raise RecordNotFoundError(message="Bot attribute not found or deleted.")

    setattr(db_bot_attribute, "value", value)
    db_bot_attribute.updated_user = current_user.username
    await db_bot_attribute.save()
    return APIResponse(data=db_bot_attribute)


@bot_attribute_router.delete("/{bot_attribute_id}", response_model=APIResponse)
async def delete_bot_attribute(bot_attribute_id: PydanticObjectId) -> APIResponse:
    """Delete a bot attribute."""
    db_bot_attribute = await BotAttribute.get(bot_attribute_id)
    if not db_bot_attribute:
        raise RecordNotFoundError(message="Bot attribute not found or deleted.")

    await db_bot_attribute.delete()
    return APIResponse(message="BotAttribute deleted successfully")


@bot_attribute_router.delete("/")
async def delete_bot_attributes(
    channel: ChannelType,
    bot_id: str,
    names: List[AttributeKey] = Query(..., min_items23=1),
) -> APIResponse:
    """Delete bot attributes."""
    if not names:
        logger.debug(f"Bot attribute {bot_id} with no names to deleted is forbidden.")
        raise RecordNotFoundError(message="Bot attribute not found")
    query = {"channel": channel, "bot_id": bot_id, "name": {"$in": names}}
    await BotAttribute.find(query).delete_many()
    return APIResponse(message="BotAttributes deleted successfully")
