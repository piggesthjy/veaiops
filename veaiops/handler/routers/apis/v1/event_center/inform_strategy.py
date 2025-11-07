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

from datetime import datetime, timezone
from typing import Any, List, Optional

from beanie import PydanticObjectId
from beanie.odm.operators.find.comparison import In
from beanie.operators import Eq, RegEx
from fastapi import APIRouter, Depends, Query, status

from veaiops.handler.errors import RecordNotFoundError
from veaiops.handler.services import config
from veaiops.handler.services.user import get_current_user
from veaiops.schema.documents import InformStrategy
from veaiops.schema.documents.meta.user import User
from veaiops.schema.models.base import APIResponse, PaginatedAPIResponse, ToggleActiveRequest
from veaiops.schema.models.config import InformStrategyPayload
from veaiops.schema.models.event.event import InformStrategyVO, convert_vo, convert_vo_list
from veaiops.schema.types import ChannelType

router = APIRouter(prefix="/inform-strategy")


@router.post("/", response_model=APIResponse[InformStrategyVO], status_code=status.HTTP_201_CREATED)
async def create_inform_strategy(
    inform_strategy: InformStrategyPayload,
    current_user: User = Depends(get_current_user),
) -> APIResponse[InformStrategyVO]:
    """Create a new inform strategy.

    Args:
        inform_strategy (InformStrategyPayload): The inform strategy payload.
        current_user (User, optional): The current user. Defaults to Depends(get_current_user).

    Returns:
        APIResponse[InformStrategyVO]: The API response containing the created inform strategy.
    """
    db_inform_strategy = InformStrategy(
        **inform_strategy.model_dump(),
        created_user=current_user.username,
        updated_user=current_user.username,
    )
    await db_inform_strategy.insert()
    return APIResponse(data=await convert_vo(db_inform_strategy))


@router.get("/{uid}", response_model=APIResponse[InformStrategyVO])
async def get_inform_strategy(uid: PydanticObjectId) -> APIResponse[InformStrategyVO]:
    """Get an inform strategy by id."""
    db_inform_strategy = await InformStrategy.get(uid)
    if not db_inform_strategy:
        raise RecordNotFoundError(message="InformStrategy not found")
    return APIResponse(data=await convert_vo(db_inform_strategy))


@router.get("/", response_model=PaginatedAPIResponse[List[InformStrategyVO]])
async def get_inform_strategies(
    name: Optional[str] = Query(default=None, description="Strategy name"),
    channel: Optional[ChannelType] = Query(default=None, description="Channel Type"),
    bot_id: Optional[str] = Query(default=None, description="Bot ID"),
    chat_ids: Optional[List[str]] = Query(default=None, description="Chat IDs"),
    show_all: Optional[bool] = Query(None, description="Whether Show disabled items."),
    skip: int = 0,
    limit: int = 100,
) -> PaginatedAPIResponse[List[InformStrategyVO]]:
    """Get all inform strategies.

    Returns:
        PaginatedAPIResponse[List[InformStrategyVO]]: A list of all inform strategies.
    """
    conditions: List[Any] = []
    if name:
        conditions.append(RegEx(InformStrategy.name, name, "i"))
    if channel:
        conditions.append(Eq(InformStrategy.channel, channel))
    if bot_id:
        conditions.append(Eq(InformStrategy.bot_id, bot_id))
    if chat_ids:
        conditions.append(In(InformStrategy.chat_ids, chat_ids))
    if not show_all:
        conditions.append(Eq(InformStrategy.is_active, True))

    query = InformStrategy.find(*conditions)

    total = await query.count()
    items = await query.skip(skip).limit(limit).to_list()
    return PaginatedAPIResponse(data=await convert_vo_list(items), total=total, skip=skip, limit=limit)


@router.put("/{uid}", response_model=APIResponse[InformStrategyVO])
async def update_inform_strategy(
    uid: PydanticObjectId,
    inform_strategy: InformStrategyPayload,
    current_user: User = Depends(get_current_user),
) -> APIResponse[InformStrategyVO]:
    """Update an inform strategy.

    Args:
        uid (PydanticObjectId): The inform strategy ID.
        inform_strategy (InformStrategyPayload): The inform strategy payload.
        current_user (User, optional): The current user. Defaults to Depends(get_current_user).

    Returns:
        APIResponse[InformStrategyVO]: The API response containing the updated inform strategy.
    """
    db_inform_strategy = await InformStrategy.get(uid)
    if not db_inform_strategy:
        raise RecordNotFoundError(message="InformStrategy not found")

    update_data = inform_strategy.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_inform_strategy, key, value)
    db_inform_strategy.updated_at = datetime.now(timezone.utc)
    db_inform_strategy.updated_user = current_user.username
    await db_inform_strategy.save()
    return APIResponse(data=await convert_vo(db_inform_strategy))


@router.put("/{uid}/toggle", response_model=APIResponse)
async def toggle_inform_strategy(uid: PydanticObjectId, request: ToggleActiveRequest) -> APIResponse:
    """Active or Disable an inform strategy."""
    return await config.toggle_active(InformStrategy, uid, request.active)


@router.delete("/{uid}", response_model=APIResponse)
async def delete_inform_strategy(uid: PydanticObjectId) -> APIResponse:
    """Delete an inform strategy."""
    return await config.delete(InformStrategy, uid)
