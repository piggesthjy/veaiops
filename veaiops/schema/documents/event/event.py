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
from typing import Dict, List, Optional

from beanie import Document
from pydantic import Field, computed_field

from veaiops.schema.base import ChannelMsg
from veaiops.schema.base.intelligent_threshold import (
    AliyunAlarmNotification,
    VolcengineAlarmNotification,
    ZabbixAlarmNotification,
)
from veaiops.schema.documents import AgentNotification
from veaiops.schema.types import EVENT_STATUS_MAP, AgentType, ChannelType, DataSourceType, EventLevel, EventShowStatus


class Event(Document):
    """Event document."""

    agent_type: AgentType = Field(..., description="The type of the agent that generated the event.")
    event_level: EventLevel = Field(..., description="The level of the event.")
    region: List[str] = Field(default_factory=list, description="The region associated with the event.")
    project: List[str] = Field(default_factory=list, description="The project associated with the event.")
    product: List[str] = Field(default_factory=list, description="The product associated with the event.")
    customer: List[str] = Field(default_factory=list, description="The customer associated with the event.")
    raw_data: Optional[
        AgentNotification | VolcengineAlarmNotification | AliyunAlarmNotification | ZabbixAlarmNotification
    ] = Field(..., description="The raw data of the event.")
    datasource_type: Optional[DataSourceType] = Field(
        default=None, description="The type of the datasource that generated the event."
    )

    channel_msg: Optional[Dict[ChannelType, ChannelMsg]] = Field(
        default=None, description="The message content for each channel."
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc), description="The timestamp when the event was created."
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc), description="The timestamp when the event was last updated."
    )
    status: int = Field(default_factory=int, description="The status of the event.")

    @computed_field
    @property
    def show_status(self) -> Optional[EventShowStatus]:
        """Get the show status of the event."""
        for show_status, event_statuses in EVENT_STATUS_MAP.items():
            if self.status in event_statuses:
                return show_status
        return None

    class Settings:
        """Settings."""

        name = "veaiops__event"
