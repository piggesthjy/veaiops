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

from pydantic import BaseModel, Field, field_validator, model_validator

from veaiops.schema.documents.datasource.base import DataSourceType


class ConnectCreatePayload(BaseModel):
    """Model for creating a new Connect object."""

    name: str = Field(..., description="Connect name")
    type: DataSourceType = Field(..., description="Connect type")

    # Zabbix credentials
    zabbix_api_url: Optional[str] = Field(None, description="Zabbix API URL")
    zabbix_api_user: Optional[str] = Field(None, description="Zabbix API user")
    zabbix_api_password: Optional[str] = Field(None, description="Zabbix API password")

    # Aliyun credentials
    aliyun_access_key_id: Optional[str] = Field(None, description="Aliyun access key ID")
    aliyun_access_key_secret: Optional[str] = Field(None, description="Aliyun access key secret")

    # Volcengine credentials
    volcengine_access_key_id: Optional[str] = Field(None, description="Volcengine access key ID")
    volcengine_access_key_secret: Optional[str] = Field(None, description="Volcengine access key secret")

    @model_validator(mode="after")
    def validate_credentials(self) -> "ConnectCreatePayload":
        """Validate that required credentials are provided based on type."""
        if self.type == DataSourceType.Zabbix:
            if not self.zabbix_api_url or not self.zabbix_api_user or not self.zabbix_api_password:
                raise ValueError("Zabbix connections require api_url, api_user, and api_password")
        elif self.type == DataSourceType.Aliyun:
            if not self.aliyun_access_key_id or not self.aliyun_access_key_secret:
                raise ValueError("Aliyun connections require access_key_id and access_key_secret")
        elif self.type == DataSourceType.Volcengine:
            if not self.volcengine_access_key_id or not self.volcengine_access_key_secret:
                raise ValueError("Volcengine connections require access_key_id and access_key_secret")
        return self


class ConnectUpdatePayload(BaseModel):
    """Model for updating an existing Connect object."""

    # Connect basic information
    name: Optional[str] = Field(None, description="Connect name")

    # Zabbix credentials
    zabbix_api_url: Optional[str] = Field(None, description="Zabbix API URL")
    zabbix_api_user: Optional[str] = Field(None, description="Zabbix API user")
    zabbix_api_password: Optional[str] = Field(None, description="Zabbix API password")

    # Aliyun credentials
    aliyun_access_key_id: Optional[str] = Field(None, description="Aliyun access key ID")
    aliyun_access_key_secret: Optional[str] = Field(None, description="Aliyun access key secret")

    # Volcengine credentials
    volcengine_access_key_id: Optional[str] = Field(None, description="Volcengine access key ID")
    volcengine_access_key_secret: Optional[str] = Field(None, description="Volcengine access key secret")


class BaseTimeseriesRequestPayload(BaseModel):
    """Request model for getting time series data from cloud monitoring.

    This model defines the parameters needed to query time series metrics data
    from the cloud platform monitoring service.

    Attributes:
        datasource_id: The ID of the data source configuration
        start_time: Optional start time for the query in seconds since epoch
        end_time: Optional end time for the query in seconds since epoch
        period: Time aggregation period for the data points (default: 60s)
        instances: Optional list of instance filters to apply
    """

    datasource_id: str = Field(..., description="Datasource ID")
    start_time: Optional[int] = Field(None, description="Start time in seconds since epoch")
    end_time: Optional[int] = Field(None, description="End time in seconds since epoch")
    period: str = Field("60s", description="Time series data aggregation period")
    instances: Optional[List[Dict[str, str]]] = Field(None, description="List of instance filters")

    @field_validator("period")
    @classmethod
    def validate_period(cls, v: str) -> str:
        """Validate the period string format.

        The period must be in the format '<number><unit>', where unit is one of
        's', 'm', 'h', 'd', 'w'.

        Args:
            v: The period string to validate.

        Returns:
            The validated period string.

        Raises:
            ValueError: If the period format is invalid.
        """
        # Supported time units
        allowed_units = {"s", "m", "h", "d", "w"}

        # Check if the string format matches the "<number><unit>" pattern
        if not isinstance(v, str) or not v.strip():
            raise ValueError(f"period must be in format '<number><unit>' where unit is one of {allowed_units}")

        # Separate the numeric part and the unit part
        num_part = "".join([c for c in v if c.isdigit()])
        unit_part = "".join([c for c in v if not c.isdigit()])

        # Validate the numeric part
        if not num_part:
            raise ValueError(f"period must contain a numeric value followed by a unit from {allowed_units}")

        try:
            num_value = int(num_part)
            if num_value <= 0:
                raise ValueError("period numeric value must be positive")
        except ValueError:
            raise ValueError("period numeric part must be a valid integer")

        # Validate the unit part
        if not unit_part or unit_part not in allowed_units:
            raise ValueError(f"period unit must be one of {allowed_units}")

        # Ensure that the number and unit are not separated by other characters
        if v != num_part + unit_part:
            raise ValueError("period format must be '<number><unit>' without spaces or other characters")

        return v

    class Config:
        """Configuration for the VolcengineTimeseriesRequest model.

        Provides example data for documentation purposes.
        """

        json_schema_extra = {
            "example": {
                "datasource_id": "ds-123456",
                "start_time": 1630000000,
                "end_time": 1630000600,
                "period": "60s",
                "instances": [{"instance_id": "i-123456"}],
            }
        }


class CloudMetricConfig(BaseModel):
    """Cloud Metric configuration for queries."""

    connect_name: str = Field(..., description="Connect name for authentication")
    region: str = Field(..., description="cloud region")
    namespace: str = Field(..., description="Namespace")
    metric_name: str = Field(..., description="Metric name")
    dimensions: Optional[List[Dict[str, str]]] = Field(default=None, description="Dimensions")
    group_by: Optional[List[str]] = Field(default=None, description="Group by dimensions")
