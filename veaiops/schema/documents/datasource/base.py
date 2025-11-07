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

from typing import Annotated, Any, Dict, Optional

from beanie import Indexed, Link
from pydantic import Field, SecretStr
from pymongo import IndexModel

from veaiops.schema.base import AliyunDataSourceConfig, VolcengineDataSourceConfig, ZabbixDataSourceConfig
from veaiops.schema.documents.config.base import BaseConfigDocument
from veaiops.schema.types import DataSourceType


class Connect(BaseConfigDocument):
    """Connect information for data sources."""

    # Connect basic information
    name: Annotated[str, Indexed()] = Field(..., description="Connect name")
    type: DataSourceType = Field(..., description="Connect type")

    # Zabbix credentials
    zabbix_api_url: Optional[str] = Field(None, description="Zabbix API URL")
    zabbix_api_user: Optional[str] = Field(None, description="Zabbix API user")
    zabbix_api_password: Optional[SecretStr] = Field(None, description="Zabbix API password")

    # Aliyun credentials
    aliyun_access_key_id: Optional[str] = Field(None, description="Aliyun access key ID")
    aliyun_access_key_secret: Optional[SecretStr] = Field(None, description="Aliyun access key secret")

    # Volcengine credentials
    volcengine_access_key_id: Optional[str] = Field(None, description="Volcengine access key ID")
    volcengine_access_key_secret: Optional[SecretStr] = Field(None, description="Volcengine access key secret")

    @classmethod
    def validate_update_fields(cls, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate fields and remove unallowed fields."""
        allowed_fields = {
            "is_active",
            "zabbix_api_url",
            "zabbix_api_user",
            "zabbix_api_password",
            "aliyun_access_key_id",
            "aliyun_access_key_secret",
            "volcengine_access_key_id",
            "volcengine_access_key_secret",
        }
        filtered_data = {k: v for k, v in update_data.items() if k in allowed_fields and v is not None}
        return filtered_data

    class Settings:
        """Create unique index for name."""

        name = "veaiops__datasource_collector"
        validate_assignment = True

        indexes = [
            IndexModel(["name"], unique=True),
        ]


class DataSource(BaseConfigDocument):
    """Data source information."""

    # Data source basic information
    name: Annotated[str, Indexed()] = Field(..., description="Data source name")  # Data source name
    type: DataSourceType = Field(..., description="Data source type")  # Data source type
    connect: Link[Connect] = Field(..., description="Connect for datasource")
    # Configuration based on type
    zabbix_config: Optional[ZabbixDataSourceConfig] = Field(None, description="Zabbix data source configuration")
    aliyun_config: Optional[AliyunDataSourceConfig] = Field(None, description="Aliyun data source configuration")
    volcengine_config: Optional[VolcengineDataSourceConfig] = Field(
        None, description="Volcengine data source configuration"
    )

    @classmethod
    def validate_update_fields(cls, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate fields and remove unallowed fields."""
        allowed_fields = {
            "name",
            "is_active",
            "connect",
            "zabbix_config",
            "aliyun_config",
            "volcengine_config",
        }
        filtered_data = {k: v for k, v in update_data.items() if k in allowed_fields and v is not None}
        return filtered_data

    class Settings:
        """Create unique index for name."""

        validate_assignment = True
        name = "veaiops__datasource"
        indexes = [
            IndexModel(["name"], unique=True),
        ]
