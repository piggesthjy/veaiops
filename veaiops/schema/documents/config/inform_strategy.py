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

from pydantic import Field
from pymongo import IndexModel

from veaiops.schema.documents.config.base import BaseConfigDocument
from veaiops.schema.types import ChannelType


class InformStrategy(BaseConfigDocument):
    """Inform Strategy."""

    name: str = Field(..., min_length=1, max_length=255, description="The name of the inform strategy.")
    description: Optional[str] = Field(None, description="The description of the inform strategy.")
    channel: ChannelType = Field(..., description="The channel type for the inform strategy.")
    bot_id: str = Field(..., min_length=10, max_length=32, description="The bot ID for the inform strategy.")
    chat_ids: List[str] = Field(..., min_length=1, description="The list of chat IDs to inform.")

    class Settings:
        """Settings."""

        indexes = [IndexModel(["name"], unique=True)]
        name = "veaiops__event_inform_strategy"
