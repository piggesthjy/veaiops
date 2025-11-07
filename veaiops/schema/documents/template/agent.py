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

from pydantic import Field
from pymongo import IndexModel

from veaiops.schema.documents.config.base import BaseConfigDocument
from veaiops.schema.types import AgentType, ChannelType
from veaiops.settings import BotSettings, get_settings

_bot_settings = get_settings(BotSettings)


class AgentTemplate(BaseConfigDocument):
    """Agent Configuration."""

    agent_type: AgentType = Field(..., description="The type of the agent.")
    channel: ChannelType = Field(..., description="The channel type for the agent.")
    template_id: str = Field(default_factory=lambda: _bot_settings.template_id)

    class Settings:
        """Settings."""

        indexes = [IndexModel(["agent_type", "channel"], unique=True)]

        name = "veaiops__config_agent_template"
