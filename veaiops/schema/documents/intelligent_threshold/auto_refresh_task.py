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
from pydantic import Field
from pymongo import IndexModel

from veaiops.schema.documents.config.base import BaseDocument
from veaiops.schema.types import (
    AutoIntelligentThresholdTaskAlarmInjectStatus,
    AutoIntelligentThresholdTaskDetailStatus,
    AutoIntelligentThresholdTaskDetailTaskStatus,
    AutoIntelligentThresholdTaskStatus,
)


class AutoIntelligentThresholdTaskRecord(BaseDocument):
    """Auto intelligent threshold task record document.

    Threshold cleaning task auto-update scan record table.
    """

    # Execution status: 1=Pending, 2=Processing, 3=Completed
    status: AutoIntelligentThresholdTaskStatus = Field(
        default=AutoIntelligentThresholdTaskStatus.PENDING,
        description="Execution status: 1=Pending, 2=Processing, 3=Completed",
    )

    # List of task IDs with auto-update enabled
    task_all: Optional[List[PydanticObjectId]] = Field(None, description="List of task IDs with auto-update enabled")

    class Settings:
        """Settings for the AutoIntelligentThresholdTaskRecord document."""

        name = "veaiops__auto_intelligent_threshold_task_record"
        indexes = [
            IndexModel([("scan_time", 1)]),
            IndexModel([("status", 1)]),
            IndexModel([("created_at", 1)]),
        ]


class AutoIntelligentThresholdTaskRecordDetail(BaseDocument):
    """Auto intelligent threshold task record detail document.

    Task execution detail record table.
    """

    # Associated auto_intelligent_threshold_task_record primary key
    auto_intelligent_threshold_task_record_id: PydanticObjectId = Field(
        ..., description="Associated auto_intelligent_threshold_task_record primary key"
    )

    # Associated intelligent_threshold_task primary key
    intelligent_threshold_task_id: PydanticObjectId = Field(
        ..., description="Associated intelligent_threshold_task primary key"
    )

    # Intelligent threshold task version number
    version: int = Field(..., description="Intelligent threshold task version number")

    # Execution status: 1=Pending, 2=Processing, 3=Completed
    status: AutoIntelligentThresholdTaskDetailStatus = Field(
        default=AutoIntelligentThresholdTaskDetailStatus.PENDING,
        description="Execution status: 1=Pending, 2=Processing, 3=Completed",
    )

    # Execution status: 1=Pending, 2=Processing, 3=Success, 4=Failed
    intelligent_threshold_task_status: AutoIntelligentThresholdTaskDetailTaskStatus = Field(
        default=AutoIntelligentThresholdTaskDetailTaskStatus.PENDING,
        description="Execution status: 1=Pending, 2=Processing, 3=Success, 4=Failed",
    )

    # Execution status: 0=Initialized, 1=Pending, 2=Success, 3=Failed
    alarm_inject_status: AutoIntelligentThresholdTaskAlarmInjectStatus = Field(
        default=AutoIntelligentThresholdTaskAlarmInjectStatus.INITIALIZED,
        description="Execution status: 0=Initialized, 1=Pending, 2=Success, 3=Failed",
    )

    class Settings:
        """Settings for the AutoIntelligentThresholdTaskRecordDetail document."""

        name = "veaiops__auto_intelligent_threshold_task_record_detail"
        indexes = [
            IndexModel([("auto_intelligent_threshold_task_record_id", 1)]),
            IndexModel([("intelligent_threshold_task_id", 1)]),
            IndexModel([("status", 1)]),
            IndexModel([("created_at", 1)]),
        ]
