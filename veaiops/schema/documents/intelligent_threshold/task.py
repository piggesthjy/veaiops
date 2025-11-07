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

from typing import List

from beanie import PydanticObjectId
from pydantic import Field
from pymongo import IndexModel

from veaiops.schema.documents.config.base import BaseConfigDocument
from veaiops.schema.types import DataSourceType


class IntelligentThresholdTask(BaseConfigDocument):
    """Intelligent threshold task document."""

    task_name: str = Field(..., description="Task name")
    datasource_id: PydanticObjectId = Field(..., description="Time series datasource ID")
    datasource_type: DataSourceType = Field(..., description="Data source type, support Zabbix, Aliyun, Volcengine")
    auto_update: bool = Field(default=False, description="AutoUpdate switch")
    projects: List[str] = Field(default_factory=list, description="List of project names")

    class Settings:
        """Settings for the IntelligentThresholdTask document."""

        name = "veaiops__intelligent_threshold_task"
        populate_by_name = True
        indexes = [IndexModel([("task_name", 1)], unique=True)]
