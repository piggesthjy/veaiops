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

from typing import Dict, List, Optional

from pydantic import BaseModel, Field

from .base import CloudMetricConfig


class AliyunProjectMetaPayload(BaseModel):
    """Model for describing Aliyun project meta."""

    project: Optional[str] = Field(None, description="Optional project name filter.")


class AliyunMetricMetaListPayload(BaseModel):
    """Model for describing Aliyun metric meta list."""

    namespace: Optional[str] = Field(None, description="Optional namespace filter.")
    metric_name: Optional[str] = Field(None, description="Optional metric name filter.")


class AliyunProject(BaseModel):
    """Model for Aliyun project meta."""

    Namespace: Optional[str] = Field(None, description="Namespace")
    Description: Optional[str] = Field(None, description="Description")


class AliyunMetric(BaseModel):
    """Model for Aliyun metric meta."""

    MetricName: Optional[str] = Field(None, description="Metric name")
    Description: Optional[str] = Field(None, description="Description")
    Namespace: Optional[str] = Field(None, description="Namespace")
    Dimensions: Optional[str] = Field(None, description="Dimensions")
    Unit: Optional[str] = Field(None, description="Unit")
    Periods: Optional[str] = Field(None, description="Periods")
    Statistics: Optional[str] = Field(None, description="Statistics")


class AliyunMetricConfig(CloudMetricConfig):
    """Aliyun metric configuration for queries.

    Additional Attributes:
        dimensions: Dimensions
    """

    dimensions: Optional[List[Dict[str, str]]] = Field(default=None, description="Dimensions")


class AliyunContactGroup(BaseModel):
    """Model for Aliyun contact group.

    Attributes:
        Name: Contact group name
    """

    Name: Optional[str] = Field(None, description="Contact group name")
