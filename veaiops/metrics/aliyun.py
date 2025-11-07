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

import asyncio
import json
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, List, Optional

from alibabacloud_cms20190101 import models as cms_20190101_models
from alibabacloud_cms20190101.client import Client as Cms20190101Client
from alibabacloud_tea_openapi import models as open_api_models
from alibabacloud_tea_util import models as util_models
from pydantic import ConfigDict, Field

from veaiops.metrics.base import (
    BaseRuleConfig,
    BaseRuleSynchronizer,
    DataSource,
    generate_unique_key,
    rate_limit,
)
from veaiops.metrics.timeseries import InputTimeSeries
from veaiops.schema.types import EventLevel
from veaiops.utils.log import logger

__all__ = ["AliyunDataSource", "AliyunClient"]

from veaiops.utils.crypto import decrypt_secret_value


@dataclass
class AliyunRuleConfig(BaseRuleConfig):
    """Rule configuration for Aliyun."""

    webhook: Optional[str] = ""

    @staticmethod
    def convert_alarm_level_to_aliyun_level(alarm_level: EventLevel) -> str:
        """Convert alarm level from P0/P1/P2 to Aliyun escalation level.

        Args:
            alarm_level: EventLevel enum value (P0, P1, or P2)

        Returns:
            Corresponding Aliyun escalation level ("critical", "warn", or "info")
        """
        level_mapping = {EventLevel.P0: "critical", EventLevel.P1: "warn", EventLevel.P2: "info"}
        return level_mapping.get(alarm_level, "info")  # default to "info" if not found


class RuleSynchronizer(BaseRuleSynchronizer):
    """Rule synchronizer for Aliyun."""

    def __init__(self, datasource: "AliyunDataSource"):
        super().__init__(datasource)
        self.datasource = datasource
        self.client = datasource.client

    @property
    def concurrency_group(self) -> str:
        """Get the concurrency group for Aliyun API requests.

        Uses ak/sk to generate a unique identifier for rate limiting.

        Returns:
            str: The concurrency group identifier based on ak/sk
        """
        return f"{self.datasource.concurrency_group}_rule"

    @property
    def get_concurrency_quota(self) -> int:
        """Get the concurrency quota for Aliyun API requests.

        Returns:
            int: The maximum number of concurrent requests allowed
        """
        return self.datasource.get_concurrency_quota

    async def sync_rules(self, config: AliyunRuleConfig) -> Dict[str, Any]:
        """Asynchronously synchronize rules."""
        try:
            # Fetch existing rules
            existing_rules = self.datasource._list_rules()

            # # Generate desired rules
            desired_rules = self.datasource._generate_rules(
                config.task, config.task_version, config.contact_group_ids, config.webhook, config.alarm_level
            )

            # Calculate differences
            create_rules, update_rules, delete_rule_ids = self.datasource._compare_rules(existing_rules, desired_rules)

            operations = {
                "create": create_rules,
                "update": update_rules,
                "delete": delete_rule_ids,
            }
            # Execute operations
            return await self._execute_operations(operations)

        except Exception as e:
            logger.error(f"Rule synchronization failed: {e}")
            raise

    async def _execute_operations(self, operations: Dict[str, list]) -> Dict[str, Any]:
        # Prepare operations for base class execution
        all_operations = []

        # Add create operations
        for rule in operations.get("create", []):
            operation = {"type": "create", "rule": rule, "rule_name": getattr(rule, "rule_name", "unknown")}
            all_operations.append(operation)

        # Add update operations
        for rule in operations.get("update", []):
            operation = {"type": "update", "rule": rule, "rule_name": getattr(rule, "rule_name", "unknown")}
            all_operations.append(operation)

        # Add delete operations
        delete_rule_ids = operations.get("delete", [])
        if delete_rule_ids:
            operation = {"type": "delete", "rule_ids": delete_rule_ids}
            all_operations.append(operation)

        # Define operation function map
        operation_func_map = {
            "create": lambda op: self._create_rule_wrapper(op["rule"]),
            "update": lambda op: self._update_rule_wrapper(op["rule"]),
            "delete": lambda op: self._delete_rules_wrapper(op["rule_ids"]),
        }

        # Use base class method to execute operations
        return await self.execute_operations(all_operations, operation_func_map)

    @rate_limit
    def _create_rule_wrapper(self, rule):
        try:
            result = self.datasource._put_rule(rule)
            return {
                "status": "success",
                "operation": "create",
                "rule_id": result.get("rule_id", "unknown"),
                "rule_name": getattr(rule, "rule_name", "unknown"),
                "response": result,
            }
        except Exception as e:
            return {
                "status": "error",
                "operation": "create",
                "rule_name": getattr(rule, "rule_name", "unknown"),
                "error": str(e),
            }

    @rate_limit
    def _update_rule_wrapper(self, rule):
        try:
            result = self.datasource._put_rule(rule)
            return {
                "status": "success",
                "operation": "update",
                "rule_id": result.get("rule_id", "unknown"),
                "rule_name": getattr(rule, "rule_name", "unknown"),
                "response": result,
            }
        except Exception as e:
            return {
                "status": "error",
                "operation": "update",
                "rule_name": getattr(rule, "rule_name", "unknown"),
                "error": str(e),
            }

    @rate_limit
    def _delete_rules_wrapper(self, rule_ids):
        try:
            result = self.datasource._delete_rules(rule_ids)
            # Return information for proper statistics handling
            return {
                "status": "success",
                "operation": "delete",
                "rule_id": rule_ids[0] if rule_ids else "unknown",  # For backward compatibility
                "rule_ids": rule_ids,  # List of all deleted rule IDs
                "rule_name": "Bulk delete rules",
                "response": result,
            }
        except Exception as e:
            return {
                "status": "error",
                "operation": "delete",
                "rule_id": rule_ids[0] if rule_ids else "unknown",  # For backward compatibility
                "rule_ids": rule_ids,  # List of all rule IDs that failed to delete
                "rule_name": "Bulk delete rules",
                "error": str(e),
            }


class AliyunClient:
    """Aliyun monitoring API client."""

    def __init__(self, ak: str, sk: str, region: str):
        self.access_key_id = ak
        self.access_key_secret = sk
        self.region = region
        self._client = self._create_client()

    def _create_client(self) -> Cms20190101Client:
        """Initialize account client with credentials."""
        config = open_api_models.Config(access_key_id=self.access_key_id, access_key_secret=self.access_key_secret)

        config.endpoint = f"metrics.{self.region}.aliyuncs.com"
        return Cms20190101Client(config)

    def get_metric_data(
        self,
        namespace: str,
        metric_name: str,
        dimensions: Optional[List[Dict[str, str]]],
        start_time: str,
        end_time: str,
        period: str = "60",
        express: Optional[Dict[str, List[str]]] = None,
        next_token: Optional[str] = None,
    ) -> cms_20190101_models.DescribeMetricListResponse:
        """Get specified metric data."""
        dimension_str = json.dumps(dimensions) if dimensions else "{}"
        express_str = json.dumps(express) if express else "{}"

        describe_metric_list_request = cms_20190101_models.DescribeMetricListRequest(
            namespace=namespace,
            metric_name=metric_name,
            dimensions=dimension_str,
            express=express_str,
            start_time=start_time,
            end_time=end_time,
            period=period,
        )

        if next_token:
            describe_metric_list_request.next_token = next_token

        runtime = util_models.RuntimeOptions()
        runtime.read_timeout = 10000
        runtime.connect_timeout = 5000

        return self._client.describe_metric_list_with_options(describe_metric_list_request, runtime)

    def get_existing_rules(
        self, request: cms_20190101_models.DescribeMetricRuleListRequest
    ) -> cms_20190101_models.DescribeMetricRuleListResponse:
        """Get existing rules for the metric.

        Args:
            request: DescribeMetricRuleListRequest structure.

        Returns:
            Response containing existing rules.
        """
        # Call the API to get existing rules
        runtime = util_models.RuntimeOptions()
        return self._client.describe_metric_rule_list_with_options(request, runtime)

    def create_rule(
        self,
        request: cms_20190101_models.PutResourceMetricRuleRequest,
    ) -> cms_20190101_models.PutResourceMetricRuleResponse:
        """Create rule for the metric.

        Args:
            request: PutResourceMetricRuleRequest structure

        Returns:
            Response from the API call.
        """
        runtime = util_models.RuntimeOptions()
        return self._client.put_resource_metric_rule_with_options(request, runtime)

    def delete_rules(
        self, request: cms_20190101_models.DeleteMetricRulesRequest
    ) -> cms_20190101_models.DeleteMetricRulesResponse:
        """Delete rules with the specified rule IDs.

        Args:
            request: DeleteMetricRulesRequest structure.

        Returns:
            Response from the API call.
        """
        # Call the API to delete the rules
        runtime = util_models.RuntimeOptions()
        return self._client.delete_metric_rules_with_options(request, runtime)

    def describe_project_meta(
        self, request: cms_20190101_models.DescribeProjectMetaRequest
    ) -> cms_20190101_models.DescribeProjectMetaResponse:
        """Get project meta data from Aliyun.

        Args:
            request: DescribeProjectMetaRequest structure.

        Returns:
            Response from the API call.
        """
        runtime = util_models.RuntimeOptions()
        return self._client.describe_project_meta_with_options(request, runtime)

    def describe_metric_meta_list(
        self, request: cms_20190101_models.DescribeMetricMetaListRequest
    ) -> cms_20190101_models.DescribeMetricMetaListResponse:
        """Get metric meta list from Aliyun.

        Args:
            request: DescribeMetricMetaListRequest structure.

        Returns:
            Response from the API call.
        """
        runtime = util_models.RuntimeOptions()
        runtime.queries = {}
        # Set page number and page size for pagination
        if request.page_number is not None:
            runtime.queries["PageNumber"] = request.page_number
        if request.page_size is not None:
            runtime.queries["PageSize"] = request.page_size
        return self._client.describe_metric_meta_list_with_options(request, runtime)

    def describe_contact_group_list(
        self, request: cms_20190101_models.DescribeContactGroupListRequest
    ) -> cms_20190101_models.DescribeContactGroupListResponse:
        """Get contact group list from Aliyun.

        Args:
            request: DescribeContactGroupListRequest structure.

        Returns:
            Response from the API call.
        """
        runtime = util_models.RuntimeOptions()
        runtime.read_timeout = 10000
        runtime.connect_timeout = 5000
        runtime.queries = {}
        # Set page number and page size for pagination
        if request.page_number is not None:
            runtime.queries["PageNumber"] = request.page_number
        if request.page_size is not None:
            runtime.queries["PageSize"] = request.page_size
        return self._client.describe_contact_group_list_with_options(request, runtime)

    def test_connection(self):
        """Test if the Aliyun connection is working.

        Returns:
            None
        """
        # Try to get project meta list to test connection
        request = cms_20190101_models.DescribeProjectMetaRequest(page_number=1, page_size=1)
        self.describe_project_meta(request)
        return


class AliyunDataSource(DataSource):
    """Aliyun monitoring data source implementation."""

    model_config = ConfigDict(arbitrary_types_allowed=True)

    region: str = Field(..., description="Aliyun region")
    namespace: str = Field(..., description="Namespace")
    metric_name: str = Field(..., description="Metric name")
    group_by: Optional[List[str]] = Field(default=None, description="Group by dimensions")
    dimensions: Optional[List[Dict[str, str]]] = Field(default=None, description="Dimensions")

    def __init__(self, **data: Any) -> None:
        super().__init__(**data)
        self._client = None

    @property
    def client(self) -> AliyunClient:
        """Get Aliyun client instance."""
        if self._client is None:
            self._client = AliyunClient(
                self.connect.aliyun_access_key_id,
                decrypt_secret_value(self.connect.aliyun_access_key_secret),
                self.region,
            )
        return self._client

    @rate_limit
    async def fetch_partial_data(
        self,
        namespace: str,
        metric_name: str,
        dimensions: Optional[List[Dict[str, str]]],
        start_time: str,
        end_time: str,
        period: str = "60",
        express: Optional[Dict[str, List[str]]] = None,
        next_token: Optional[str] = None,
    ) -> cms_20190101_models.DescribeMetricListResponse:
        """Fetch partial data for a single page from Aliyun API.

        Args:
            namespace: Namespace for the metric
            metric_name: Name of the metric
            dimensions: Dimensions for filtering
            start_time: Start time in format 'YYYY-MM-DD HH:MM:SS'
            end_time: End time in format 'YYYY-MM-DD HH:MM:SS'
            period: Aggregation period in seconds (default: "60")
            express: Expressions for grouping (default: None)
            next_token: Token for pagination (default: None)

        Returns:
            Response from Aliyun API containing metric data
        """

        def _get_metric_data(*args):
            return self.client.get_metric_data(
                namespace=namespace,
                metric_name=metric_name,
                dimensions=dimensions,
                start_time=start_time,
                end_time=end_time,
                period=period,
                express=express,
                next_token=next_token,
            )

        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, _get_metric_data)

    async def _fetch_one_slot(self, start: datetime, end: datetime | None = None) -> list[InputTimeSeries]:
        """Get Aliyun monitoring data."""
        all_data_points = await self._fetch_aliyun_data(start, end)
        return self._convert_datapoints_to_timeseries(all_data_points)

    async def _fetch_aliyun_data(self, start: datetime, end: datetime | None = None) -> list:
        """Get monitoring data from Aliyun API."""
        start_time_str = start.strftime("%Y-%m-%d %H:%M:%S")
        end_time_str = end.strftime("%Y-%m-%d %H:%M:%S")

        express = {"groupby": self.group_by} if self.group_by else {}

        all_data_points = []
        next_token = None

        while True:
            resp = await self.fetch_partial_data(
                namespace=self.namespace,
                metric_name=self.metric_name,
                dimensions=self.dimensions,
                start_time=start_time_str,
                end_time=end_time_str,
                period=str(self.interval_seconds),
                express=express,
                next_token=next_token,
            )

            data_points = []
            if hasattr(resp, "body") and hasattr(resp.body, "datapoints") and resp.body.datapoints:
                datapoints = resp.body.datapoints
                try:
                    data_points = json.loads(datapoints)
                except json.JSONDecodeError as e:
                    raise Exception(f"Failed to parse JSON data from Aliyun API: {e}")

            if isinstance(data_points, list):
                all_data_points.extend(data_points)

            if hasattr(resp.body, "next_token") and resp.body.next_token:
                next_token = resp.body.next_token
            else:
                break

        return all_data_points

    def _convert_datapoints_to_timeseries(self, all_data_points: list) -> list[InputTimeSeries]:
        """Convert Aliyun data points to time series format."""
        result = []
        instance_data = {}

        if isinstance(all_data_points, list):
            for point in all_data_points:
                try:
                    if isinstance(point, dict):
                        timestamp = point.get("timestamp")
                        value = point.get("Average")

                        group_key = self._get_group_key(point)

                        if timestamp:
                            timestamp_sec = int(timestamp / 1000)

                            if group_key not in instance_data:
                                labels = self._extract_labels(point)

                                instance_data[group_key] = {"timestamps": [], "values": [], "labels": labels}

                            instance_data[group_key]["timestamps"].append(timestamp_sec)
                            instance_data[group_key]["values"].append(value)
                except Exception as e:
                    raise Exception(f"Failed to convert data from Aliyun API: {e}") from e

            for group_key, inst_data in instance_data.items():
                try:
                    timestamps = []
                    values = []
                    for i in range(len(inst_data["timestamps"])):
                        try:
                            ts = inst_data["timestamps"][i]
                            val = inst_data["values"][i]
                            if ts is None or val is None:
                                raise Exception(f"Timestamp or value is None at index {i}")
                            timestamps.append(ts)
                            values.append(float(val))
                        except (ValueError, TypeError) as e:
                            raise Exception(f"Failed to convert data from Aliyun API: {e}") from e

                    labels = inst_data.get("labels", {})
                    unique_key = generate_unique_key(self.metric_name, labels)
                    result.append(
                        InputTimeSeries(
                            name=self.metric_name,
                            timestamps=timestamps,
                            values=values,
                            labels=labels,
                            unique_key=unique_key,
                        )
                    )
                except Exception as e:
                    raise Exception(f"Failed to convert data from Aliyun API: {e}") from e

        return result

    def _get_group_key(self, point: dict) -> str:
        """Determine grouping key based on actual fields in point data."""
        # Get all fields from point except timestamp and numeric fields as group keys
        exclude_fields = {"timestamp", "Minimum", "Maximum", "Average"}
        group_keys = []

        for field, value in point.items():
            if field not in exclude_fields:
                group_keys.append(f"{field}:{value}")

        if group_keys:
            # Sort by field names to ensure consistency
            group_keys.sort()
            return "|".join(group_keys)
        else:
            return "default"

    def _extract_labels(self, point: dict) -> dict:
        """Extract labels from data points."""
        labels = {}
        # Get all fields from point except timestamp and numeric fields as labels
        exclude_fields = {"timestamp", "Minimum", "Maximum", "Average"}

        for field, value in point.items():
            if field not in exclude_fields:
                labels[field] = str(value)

        return labels

    @property
    def concurrency_group(self) -> str:
        """Get the concurrency group for Aliyun API requests.

        Uses ak/sk to generate a unique identifier for rate limiting.

        Returns:
            str: The concurrency group identifier based on ak/sk
        """
        ak = self.connect.aliyun_access_key_id
        return f"aliyun_{ak}"

    @property
    def get_concurrency_quota(self) -> int:
        """Get the concurrency quota for Aliyun API requests.

        Returns:
            int: The maximum number of concurrent requests allowed
        """
        return 10

    @staticmethod
    def _build_labels(task) -> list:
        """Build labels for the rule from task projects, products, and customers.

        Args:
            task: Intelligent threshold task object

        Returns:
            List of labels in the format required by Aliyun
        """
        labels = []

        # Add projects labels if projects exist in the task
        if hasattr(task, "projects") and task.projects:
            # Always create separate labels for each project
            for i, project in enumerate(task.projects, 1):
                label_key = f"projects_{i:02d}"  # projects01, projects02, etc.
                label_value = project  # value is a string, not a list
                labels.append(
                    cms_20190101_models.PutResourceMetricRuleRequestLabels(
                        key=label_key,
                        value=label_value,
                    )
                )

        return labels

    def _create_escalations(self, aliyun_level: str, params: dict):
        """Create escalations based on aliyun level.

        Args:
            aliyun_level: The aliyun level ("critical", "warn", "info")
            params: Dictionary containing statistics, comparison_operator, threshold, and times

        Returns:
            PutResourceMetricRuleRequestEscalations object
        """
        escalations_critical = (
            cms_20190101_models.PutResourceMetricRuleRequestEscalationsCritical(
                statistics=params["statistics"],
                comparison_operator=params["comparison_operator"],
                threshold=params["threshold"],
                times=params["times"],
            )
            if aliyun_level == "critical"
            else None
        )

        escalations_warn = (
            cms_20190101_models.PutResourceMetricRuleRequestEscalationsWarn(
                statistics=params["statistics"],
                comparison_operator=params["comparison_operator"],
                threshold=params["threshold"],
                times=params["times"],
            )
            if aliyun_level == "warn"
            else None
        )

        escalations_info = (
            cms_20190101_models.PutResourceMetricRuleRequestEscalationsInfo(
                statistics=params["statistics"],
                comparison_operator=params["comparison_operator"],
                threshold=params["threshold"],
                times=params["times"],
            )
            if aliyun_level == "info"
            else None
        )

        escalations = cms_20190101_models.PutResourceMetricRuleRequestEscalations(
            critical=escalations_critical, warn=escalations_warn, info=escalations_info
        )

        return escalations

    def _generate_rules(self, task=None, task_version=None, contact_group_ids=None, webhook=None, alarm_level=None):
        """Generate desired rule keys from task result.

        Args:
            task: Intelligent threshold task object
            task_version: Intelligent threshold task version with analysis results
            contact_group_ids: Contact groups list
            webhook: Webhook url
            alarm_level: Alarm level (P0/P1/P2)

        Returns:
            Dict mapping unique keys to lists of period rules
        """
        if not task_version:
            return {}

        result_rule_keys = {}

        # Get alarm level from task config or parameter
        if alarm_level is None:
            alarm_level = getattr(task, "alarm_level", EventLevel.P2) if task else EventLevel.P2
        aliyun_level = AliyunRuleConfig.convert_alarm_level_to_aliyun_level(alarm_level)

        for metric_threshold_result in task_version.result or []:
            unique_key = metric_threshold_result.unique_key
            for period_threshold_rule in metric_threshold_result.thresholds:
                if period_threshold_rule.upper_bound is not None:
                    rule_id = (
                        f"{self.name}-{unique_key}-upper-"
                        f"{period_threshold_rule.start_hour}-"
                        f"{period_threshold_rule.end_hour}"
                    )

                    # Create escalations based on alarm level
                    escalations_params = {
                        "statistics": "Average",
                        "comparison_operator": "GreaterThanThreshold",
                        "threshold": str(period_threshold_rule.upper_bound),
                        "times": period_threshold_rule.window_size,
                    }

                    escalations = self._create_escalations(aliyun_level, escalations_params)
                    put_resource_metric_rule_request = cms_20190101_models.PutResourceMetricRuleRequest(
                        rule_id=rule_id,
                        rule_name=rule_id,
                        namespace=self.namespace,
                        metric_name=self.metric_name,
                        contact_groups=",".join(contact_group_ids if contact_group_ids else []),
                        webhook=webhook,
                        resources=json.dumps([{k: str(v) for k, v in metric_threshold_result.labels.items()}]),
                        effective_interval=f"{period_threshold_rule.start_hour:02d}:00-"
                        f"{period_threshold_rule.end_hour:02d}:00",
                        interval="60",
                        escalations=escalations,
                        labels=self._build_labels(task),
                    )

                    result_rule_keys[rule_id] = put_resource_metric_rule_request

                if period_threshold_rule.lower_bound is not None:
                    rule_id = (
                        f"{self.name}-{unique_key}-lower-"
                        f"{period_threshold_rule.start_hour}-"
                        f"{period_threshold_rule.end_hour}"
                    )

                    # Create escalations based on alarm level
                    escalations_params = {
                        "statistics": "Average",
                        "comparison_operator": "LessThanThreshold",
                        "threshold": str(period_threshold_rule.lower_bound),
                        "times": period_threshold_rule.window_size,
                    }

                    escalations = self._create_escalations(aliyun_level, escalations_params)
                    put_resource_metric_rule_request = cms_20190101_models.PutResourceMetricRuleRequest(
                        rule_id=rule_id,
                        rule_name=rule_id,
                        namespace=self.namespace,
                        metric_name=self.metric_name,
                        contact_groups=",".join(contact_group_ids if contact_group_ids else []),
                        webhook=webhook,
                        resources=json.dumps([{k: str(v) for k, v in metric_threshold_result.labels.items()}]),
                        effective_interval=f"{period_threshold_rule.start_hour:02d}:00-"
                        f"{period_threshold_rule.end_hour:02d}:00",
                        interval="60",
                        escalations=escalations,
                        labels=self._build_labels(task),
                    )

                    result_rule_keys[rule_id] = put_resource_metric_rule_request

        return result_rule_keys

    def _list_rules(self):
        """List existing rules from Aliyun.

        Returns:
            Dict mapping rule ID to existing rules
        """
        request = cms_20190101_models.DescribeMetricRuleListRequest(
            namespace=self.namespace,
            metric_name=self.metric_name,
            rule_name=f"{self.name}",
        )

        try:
            response = self.client.get_existing_rules(request)
            existing_rule_keys = {}

            if hasattr(response, "body") and hasattr(response.body, "alarms"):
                alarms = response.body.alarms
                if alarms and hasattr(alarms, "alarm"):
                    for alarm in alarms.alarm:
                        rule_id = getattr(alarm, "rule_id", None)
                        if not rule_id:
                            raise ValueError(f"Rule ID is None for alarm: {alarm}")
                        existing_rule_keys[rule_id] = alarm

            return existing_rule_keys
        except Exception as e:
            logger.error(f"Failed to list existing rules: {e}")
            raise

    @staticmethod
    def _compare_rules(existing_rules, desired_rules):
        """Compare existing rules with desired rules.

        Args:
            existing_rules: Dict of existing rules
            desired_rules: Dict of desired rules

        Returns:
            Tuple of (create_rules, update_rules, delete_rule_ids)
        """
        create_rules = []
        update_rules = []
        delete_rule_ids = []

        for rule_id, desired_period_rule in desired_rules.items():
            existing_period_rule = existing_rules.get(rule_id)
            if not existing_period_rule:
                create_rules.append(desired_period_rule)
            else:
                update_rules.append(desired_period_rule)

        for rule_id in existing_rules.keys():
            if rule_id not in desired_rules:
                delete_rule_ids.append(rule_id)

        return create_rules, update_rules, delete_rule_ids

    def _put_rule(self, rule: cms_20190101_models.PutResourceMetricRuleRequest):
        """Put a single rule.

        Args:
            rule: Rule object to create

        Returns:
            Creation or update detail dictionary
        """
        try:
            response = self.client.create_rule(rule)
            return {
                "rule_id": rule.rule_id,
                "status": "success",
                "response": response.to_dict() if hasattr(response, "to_dict") else str(response),
            }
        except Exception as e:
            logger.exception(f"Failed to put rule {rule.rule_id}: {e}")
            raise

    def _delete_rules(self, rule_ids: List[str]):
        """Delete multiple rules.

        Args:
            rule_ids: List of rule IDs to delete

        Returns:
            Deletion detail dictionary
        """
        try:
            request = cms_20190101_models.DeleteMetricRulesRequest(id=rule_ids)

            response = self.client.delete_rules(request)
            return {
                "rule_ids": rule_ids,
                "status": "success",
                "response": response.to_dict() if hasattr(response, "to_dict") else str(response),
            }
        except Exception as e:
            logger.exception(f"Failed to delete rules {rule_ids}: {e}")
            raise

    async def delete_all_rules(self) -> None:
        """Delete all alarm rules associated with this data source.

        This method retrieves all rules associated with the current data source
        and deletes them in batches to avoid API limitations.
        """
        # Get all rules associated with this data source
        existing_rules = self._list_rules()

        if not existing_rules:
            logger.info("No rules found to delete for data source")
            return

        # Extract rule IDs for deletion
        rule_ids = list(existing_rules.keys())
        logger.info(f"Found {len(rule_ids)} rules to delete")

        # Delete rules in batches (Aliyun may have limits on bulk deletions)
        batch_size = 10  # Adjust based on Aliyun's API limits

        for i in range(0, len(rule_ids), batch_size):
            batch = rule_ids[i : i + batch_size]
            # Delete the batch of rules
            self._delete_rules(batch)
            logger.info(f"Deleted batch of {len(batch)} rules")

        logger.info(f"Successfully deleted all {len(rule_ids)} rules")

    async def sync_rules_for_intelligent_threshold_task(self, **kwargs) -> Dict[str, Any]:
        """Synchronizes alarm rules with concurrent execution for better performance.

        Args:
            **kwargs: Keyword arguments including:
                task: Intelligent threshold task object
                task_version: Intelligent threshold task version
                contact_group_ids: List of contact group IDs (optional)
                alert_methods: List of alert methods (optional)
                max_workers: Maximum number of concurrent workers (default: 10)
                webhook: Webhook url for notifications
                rate_limit_period: Time period for rate limiting in seconds (default: 1.0)
                rate_limit_count: Maximum number of requests per period (default: 5)
                alarm_level: Alarm level (P0/P1/P2) (default: P2)


        Returns:
            Synchronization results dictionary with:
                total: Total number of operations
                created: Number of created rules
                updated: Number of updated rules
                deleted: Number of deleted rules
                failed: Number of failed operations
                created_rule_ids: List of created rule IDs
                updated_rule_ids: List of updated rule IDs
                deleted_rule_ids: List of deleted rule IDs
                rule_operations: List of rule operation details
        """
        config = AliyunRuleConfig(**kwargs)
        synchronizer = RuleSynchronizer(self)
        return await synchronizer.sync_rules(config)
