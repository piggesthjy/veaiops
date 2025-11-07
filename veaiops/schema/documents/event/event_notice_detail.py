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

from beanie import Document, PydanticObjectId
from pydantic import Field
from pymongo import IndexModel

from veaiops.schema.types import ChannelType, EventStatus


class EventNoticeDetail(Document):
    """Event Notice Detail."""

    event_main_id: PydanticObjectId = Field(..., description="The ID of the main event.")
    notice_channel: ChannelType = Field(..., description="The channel for sending the notice.")
    target: str = Field(..., description="The target for the notice, such as a user ID or group ID.")
    extra: dict = Field(
        default_factory=dict, description="Extra information for the notice, such as bot ID or webhook headers."
    )
    status: EventStatus
    created_at: datetime = Field(default_factory=datetime.now, description="The timestamp when the notice was created.")
    updated_at: datetime = Field(
        default_factory=datetime.now, description="The timestamp when the notice was last updated."
    )
    out_message_ids: Optional[List[str]] = Field(default=None, description="The ID list of the messages sent out.")

    class Settings:
        """Settings."""

        name = "veaiops__event_notice_detail"
        indexes = [
            IndexModel(["out_message_ids"], unique=False),
        ]
