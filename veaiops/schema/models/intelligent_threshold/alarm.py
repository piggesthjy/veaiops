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

from beanie import PydanticObjectId
from pydantic import BaseModel, Field

from veaiops.schema.documents.intelligent_threshold.alarm_sync_record import RuleOperations
from veaiops.schema.types import EventLevel


class SyncAlarmRulesPayload(BaseModel):
    """Request model for synchronizing alarm rules from task version result."""

    task_id: PydanticObjectId = Field(..., description="ID of the IntelligentThresholdTask")
    task_version_id: PydanticObjectId = Field(..., description="ID of the IntelligentThresholdTaskVersion")
    contact_group_ids: Optional[List[str]] = Field(None, description="List of contact group IDs for notifications")
    alert_methods: Optional[List[str]] = Field(None, description="List of alert methods (Email, Phone,SMS)")
    webhook: Optional[str] = Field(None, description="Webhook URL")
    alarm_level: EventLevel = Field(EventLevel.P2, description="Alarm level (P0/P1/P2)")


class SyncAlarmRulesResponse(BaseModel):
    """Response model for alarm rule synchronization."""

    total: int
    created: int
    updated: int
    deleted: int
    failed: int
    rule_operations: RuleOperations
