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
from beanie.odm.operators.find.comparison import Eq, In
from fastapi import APIRouter, Depends, Query, status

from veaiops.handler.errors import RecordNotFoundError
from veaiops.handler.services import config
from veaiops.handler.services.user import get_current_user
from veaiops.schema.documents import AgentTemplate
from veaiops.schema.documents.meta.user import User
from veaiops.schema.models.base import APIResponse, PaginatedAPIResponse, ToggleActiveRequest
from veaiops.schema.models.template import AgentTemplateCreatePayload, AgentTemplateUpdatePayload
from veaiops.schema.types import AgentType, ChannelType

router = APIRouter(prefix="/agent_template")


@router.post("/", response_model=APIResponse[List[AgentTemplate]], status_code=status.HTTP_201_CREATED)
async def create_agent_template(
    agent_template: AgentTemplateCreatePayload,
    current_user: User = Depends(get_current_user),
) -> APIResponse[List[AgentTemplate]]:
    """Create a new agent template.

    Args:
        agent_template: The agent template payload
        current_user: The current authenticated user
    """
    timeNow = datetime.now(timezone.utc)
    for agent in agent_template.agents:
        conditions = [Eq(AgentTemplate.agent_type, agent), Eq(AgentTemplate.channel, agent_template.channel)]
        await AgentTemplate.find_one(*conditions).update_one(
            {
                "$set": {
                    "agent_type": agent,  # Explicitly set agent_type
                    "channel": agent_template.channel,  # Explicitly set channel
                    "template_id": agent_template.template_id,
                    "updated_user": current_user.username,
                    "updated_at": timeNow,
                    "is_active": True,
                }
            },
            upsert=True,
        )
    return APIResponse(data=await AgentTemplate.find().to_list())


@router.get("/{uid}", response_model=APIResponse[AgentTemplate])
async def get_agent_template(uid: PydanticObjectId) -> APIResponse[AgentTemplate]:
    """Get an agent template by id."""
    db_agent_template = await AgentTemplate.get(uid)
    if not db_agent_template:
        raise RecordNotFoundError(message="AgentTemplate not found")
    return APIResponse(data=db_agent_template)


@router.get("/", response_model=PaginatedAPIResponse[List[AgentTemplate]])
async def get_agent_templates(
    agents: List[AgentType] = Query(None),
    channels: List[ChannelType] = Query(None),
    template_id: str = Query(None, description="The template ID for the agent."),
    show_all: Optional[bool] = Query(None, description="If this Config Item is disabled."),
    skip: int = 0,
    limit: int = 10,
) -> PaginatedAPIResponse[List[AgentTemplate]]:
    """Get all agent templates.

    Args:
        agents (List[AgentType]): List of agent types.
        channels (List[ChannelType]): List of channel types.
        template_id (str): The template ID.
        show_all (Optional[bool]): Whether to show disabled items.
        skip (int, optional): Number of items to skip. Defaults to 0.
        limit (int, optional): Number of items to limit. Defaults to 10.

    Returns:
        PaginatedAPIResponse[List[AgentTemplate]]: A list of all agent templates.
    """
    conditions: List[Any] = []
    if agents:
        conditions.append(In(AgentTemplate.agent_type, agents))
    if channels:
        conditions.append(In(AgentTemplate.channel, channels))
    if template_id:
        conditions.append(Eq(AgentTemplate.template_id, template_id))
    if not show_all:
        conditions.append(Eq(AgentTemplate.is_active, True))

    query = AgentTemplate.find(*conditions)
    total = await query.count()
    items = await query.skip(skip).limit(limit).to_list()
    return PaginatedAPIResponse(data=items, total=total, skip=skip, limit=limit)


@router.put("/{uid}", response_model=APIResponse[AgentTemplate])
async def update_agent_template(
    uid: PydanticObjectId,
    payload: AgentTemplateUpdatePayload,
    current_user: User = Depends(get_current_user),
) -> APIResponse[AgentTemplate]:
    """Update an agent template.

    Args:
        uid: The ID of the agent template to update
        payload: The update payload
        current_user: The current authenticated user
    """
    item = await AgentTemplate.get(uid)
    if not item:
        raise RecordNotFoundError(message="AgentTemplate not found")
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(item, key, value)
    item.updated_at = datetime.now(timezone.utc)
    item.updated_user = current_user.username
    await item.save()
    return APIResponse(data=item)


@router.put("/{uid}/toggle", response_model=APIResponse)
async def toggle_agent_template(uid: PydanticObjectId, request: ToggleActiveRequest) -> APIResponse:
    """Active or Disable an agent template card."""
    return await config.toggle_active(AgentTemplate, uid, request.active)


@router.delete("/{uid}", response_model=APIResponse)
async def delete_agent_template(uid: PydanticObjectId) -> APIResponse:
    """Delete an agent template."""
    return await config.delete(model=AgentTemplate, uid=uid)
