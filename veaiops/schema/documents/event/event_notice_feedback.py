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
from typing import Any, Optional

from beanie import Document, PydanticObjectId
from pydantic import Field
from pymongo import IndexModel

from veaiops.schema.types import ChannelType, FeedbackActionType


class EventNoticeFeedback(Document):
    """Event Notice Feedback."""

    event_main_id: PydanticObjectId = Field(..., description="The ID of the main event.")
    notice_channel: ChannelType = Field(..., description="The channel for sending the notice.")
    out_message_id: str = Field(..., description="The target for the notice, such as a user ID or group ID.")
    action: FeedbackActionType = Field(..., description="feedback action.")
    feedback: Optional[str] = Field(default=None, description="feedback message..")
    operator: Optional[Any] = Field(default=None, description="feedback operator.")
    created_at: datetime = Field(default_factory=datetime.now, description="The timestamp when the notice was created.")
    updated_at: datetime = Field(
        default_factory=datetime.now, description="The timestamp when the notice was last updated."
    )

    class Settings:
        """Settings."""

        name = "veaiops__event_notice_feedback"
        indexes = [IndexModel(["out_message_id"], unique=False)]
