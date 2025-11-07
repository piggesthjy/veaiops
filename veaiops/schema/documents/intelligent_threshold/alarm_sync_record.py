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
from pymongo import IndexModel

from veaiops.schema.documents.config.base import BaseDocument
from veaiops.schema.types import AlarmSyncRecordStatus, EventLevel


class RuleOperationResult(BaseModel):
    """Represents the result of a single rule operation."""

    action: str
    rule_id: Optional[str] = None
    rule_name: str
    status: str
    error: Optional[str] = None


class RuleOperations(BaseModel):
    """Categorized results of rule operations."""

    create: List[RuleOperationResult] = Field(default_factory=list)
    update: List[RuleOperationResult] = Field(default_factory=list)
    delete: List[RuleOperationResult] = Field(default_factory=list)
    failed: List[RuleOperationResult] = Field(default_factory=list)


class AlarmSyncRecord(BaseDocument):
    """Document to record parameters and results of sync_rules_for_intelligent_threshold_task."""

    # Task information
    task_id: PydanticObjectId = Field(..., description="ID of the IntelligentThresholdTask")
    task_version_id: PydanticObjectId = Field(..., description="ID of the IntelligentThresholdTaskVersion")
    status: AlarmSyncRecordStatus = Field(
        AlarmSyncRecordStatus.INITIALIZED, description="Execution status of the alarm sync task"
    )
    error_message: Optional[str] = Field(None, description="Error message if the sync task failed")

    # Sync configuration parameters
    contact_group_ids: Optional[List[str]] = Field(None, description="List of contact group IDs for notifications")
    webhook: Optional[str] = Field(None, description="Webhook URL for notifications")
    alert_methods: Optional[List[str]] = Field(None, description="List of alert methods (Email, Phone, SMS, Webhook)")
    alarm_level: EventLevel = Field(EventLevel.P2, description="Alarm level (P0/P1/P2)")

    # Sync results
    total: int = Field(..., description="Total number of rules processed")
    created: int = Field(..., description="Number of new rules created")
    updated: int = Field(..., description="Number of existing rules updated")
    deleted: int = Field(..., description="Number of outdated rules deleted")
    failed: int = Field(..., description="Number of rules failed")
    rule_operations: RuleOperations = Field(
        default_factory=RuleOperations, description="Rule operations for created, updated, deleted and failed"
    )

    class Settings:
        """Settings for the AlarmSyncRecord document."""

        name = "veaiops__intelligent_threshold_alarm_sync_record"
        indexes = [
            IndexModel([("task_id", 1)]),
            IndexModel([("task_version_id", 1)]),
            IndexModel([("created_at", -1)]),
            IndexModel([("status", 1)]),
        ]
