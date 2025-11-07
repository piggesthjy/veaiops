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

import json
from typing import Dict, List, Optional

from pydantic import BaseModel, Field, field_validator


class IntelligentThresholdConfig(BaseModel):
    """Intelligent threshold config."""

    start_hour: int = Field(..., description="Start hour")
    end_hour: int = Field(..., description="End hour")
    upper_bound: Optional[float] = Field(None, description="Upper bound")
    lower_bound: Optional[float] = Field(None, description="Lower bound")
    window_size: int = Field(..., description="Window size")


class MetricThresholdResult(BaseModel):
    """Individual metric threshold result."""

    name: str = Field(..., description="Metric name")
    thresholds: List[IntelligentThresholdConfig] = Field(..., description="Thresholds")
    labels: Dict[str, str] = Field(..., description="Labels")
    unique_key: str = Field(..., description="Unique key")
    status: str = Field(..., description="Status for each time series data")
    error_message: str = Field(..., description="Error message if status is not success")


class MetricInfo(BaseModel):
    """Information about a metric."""

    name: str = Field(..., description="Name of the metric", alias="Name")
    unit: Optional[str] = Field(None, description="Unit of the metric", alias="Unit")
    threshold: Optional[float] = Field(None, description="Threshold value for the alarm", alias="Threshold")
    current_value: Optional[float] = Field(None, description="Current value of the metric", alias="CurrentValue")
    description: Optional[str] = Field(None, description="Description of the metric", alias="Description")
    trigger_condition: Optional[str] = Field(
        None, description="Trigger condition for the metric", alias="TriggerCondition"
    )
    warning: Optional[bool] = Field(None, description="Whether the metric is in warning state", alias="Warning")
    description_cn: Optional[str] = Field(None, description="Chinese description of the metric", alias="DescriptionCn")
    description_en: Optional[str] = Field(None, description="English description of the metric", alias="DescriptionEn")


class DimensionInfo(BaseModel):
    """Information about a dimension."""

    name: str = Field(..., description="Name of the dimension", alias="Name")
    name_cn: Optional[str] = Field(None, description="Chinese name of the dimension", alias="NameCn")
    value: str = Field(..., description="Value of the dimension", alias="Value")
    description: Optional[str] = Field(None, description="Description of the dimension", alias="Description")


class NoDataMetricInfo(BaseModel):
    """Information about a no data metric."""

    name: str = Field(..., description="Name of the metric", alias="Name")
    unit: Optional[str] = Field(None, description="Unit of the metric", alias="Unit")
    threshold: Optional[float] = Field(None, description="Threshold value for the alarm", alias="Threshold")
    description: Optional[str] = Field(None, description="Description of the metric", alias="Description")


class DroppedMetricInfo(BaseModel):
    """Information about a dropped metric."""

    name: str = Field(..., description="Name of the metric", alias="Name")
    unit: Optional[str] = Field(None, description="Unit of the metric", alias="Unit")
    threshold: Optional[float] = Field(None, description="Threshold value for the alarm", alias="Threshold")
    description: Optional[str] = Field(None, description="Description of the metric", alias="Description")


class ResourceInfo(BaseModel):
    """Information about a resource."""

    alert_group_id: Optional[str] = Field(None, description="ID of the alert group", alias="AlertGroupId")
    id: str = Field(..., description="ID of the resource", alias="Id")
    name: str = Field(..., description="Name of the resource", alias="Name")
    region: str = Field(..., description="Region of the resource", alias="Region")
    first_alert_time: int = Field(..., description="Timestamp of the first alert", alias="FirstAlertTime")
    last_alert_time: int = Field(..., description="Timestamp of the last alert", alias="LastAlertTime")
    metrics: Optional[List[MetricInfo]] = Field(None, description="List of metrics", alias="Metrics")
    no_data_metrics: Optional[List[NoDataMetricInfo]] = Field(
        None, description="List of no data metrics", alias="NoDataMetrics"
    )
    dropped_metrics: Optional[List[DroppedMetricInfo]] = Field(
        None, description="List of dropped metrics", alias="DroppedMetrics"
    )
    dimensions: Optional[List[DimensionInfo]] = Field(None, description="List of dimensions", alias="Dimensions")
    project_name: Optional[str] = Field(None, description="Name of the project", alias="ProjectName")


class TagInfo(BaseModel):
    """Information about a tag."""

    key: str = Field(..., description="Key of the tag", alias="Key")
    value: str = Field(..., description="Value of the tag", alias="Value")


class BaseAlarmPayload(BaseModel):
    """Base payload model for alarm events."""

    pass


class VolcengineAlarmPayload(BaseAlarmPayload):
    """Payload model for Volcengine alarm events.

    Supports all event types: Metric (alarm), MetricRecovered (recovery),
    Event, MetricsNoData (no data alarm), NoDataRecovered (no data recovery).
    """

    type: str = Field(
        ...,
        description="Type of the event (Metric, MetricRecovered, Event, MetricsNoData, NoDataRecovered)",
        alias="Type",
    )
    account_id: str = Field(..., description="Account ID", alias="AccountId")
    rule_name: str = Field(..., description="Name of the alarm rule", alias="RuleName")
    rule_id: str = Field(..., description="ID of the alarm rule", alias="RuleId")
    namespace: str = Field(..., description="Namespace of the metric", alias="Namespace")
    sub_namespace: str = Field(..., description="Sub-namespace of the metric", alias="SubNamespace")
    level: str = Field(..., description="Alarm level (critical, warning, notice)", alias="Level")
    happened_at: str = Field(..., description="Time when the event occurred", alias="HappenedAt")
    rule_condition: Optional[str] = Field(None, description="Rule condition description", alias="RuleCondition")
    resources: Optional[List[ResourceInfo]] = Field(None, description="List of affected resources", alias="Resources")
    recovered_resources: Optional[List[ResourceInfo]] = Field(
        None, description="List of recovered resources", alias="RecoveredResources"
    )
    no_data_resources: Optional[List[ResourceInfo]] = Field(
        None, description="List of no data resources", alias="NoDataResources"
    )
    no_data_recovered_resources: Optional[List[ResourceInfo]] = Field(
        None, description="List of no data recovered resources", alias="NoDataRecoveredResources"
    )
    project: Optional[str] = Field(None, description="Project name", alias="Project")
    tags: Optional[List[TagInfo]] = Field(None, description="List of tags", alias="Tags")


class VolcengineAlarmNotification(BaseAlarmPayload):
    """Payload model for Volcengine alarm events.

    Supports all event types: Metric (alarm), MetricRecovered (recovery),
    Event, MetricsNoData (no data alarm), NoDataRecovered (no data recovery).
    """

    type: str = Field(
        ...,
        description="Type of the event (Metric, MetricRecovered, Event, MetricsNoData, NoDataRecovered)",
        alias="Type",
    )
    account_id: str = Field(..., description="Account ID", alias="AccountId")
    rule_name: str = Field(..., description="Name of the alarm rule", alias="RuleName")
    rule_id: str = Field(..., description="ID of the alarm rule", alias="RuleId")
    namespace: str = Field(..., description="Namespace of the metric", alias="Namespace")
    sub_namespace: str = Field(..., description="Sub-namespace of the metric", alias="SubNamespace")
    level: str = Field(..., description="Alarm level (critical, warning, notice)", alias="Level")
    happened_at: str = Field(..., description="Time when the event occurred", alias="HappenedAt")
    rule_condition: Optional[str] = Field(None, description="Rule condition description", alias="RuleCondition")
    resource: ResourceInfo = Field(..., description="affected resource", alias="Resource")
    project: Optional[str] = Field(None, description="Project name", alias="Project")
    tags: Optional[List[TagInfo]] = Field(None, description="List of tags", alias="Tags")


class CustomLabel(BaseModel):
    """Model for custom labels in Aliyun alarm events."""

    label: str
    value: str


class AliyunAlarmNotification(BaseAlarmPayload):
    """Payload model for Aliyun alarm events."""

    lastTime: Optional[str] = Field(None, description="Time when the event occurred")
    rawMetricName: Optional[str] = Field(None, description="Raw metric name")
    expression: Optional[str] = Field(None, description="Raw metric expression")
    metricName: Optional[str] = Field(None, description="Metric name")
    instanceName: Optional[str] = Field(None, description="Instance name")
    signature: Optional[str] = Field(None, description="Signature")
    groupId: Optional[str] = Field(None, description="Group ID")
    regionName: Optional[str] = Field(None, description="Region name")
    productGroupName: Optional[str] = Field(None, description="Product group name")
    metricProject: Optional[str] = Field(None, description="Metric project")
    userId: Optional[str] = Field(None, description="User ID")
    curValue: Optional[str] = Field(None, description="Current value")
    alertName: Optional[str] = Field(None, description="Alert name")
    regionId: Optional[str] = Field(None, description="Region ID")
    namespace: Optional[str] = Field(None, description="Namespace")
    triggerLevel: Optional[str] = Field(None, description="Trigger level")
    alertState: Optional[str] = Field(None, description="Alert state")
    preTriggerLevel: Optional[str] = Field(None, description="Previous trigger level")
    ruleId: Optional[str] = Field(None, description="Rule ID")
    dimensions: Optional[str] = Field(None, description="Dimensions")
    customLabels: Optional[List[CustomLabel]] = Field(None, description="Custom labels")


class ZabbixTag(BaseModel):
    """Information about a zabbix tag."""

    tag: str = Field(..., description="Tag name")
    value: str = Field(..., description="Tag value")


class ZabbixAlarmNotification(BaseModel):
    """Payload model for Zabbix alarm event parameters."""

    host_name: str = Field(..., description="Host name")
    host_id: str = Field(..., description="Host ID")
    ip: str = Field(..., description="IP address")
    item_name: str = Field(..., description="Item name")
    item_id: str = Field(..., description="Item ID")
    metric_name: str = Field(..., description="Metric name")
    item_value: str = Field(..., description="Item value")
    message: str = Field(..., description="Message")
    subject: str = Field(..., description="Subject")
    url: Optional[str] = Field(None, description="URL")
    tags: Optional[List[ZabbixTag]] = Field(None, description="Tags")
    trigger_status: Optional[str] = Field(None, description="Trigger status")

    @field_validator("tags", mode="before")
    def parse_tags(cls, v):
        """Parse tags from string to list of ZabbixTag."""
        if isinstance(v, str):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return []
        return v


class ZabbixAlarmPayload(BaseAlarmPayload):
    """Payload model for Zabbix alarm events."""

    params: ZabbixAlarmNotification = Field(..., description="Zabbix alarm parameters")
