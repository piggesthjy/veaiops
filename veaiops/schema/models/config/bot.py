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

from pydantic import BaseModel, Field, SecretStr, computed_field, field_validator

from veaiops.schema.types import AttributeKey, ChannelType, NetworkType, TOSRegion


class BotAttributePayload(BaseModel):
    """BotAttribute create model."""

    channel: ChannelType = Field(..., description="Message source channel")
    bot_id: str = Field(..., description="BotID")
    name: AttributeKey = Field(..., description="Attribute name, for project, customer, product, etc.")
    values: list[str] = Field(..., description="Attribute values")

    @field_validator("values")
    @classmethod
    def validate_value(cls, v: list[str]) -> list[str]:
        """Validate the list length.

        Args:
            v: The list[str] to validate.

        Returns:
            The validated list[str].

        Raises:
            ValueError: If the length of the list is zero.
        """
        if not v:
            raise ValueError("values is empty")
        return v


class AgentCfgPayload(BaseModel):
    """Agent configuration create model."""

    name: str = Field(..., min_length=1, description="LLM name, placeholder: ep-")
    embedding_name: str = Field(..., min_length=1, description="LLM embedding name, placeholder: ep-")
    api_base: str = Field(
        default="https://ark.cn-beijing.volces.com/api/v3",
        min_length=1,
        description="LLM api base, placeholder: https://ark.cn-beijing.volces.com/api/v3",
    )
    api_key: SecretStr = Field(..., min_length=1, description="LLM API key, mask shown")


class VolcCfgPayload(BaseModel):
    """VolcCfg configuration create model."""

    ak: Optional[SecretStr] = Field(None, description="Volcengine ak, mask shown")
    sk: Optional[SecretStr] = Field(None, description="Volcengine ak, mask shown")
    tos_region: TOSRegion = Field(..., min_length=1, description="Volcengine TOS region, for kb storage")
    network_type: NetworkType = Field(
        default=NetworkType.Internal, description="Network type. public network or internal network"
    )
    extra_kb_collections: Optional[List[str]] = Field(None, description="Ark kb collections")

    @computed_field(description="endpoint")
    @property
    def tos_endpoint(self) -> str:
        """Auto calculate tos endpoint by network_type."""
        if self.network_type == NetworkType.Public:
            return f"tos-{self.tos_region.value}.volces.com"
        else:  # Internal network
            return f"tos-{self.tos_region.value}.ivolces.com"


class CreateBotPayload(BaseModel):
    """Request model for creating a new bot.

    For progressive creation:
    - Phase 1: Only channel, bot_id, and secret are required for basic bot creation
    - Phase 2: volc_cfg and agent_cfg can be configured later for advanced ChatOps features
    """

    channel: ChannelType
    bot_id: str
    secret: SecretStr
    volc_cfg: Optional[VolcCfgPayload] = Field(
        None, description="Volcengine Config model, use system default if not provided"
    )
    agent_cfg: Optional[AgentCfgPayload] = Field(
        None, description="Agent Config model, use system default if not provided"
    )


class UpdateBotPayload(BaseModel):
    """Request model for updating a bot."""

    secret: Optional[SecretStr] = Field(None, description="Secret model")
    volc_cfg: Optional[VolcCfgPayload] = Field(None, description="Volcengine Config model")
    agent_cfg: Optional[AgentCfgPayload] = Field(None, description="Agent Config model")
