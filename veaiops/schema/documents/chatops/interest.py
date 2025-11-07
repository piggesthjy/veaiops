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

import uuid
from datetime import timedelta
from typing import Annotated, Optional

from beanie import Indexed
from pydantic import Field, model_validator
from pymongo import IndexModel

from veaiops.schema.documents.config.base import BaseConfigDocument
from veaiops.schema.types import ChannelType, EventLevel, InterestActionType, InterestInspectType


class Interest(BaseConfigDocument):
    """Interest rule model."""

    name: str
    description: str
    uuid: str = Field(default_factory=lambda: str(uuid.uuid4()))
    examples_positive: Optional[list[str]] = None
    examples_negative: Optional[list[str]] = None
    action_category: InterestActionType
    inspect_category: InterestInspectType
    regular_expression: Optional[str] = None
    inspect_history: int = Field(default=1, ge=0)  # 0 for all records, must be >= 0
    # Metadata
    silence_delta: timedelta = timedelta(hours=6)  # time delta between two alarms
    version: int = 1  # Configuration version for tracking changes
    level: Optional[EventLevel] = Field(default=None, description="Level of event")
    # Bot related attr.
    bot_id: Annotated[str, Indexed()]  # Bot ID
    channel: ChannelType

    @model_validator(mode="after")
    def validate_regular_expression(self) -> "Interest":
        """Validate that regular_expression is provided when inspect_category is RE."""
        if self.inspect_category == InterestInspectType.RE and not self.regular_expression:
            raise ValueError("regular_expression must be provided when inspect_category is RE.")
        return self

    class Settings:
        """Create compound index for idempotence using bot_id + channel + interest name."""

        name = "veaiops__chatops_interest"
        indexes = [IndexModel(["bot_id", "channel", "name"], unique=True)]
