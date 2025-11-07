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
from typing import List, Optional

from beanie import PydanticObjectId
from pydantic import BaseModel, Field, model_validator

from veaiops.schema.documents.config import Subscribe
from veaiops.schema.models.base import AttributeItem
from veaiops.schema.types import AgentType, EventLevel


class SubscribePayload(BaseModel):
    """Subscribe Create/Update Payload."""

    name: str = Field(..., max_length=100, description="The name of the subscribe relation.")
    agent_type: AgentType = Field(..., description="The type of the agent for the subscribe relation.")
    inform_strategy_ids: Optional[List[PydanticObjectId]] = Field(None, description="The list of inform strategy IDs.")
    start_time: datetime = Field(..., description="The start time of the subscribe relation.")
    end_time: datetime = Field(..., description="The end time of the subscribe relation.")
    event_level: List[EventLevel] = Field(..., description="The list of event levels.")
    enable_webhook: Optional[bool] = Field(default=None, description="If enable webhook.")
    webhook_endpoint: Optional[str] = Field(default=None, description="The endpoint of the webhook.")
    webhook_headers: Optional[dict[str, str]] = Field(default=None, description="The headers of the webhook.")
    interest_products: Optional[List[str]] = Field(default=None, description="The list of interest products.")
    interest_projects: Optional[List[str]] = Field(default=None, description="The list of interest project.")
    interest_customers: Optional[List[str]] = Field(default=None, description="The list of interest customers.")

    @model_validator(mode="before")
    def check_webhook_fields(cls, values):
        """Check webhook fields."""
        webhook_status, webhook_endpoint = values.get("webhook_status"), values.get("webhook_endpoint")
        if webhook_status is True and not webhook_endpoint:
            raise ValueError("webhook_endpoint is required when webhook_status is 1")
        return values


class SubscribeWithAttributes(Subscribe):
    """Subscribe Relation With Attributes."""

    attributes: List[AttributeItem] = Field(..., description="The list of attributes for the subscribe relation.")
