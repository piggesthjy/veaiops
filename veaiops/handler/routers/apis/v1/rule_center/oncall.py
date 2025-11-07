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

"""Interest Agent Interface."""

from datetime import datetime, timezone

from beanie.odm.operators.find.comparison import Eq
from fastapi import APIRouter, Body

from veaiops.agents.chatops.default.default_interest_agent import set_default_interest_agents
from veaiops.handler.errors import RecordNotFoundError
from veaiops.schema.documents import Interest
from veaiops.schema.models.base import APIResponse
from veaiops.schema.models.chatops.interest import InterestPayload
from veaiops.schema.types import ChannelType, InterestInspectType
from veaiops.utils.log import logger

oncall_router = APIRouter(prefix="/oncall", tags=["Oncall Rule"])


@oncall_router.get("/{channel}/{bot_id}", response_model=APIResponse[list[Interest]])
async def get_oncall_rules_by_bot_id(channel: ChannelType, bot_id: str) -> APIResponse[list[Interest]]:
    """Get interest rules according to Bot ID.

    Args:
        channel (ChannelType): Bot ChannelType.
        bot_id (str): Bot ID.

    Returns:
        APIResponse[List[Interest]]: APIResponse containing a list of Interest rules.
    """
    config = await Interest.find(Interest.channel == channel, Interest.bot_id == bot_id).to_list()

    if not config:
        logger.warning(f"Bot {bot_id} ({channel}) InterestAgentConfig not found, need to init default config.")
        config = await set_default_interest_agents(bot_id=bot_id, channel=channel)

    # Return all interest rules
    return APIResponse(
        message="Oncall rules retrieved successfully",
        data=config,
    )


@oncall_router.put("/{interest_uuid}/active", response_model=APIResponse)
async def update_interest_active_status(interest_uuid: str, is_active: bool = Body(..., embed=True)) -> APIResponse:
    """Update the active status of an interest.

    Args:
        interest_uuid (str): The UUID of the interest.
        is_active (bool, optional): The new active status of the interest. Defaults to Body(embed=True).

    Returns:
        APIResponse: The API response containing the result of the update operation.
    """
    target_interest = await Interest.find_one(Eq(Interest.uuid, interest_uuid))

    if not target_interest:
        raise RecordNotFoundError(message="Interest not found")

    # Update is_active status
    target_interest.is_active = is_active
    target_interest.updated_at = datetime.now(timezone.utc)

    await target_interest.save()

    return APIResponse(
        message="Interest active status updated successfully",
    )


@oncall_router.put("/{interest_uuid}", response_model=APIResponse[Interest])
async def update_interest_rule(interest_uuid: str, interest_payload: InterestPayload) -> APIResponse[Interest]:
    """Update an interest rule.

    When interest's InterestInspectType is RE, examples_negative and examples_positive will not be updated.
    When interest's InterestInspectType is Semantic, regular_expression will not be updated.

    Args:
        interest_uuid (str): The UUID of the interest.
        interest_payload (InterestPayload): The update payload of the interest.

    Returns:
        APIResponse: The API response containing the result of the updated interest rule.
    """
    target_interest = await Interest.find_one(Eq(Interest.uuid, interest_uuid))
    if not target_interest:
        raise RecordNotFoundError(message="Interest not found")
    if target_interest.inspect_category == InterestInspectType.RE:
        interest_payload.examples_negative = None
        interest_payload.examples_positive = None
    elif target_interest.inspect_category == InterestInspectType.Semantic:
        interest_payload.regular_expression = None
    allowed = {
        "is_active",
        "level",
        "silence_delta",
        "name",
        "description",
        "examples_positive",
        "examples_negative",
        "regular_expression",
        "inspect_history",
    }
    update_data = {k: v for k, v in interest_payload.model_dump(exclude_unset=True).items() if k in allowed}
    for key, value in update_data.items():
        setattr(target_interest, key, value)
    target_interest.updated_at = datetime.now(timezone.utc)
    target_interest.version += 1
    await target_interest.save()
    return APIResponse(data=target_interest)
