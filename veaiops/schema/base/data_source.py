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

from pydantic import BaseModel, ConfigDict, Field


class ZabbixTarget(BaseModel):
    """Zabbix target configuration."""

    model_config = ConfigDict(populate_by_name=True)

    itemid: str = Field(..., description="Zabbix item ID")
    hostname: str = Field(..., description="Zabbix hostname")


class ZabbixTriggerTag(BaseModel):
    """Zabbix trigger tag configuration."""

    model_config = ConfigDict(populate_by_name=True)

    tag: str = Field(..., description="Tag key")
    value: str = Field(..., description="Tag value")


class BaseDataSourceConfig(BaseModel):
    """Base Data Source configuration."""

    model_config = ConfigDict(populate_by_name=True)
    name: Optional[str] = Field(None, description="Data source name")
    connect_name: str = Field(..., description="Connect name for authentication")
    metric_name: str = Field(default="", description="Metric name")


class ZabbixDataSourceConfig(BaseDataSourceConfig):
    """Zabbix data source configuration."""

    targets: list[ZabbixTarget] = Field(default_factory=list, description="Zabbix targets")
    history_type: int = Field(default=0, description="History type")


class CloudDataSourceConfig(BaseDataSourceConfig):
    """Cloud Data Source configuration."""

    region: str = Field(default="", description="Region")
    namespace: str = Field(default="", description="Namespace")
    group_by: Optional[List[str]] = Field(default=None, description="Group by dimensions")


class AliyunDataSourceConfig(CloudDataSourceConfig):
    """Aliyun data source configuration."""

    dimensions: Optional[List[Dict[str, str]]] = Field(default=None, description="Dimensions")


class VolcengineDataSourceConfig(CloudDataSourceConfig):
    """Volcengine data source configuration."""

    sub_namespace: str = Field(default="", description="Sub namespace")
    instances: Optional[List[Dict[str, str]]] = Field(default=None, description="Instance list")
