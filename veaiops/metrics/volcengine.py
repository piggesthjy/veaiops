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
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import volcenginesdkcore
from pydantic import ConfigDict, Field
from volcenginesdkvolcobserve import (
    ConditionForCreateRuleInput,
    ConditionForUpdateRuleInput,
    ConvertTagForCreateRuleInput,
    CreateRuleRequest,
    DataForListRulesOutput,
    DeleteRulesByIdsRequest,
    GetMetricDataRequest,
    InstanceForGetMetricDataInput,
    ListContactGroupsRequest,
    ListContactGroupsResponse,
    ListRulesRequest,
    ListRulesResponse,
    RecoveryNotifyForCreateRuleInput,
    UpdateRuleRequest,
    VOLCOBSERVEApi,
)

from veaiops.lifespan.cache import volcengine_metric_cache
from veaiops.metrics.base import (
    BaseRuleConfig,
    BaseRuleSynchronizer,
    DataSource,
    generate_unique_key,
    rate_limit,
)
from veaiops.metrics.timeseries import InputTimeSeries
from veaiops.schema.types import EventLevel
from veaiops.utils.crypto import decrypt_secret_value
from veaiops.utils.log import logger

__all__ = ["VolcengineDataSource", "VolcengineClient"]


class VolcengineClient:
    """Unified client for managing Volcengine metrics and alarm rules."""

    def __init__(self, ak: str = None, sk: str = None, region: str = None):
        self.ak = ak
        self.sk = sk
        self.region = region
        self._api_instance = None

    @property
    def api_instance(self):
        """Get Volcengine OBSERVE API instance."""
        if self._api_instance is None:
            configuration = volcenginesdkcore.Configuration()
            configuration.ak = self.ak
            configuration.sk = self.sk
            if self.region:
                configuration.region = self.region
            self._api_instance = VOLCOBSERVEApi(volcenginesdkcore.ApiClient(configuration))
        return self._api_instance

    def get_metric_data(
        self,
        namespace: str,
        sub_namespace: str,
        metric_name: str,
        start_time: int,
        end_time: int,
        period: str,
        region: str = None,
        instances=None,
        group_by=None,
    ):
        """Fetch metric data from Volcengine."""
        current_region = region or self.region
        if not current_region:
            raise ValueError("Region must be provided either in constructor or method call")

        configuration = volcenginesdkcore.Configuration()
        configuration.ak = self.ak
        configuration.sk = self.sk
        configuration.region = current_region
        api_instance = VOLCOBSERVEApi(volcenginesdkcore.ApiClient(configuration))

        req = GetMetricDataRequest(
            namespace=namespace,
            sub_namespace=sub_namespace,
            metric_name=metric_name,
            start_time=start_time,
            end_time=end_time,
            period=period,
            instances=instances,
            group_by=group_by,
        )

        resp = api_instance.get_metric_data(req)
        return resp.to_dict()

    def create_rule(self, req: CreateRuleRequest, region: str = None) -> Dict[str, Any]:
        """Create an alarm rule.

        Wraps the CreateRule API.
        """
        current_region = region or self.region
        if not current_region:
            raise ValueError("Region must be provided either in constructor or method call")
        resp = self.api_instance.create_rule(req)
        return resp.to_dict()

    def update_rule(self, req: UpdateRuleRequest, region: str = None) -> Dict[str, Any]:
        """Update an alarm rule.

        Wraps the UpdateRule API.
        """
        current_region = region or self.region
        if not current_region:
            raise ValueError("Region must be provided either in constructor or method call")

        resp = self.api_instance.update_rule(req)
        return resp.to_dict()

    def delete_rules(self, rule_ids: List[str], region: str = None) -> Dict[str, Any]:
        """Delete one or more alarm rules by their IDs.

        Wraps the DeleteRulesByIds API.
        """
        current_region = region or self.region
        if not current_region:
            raise ValueError("Region must be provided either in constructor or method call")

        req = DeleteRulesByIdsRequest(ids=rule_ids)

        resp = self.api_instance.delete_rules_by_ids(req)
        return resp.to_dict()

    def list_rules(
        self,
        page_number: int = 1,
        page_size: int = 10,
        rule_name: Optional[str] = None,
        namespace: Optional[List[str]] = None,
        level: Optional[List[str]] = None,
        enable_state: Optional[List[str]] = None,
        alert_state: Optional[List[str]] = None,
        project_name: Optional[str] = None,
        region: Optional[str] = None,
    ) -> ListRulesResponse:
        """List alarm rules with filtering and pagination.

        Wraps the ListRulesByPage API.
        """
        current_region = region or self.region
        if not current_region:
            raise ValueError("Region must be provided either in constructor or method call")

        req = ListRulesRequest(
            project_name=project_name,
            page_number=page_number,
            page_size=page_size,
            rule_name=rule_name,
            namespace=namespace,
            level=level,
            alert_state=alert_state,
            enable_state=enable_state,
        )
        return self.api_instance.list_rules(req)

    def list_all_rules(
        self,
        rule_name: Optional[str] = None,
        namespace: Optional[List[str]] = None,
        level: Optional[List[str]] = None,
        enable_state: Optional[List[str]] = None,
        alert_state: Optional[List[str]] = None,
        project_name: Optional[str] = None,
        region: Optional[str] = None,
        batch_size: int = 100,
    ) -> List[DataForListRulesOutput]:
        """List all alarm rules with pagination support.

        This method automatically handles pagination to retrieve all rules.

        Args:
            rule_name: Filter by rule name (optional)
            namespace: Filter by namespace list (optional)
            level: Filter by level list (optional)
            enable_state: Filter by enable state list (optional)
            alert_state: Filter by alert state list (optional)
            project_name: Filter by project name (optional)
            region: Region for the API call (optional)
            batch_size: Number of rules to retrieve per page (default: 100)

        Returns:
            List of all alarm rules matching the criteria
        """
        all_rules = []
        page_number = 1

        while True:
            response = self.list_rules(
                page_number=page_number,
                page_size=batch_size,
                rule_name=rule_name,
                namespace=namespace,
                level=level,
                enable_state=enable_state,
                alert_state=alert_state,
                project_name=project_name,
                region=region,
            )
            rules = response.data
            if not rules:
                break

            all_rules.extend(rules)

            # Check if we've retrieved all rules
            total_count = response.total_count
            if len(all_rules) >= total_count:
                break

            page_number += 1

        return all_rules

    def list_contact_groups(
        self, name: Optional[str] = None, page_number: int = 1, page_size: int = 10
    ) -> ListContactGroupsResponse:
        """List contact groups with filtering.

        Args:
            name: Filter contact groups by name (optional)
            page_number: Page number (default: 1)
            page_size: Page size (default: 10)

        Returns:
            List of contact groups
        """
        # Create request object with optional filters
        request = ListContactGroupsRequest(name=name, page_number=page_number, page_size=page_size)
        # Call API with request parameters
        return self.api_instance.list_contact_groups(request)

    def test_connection(self) -> None:
        """Test if the Volcengine connection is working.

        Returns:
            None
        """
        # Try to list contact groups with a small page size to test connection
        self.list_contact_groups(page_number=1, page_size=1)
        return


class VolcengineDataSource(DataSource):
    """Volcengine data source implementation."""

    model_config = ConfigDict(arbitrary_types_allowed=True)
    region: str = Field(default="", description="Volcengine region")
    namespace: str = Field(default="", description="Namespace")
    metric_name: str = Field(default="", description="Metric name")
    sub_namespace: str = Field(default="", description="Sub namespace")
    group_by: Optional[List[str]] = Field(default=None, description="Group by dimensions")
    instances: Optional[List[InstanceForGetMetricDataInput]] = Field(default=None, description="Instance list")

    def __init__(self, **data: Any) -> None:
        super().__init__(**data)
        self._client = None

    @property
    def client(self):
        """Get Volcengine client instance."""
        if self._client is None:
            self._client = VolcengineClient(
                ak=self.connect.volcengine_access_key_id,
                sk=decrypt_secret_value(self.connect.volcengine_access_key_secret),
                region=self.region,
            )
        return self._client

    @rate_limit
    async def fetch_partial_data(
        self,
        namespace: str,
        sub_namespace: str,
        metric_name: str,
        start_time: int,
        end_time: int,
        period: str,
        region: str = None,
        instances=None,
        group_by=None,
    ):
        """Fetch partial metric data from Volcengine.

        This method provides a unified interface for fetching metric data
        that aligns with other cloud provider implementations.

        Args:
            namespace: Namespace for the metric
            sub_namespace: Sub namespace for the metric
            metric_name: Name of the metric to fetch
            start_time: Start timestamp in seconds
            end_time: End timestamp in seconds
            period: Aggregation period (e.g., "60s")
            region: Volcengine region (optional)
            instances: Instance filter (optional)
            group_by: Group by dimensions (optional)

        Returns:
            Response from the Volcengine API
        """

        def _get_metric_data(*args):
            return self.client.get_metric_data(
                namespace=namespace,
                sub_namespace=sub_namespace,
                metric_name=metric_name,
                start_time=start_time,
                end_time=end_time,
                period=period,
                region=region,
                instances=instances,
                group_by=group_by,
            )

        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, _get_metric_data)

    async def _fetch_one_slot(self, start: datetime, end: datetime | None = None) -> list[InputTimeSeries]:
        """Fetch metric data from Volcengine."""
        end = end or datetime.now(timezone.utc)
        resp = await self.fetch_partial_data(
            namespace=self.namespace,
            sub_namespace=self.sub_namespace,
            metric_name=self.metric_name,
            start_time=int(start.timestamp()),
            end_time=int(end.timestamp()),
            period=f"{self.interval_seconds}s",
            region=self.region,
            instances=self.instances,
            group_by=self.group_by,
        )

        timeseries_data = self.convert_datapoints_to_timeseries(resp)
        return timeseries_data

    def convert_datapoints_to_timeseries(self, datapoints) -> list[InputTimeSeries]:
        """Convert Volcengine metric data to time series format."""
        result = []

        metric_data_results = datapoints.get("data", {}).get("metric_data_results", [])

        for data_point in metric_data_results:
            data_points = data_point.get("data_points", [])
            dimensions = data_point.get("dimensions", [])

            timestamps, values = self._extract_timestamps_and_values(data_points)

            labels = self._extract_labels(dimensions)

            if timestamps and values:
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

        return result

    @staticmethod
    def _extract_timestamps_and_values(data_points):
        """Extract timestamps and values from data points."""
        timestamps = []
        values = []

        if not isinstance(data_points, list):
            data_points = [data_points] if data_points else []

        for point in data_points:
            if not isinstance(point, dict):
                raise Exception(f"Data point is not a dictionary: {point}")

            if "timestamp" not in point:
                raise Exception(f"Missing 'timestamp' field in data point: {point}")

            timestamp = point["timestamp"]
            if timestamp > 1e10:  # If it's a millisecond timestamp
                timestamp = timestamp // 1000
            timestamps.append(int(timestamp))

            if "value" not in point:
                raise Exception(f"Missing 'value' field in data point: {point}")

            value = point["value"]
            values.append(float(value))

        return timestamps, values

    @staticmethod
    def _extract_labels(dimensions):
        """Extract labels from dimension information."""
        labels = {}
        if dimensions:
            for dim in dimensions:
                if isinstance(dim, dict) and "name" in dim and "value" in dim:
                    value = dim["value"] if dim["value"] not in [None, ""] else "unknown"
                    labels[dim["name"]] = value
        return labels

    @staticmethod
    def _convert_label_to_dimensions(labels: Dict[str, str]) -> Dict[str, list[str]]:
        """Convert labels dictionary to dimension format for Volcengine API.

        Args:
            labels: Dictionary mapping label names to values

        Returns:
            List of dimension dictionaries in Volcengine API format
        """
        return {key: [value] for key, value in labels.items()}

    @staticmethod
    def _generate_unique_key_from_rule(rule: DataForListRulesOutput) -> str:
        """Generate unique key from alarm rule based on metric_name and original_dimensions.

        Args:
            rule: Alarm rule dictionary from Volcengine API

        Returns:
            Unique key string in format: metric_name|key1=value1,key2=value2
        """
        conditions = rule.conditions
        if len(conditions) == 0:
            return "Unknown"

        metric_name = conditions[0].metric_name
        original_dimensions = rule.original_dimensions

        if not original_dimensions:
            return "Unknown"

        # Convert original_dimensions to labels format
        labels = {}
        for key, values in original_dimensions.items():
            if values and isinstance(values, list) and len(values) > 0:
                labels[key] = values[0]

        # Generate unique key
        if labels:
            labels_str = ",".join(f"{k}={v}" for k, v in sorted(labels.items()))
            return f"{metric_name}|{labels_str}"
        else:
            return "Unknown"

    @property
    def concurrency_group(self) -> str:
        """Get the concurrency group for Volcengine API requests.

        This method generates a unique identifier based on the access key to implement
        rate limiting at the AK/SK level. Requests with the same AK/SK will be grouped
        together and share the same concurrency quota, while requests with different
        AK/SKs will be assigned to different concurrency groups.

        Returns:
            str: Unique concurrency group identifier in format "volcengine_{ak}"
        """
        ak = self.connect.volcengine_access_key_id
        return f"volcengine_{ak}"

    @property
    def get_concurrency_quota(self) -> int:
        """Get the concurrency quota for Volcengine API requests.

        Returns:
            int: The maximum number of concurrent requests allowed
        """
        return 10

    async def sync_rules_for_intelligent_threshold_task(self, **kwargs) -> Dict[str, Any]:
        """Synchronizes alarm rules with concurrent execution for better performance.

        Args:
            **kwargs: Keyword arguments including:
                task: Intelligent threshold task object
                task_version: Intelligent threshold task version
                contact_group_ids: List of contact group IDs (optional)
                alert_methods: List of alert methods (optional)
                webhook: Webhook URL for notifications (optional)
                max_workers: Maximum number of concurrent workers (default: 1)
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
                details: List of operation details
                created_rule_ids: List of created rule IDs
                updated_rule_ids: List of updated rule IDs
                deleted_rule_ids: List of deleted rule IDs
                rule_operations: List of rule operation details
        """
        """Synchronize alarm rules (optimized version).

        Uses rule synchronizer for clearer code structure.
        """
        config = VolcengineRuleConfig(**kwargs)
        synchronizer = RuleSynchronizer(self)
        return await synchronizer.sync_rules(config)

    async def delete_all_rules(self) -> None:
        """Delete all alarm rules associated with this data source.

        This method retrieves all rules matching the data source's name and namespace,
        then deletes them in batches of 10 to avoid API limitations.
        """
        logger.info(f"Starting deletion of all rules for data source: {self.name}")

        # Retrieve all rules associated with this data source
        all_rules = self.client.list_all_rules(rule_name=self.name, namespace=[self.namespace])

        if not all_rules:
            logger.info("No rules found for deletion")
            return

        logger.info(f"Found {len(all_rules)} rules for deletion")

        # Extract rule IDs
        rule_ids = [rule.id for rule in all_rules]

        # Delete in batches of 10 to avoid API limitations
        batch_size = 10

        for i in range(0, len(rule_ids), batch_size):
            batch = rule_ids[i : i + batch_size]
            logger.info(
                f"Deleting batch {i // batch_size + 1}/{(len(rule_ids) - 1) // batch_size + 1} "
                f"containing {len(batch)} rules"
            )

            # Delete the batch of rules
            self.client.delete_rules(batch)
            logger.info(f"Successfully deleted batch of {len(batch)} rules")

        logger.info(f"Completed deletion of all {len(rule_ids)} rules")


@dataclass
class VolcengineRuleConfig(BaseRuleConfig):
    """Rule configuration."""

    default_unit: str = "Percent"
    default_period: str = "60"
    default_evaluation_count: int = 3
    default_silence_time: int = 5

    @staticmethod
    def convert_alarm_level_to_monitor_level(alarm_level: EventLevel) -> str:
        """Convert alarm level from P0/P1/P2 to notice/warning/critical.

        Args:
            alarm_level: EventLevel enum value (P0, P1, or P2)

        Returns:
            Corresponding Volcengine level string (critical, warning, or notice)
        """
        level_mapping = {EventLevel.P0: "critical", EventLevel.P1: "warning", EventLevel.P2: "notice"}
        return level_mapping.get(alarm_level, "notice")  # default to "notice" if not found


class RuleSynchronizer(BaseRuleSynchronizer):
    """Rule synchronizer."""

    def __init__(self, datasource: VolcengineDataSource):
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

    async def sync_rules(self, config: VolcengineRuleConfig) -> Dict[str, Any]:
        """Asynchronously synchronize rules."""
        try:
            # Fetch existing rules
            existing_rules = await self._fetch_existing_rules()

            # Generate desired rules
            desired_rules = self._generate_desired_rules(config)

            # Calculate differences
            operations = self._calculate_operations(existing_rules, desired_rules)

            # Execute operations
            return await self._execute_operations(operations, config)

        except Exception as e:
            logger.error(f"Rule synchronization failed: {e}")
            raise

    async def _fetch_existing_rules(self) -> Dict[str, List[Dict]]:
        """Fetch existing rules."""
        rules = self.client.list_all_rules(
            rule_name=self.datasource.name, namespace=[self.datasource.namespace], enable_state=["enable"]
        )

        rule_map = {}
        for rule in rules:
            unique_key = self.datasource._generate_unique_key_from_rule(rule)
            rule_data = {
                "rule": rule,
                "id": rule.id,
                "rule_name": rule.rule_name,
                "time_range": f"{rule.effect_start_at}-{rule.effect_end_at}",
            }

            if unique_key not in rule_map:
                rule_map[unique_key] = []
            rule_map[unique_key].append(rule_data)

        return rule_map

    def _generate_desired_rules(self, config: VolcengineRuleConfig) -> Dict[str, List[Dict]]:
        """Generate desired rules."""
        if not config.task_version or not config.task_version.result:
            return {}

        result_rules = {}

        for metric_result in config.task_version.result:
            unique_key = metric_result.unique_key
            period_rules = []

            for threshold in metric_result.thresholds:
                start, end = self.format_time_range(threshold.start_hour, threshold.end_hour)

                rule_name = self._generate_rule_name(unique_key, start, end)

                period_rules.append(
                    {
                        "threshold": threshold,
                        "start": start,
                        "end": end,
                        "rule_name": rule_name,
                        "labels": metric_result.labels,
                        "unique_key": unique_key,
                    }
                )

            period_rules.sort(key=lambda x: (x["start"], x["end"]))
            result_rules[unique_key] = period_rules

        return result_rules

    def _generate_rule_name(self, unique_key: str, start: str, end: str) -> str:
        """Generate rule name with time range.

        Args:
            unique_key: Unique identifier for the rule
            start: Start time in HH:MM format
            end: End time in HH:MM format

        Returns:
            Formatted rule name string
        """
        return f"{self.datasource.name}_{unique_key}_{start}-{end}"

    @staticmethod
    def _calculate_operations(existing: Dict, desired: Dict) -> Dict[str, List[Dict]]:
        """Calculate required operations, properly handling segmented rule deletion."""
        operations = {"create": [], "update": [], "delete": []}

        # Process rules for each unique_key
        for unique_key, desired_rules in desired.items():
            existing_rules = existing.get(unique_key, [])

            # Sort by time range
            desired_rules.sort(key=lambda x: (x["start"], x["end"]))
            existing_rules.sort(key=lambda x: (x["rule"].effect_start_at, x["rule"].effect_end_at))

            desired_count = len(desired_rules)
            existing_count = len(existing_rules)

            # Prepare update rules (matching segments)
            for i in range(min(desired_count, existing_count)):
                operations["update"].append(
                    {
                        "existing": existing_rules[i],
                        "desired": desired_rules[i],
                        "rule_name": desired_rules[i]["rule_name"],
                        "rule_id": existing_rules[i]["id"],
                        "index": i,
                    }
                )

            # Prepare create rules (new segments)
            for i in range(existing_count, desired_count):
                operations["create"].append({"desired": desired_rules[i], "rule_name": desired_rules[i]["rule_name"]})

            # Prepare delete rules (excess segments)
            for i in range(desired_count, existing_count):
                operations["delete"].append(
                    {
                        "rule": existing_rules[i]["rule"].to_dict(),
                        "rule_name": existing_rules[i]["rule_name"],
                        "rule_id": existing_rules[i]["id"],
                    }
                )

        # Process rules with unique_key that don't exist at all
        for unique_key, existing_rules in existing.items():
            if unique_key not in desired:
                for rule_data in existing_rules:
                    operations["delete"].append(
                        {
                            "rule": rule_data["rule"].to_dict(),
                            "rule_id": rule_data["id"],
                        }
                    )

        return operations

    async def _execute_operations(self, operations: Dict, config: VolcengineRuleConfig) -> Dict[str, Any]:
        """Execute operations with rate limiting and retries."""
        # Prepare operations for base class execution
        all_operations = []

        # Add create operations
        for item in operations["create"]:
            operation = {"type": "create", "desired": item["desired"], "rule_name": item["rule_name"], "config": config}
            all_operations.append(operation)

        # Add update operations
        for item in operations["update"]:
            operation = {
                "type": "update",
                "desired": item["desired"],
                "rule_id": item["existing"]["id"],
                "rule_name": item["rule_name"],
                "config": config,
            }
            all_operations.append(operation)

        # Add delete operation
        if operations["delete"]:
            operation = {"type": "delete", "rule_ids": [item["rule_id"] for item in operations["delete"]]}
            all_operations.append(operation)

        # Define operation function map
        operation_func_map = {
            "create": lambda op: self._create_rule_wrapper(op["desired"], op["config"]),
            "update": lambda op: self._update_rule_wrapper(op["desired"], op["rule_id"], op["config"]),
            "delete": lambda op: self._delete_rules_wrapper(op["rule_ids"]),
        }

        # Use base class method to execute operations
        return await self.execute_operations(all_operations, operation_func_map)

    @rate_limit
    def _create_rule_wrapper(self, rule_data: Dict, config: VolcengineRuleConfig) -> Dict[str, Any]:
        """Create rule and return rule ID."""
        try:
            request = self._build_create_request(rule_data, config)
            result = self.client.create_rule(request)

            # Extract newly created rule ID
            data = result.get("data", [])
            if len(data) > 0:
                rule_id = data[0]
            else:
                rule_id = "unknown"

            return {
                "action": "create",
                "status": "success",
                "rule_id": rule_id,
                "response": result,
                "rule_name": rule_data["rule_name"],
            }
        except Exception as e:
            return {"action": "create", "status": "error", "error": str(e), "rule_name": rule_data["rule_name"]}

    @rate_limit
    def _update_rule_wrapper(self, rule_data: Dict, rule_id: str, config: VolcengineRuleConfig) -> Dict[str, Any]:
        """Update rule and return result."""
        try:
            request = self._build_update_request(rule_data, rule_id, config)
            result = self.client.update_rule(request)

            return {
                "action": "update",
                "status": "success",
                "rule_id": rule_id,
                "response": result,
                "rule_name": rule_data["rule_name"],
            }
        except Exception as e:
            return {
                "action": "update",
                "status": "error",
                "rule_id": rule_id,
                "error": str(e),
                "rule_name": rule_data["rule_name"],
            }

    @rate_limit
    def _delete_rules_wrapper(self, rule_ids: List[str]) -> Dict[str, Any]:
        """Delete rule and return result."""
        try:
            result = self.client.delete_rules(rule_ids)
            return {"action": "delete", "status": "success", "rule_ids": rule_ids, "response": result}
        except Exception as e:
            return {"action": "delete", "status": "error", "rule_ids": rule_ids, "error": str(e)}

    def _build_create_request(self, rule_data: Dict, config: VolcengineRuleConfig) -> CreateRuleRequest:
        """Build create request."""
        threshold = rule_data["threshold"]
        original_dimensions = self.datasource._convert_label_to_dimensions(rule_data["labels"])

        conditions = self._build_create_conditions(threshold, config)

        tags = self._build_tags(config)

        # Convert alarm level from P0/P1/P2 to notice/warning/critical
        volcengine_level = VolcengineRuleConfig.convert_alarm_level_to_monitor_level(config.alarm_level)

        # Ensure alert_methods contains "Webhook" if webhook is provided
        alert_methods = config.alert_methods or []
        if config.webhook and "Webhook" not in alert_methods:
            alert_methods = alert_methods + ["Webhook"]

        return CreateRuleRequest(
            multiple_conditions=True,
            alert_methods=alert_methods,
            condition_operator="||",
            conditions=conditions,
            contact_group_ids=config.contact_group_ids or [],
            effect_end_at=rule_data["end"],
            effect_start_at=rule_data["start"],
            enable_state="enable",
            evaluation_count=threshold.window_size or config.default_evaluation_count,
            level=volcengine_level,
            level_conditions=[],
            namespace=self.datasource.namespace,
            regions=[self.datasource.region],
            rule_name=self._generate_rule_name(rule_data["unique_key"], rule_data["start"], rule_data["end"]),
            rule_type="static",
            silence_time=config.default_silence_time,
            sub_namespace=self.datasource.sub_namespace,
            original_dimensions=original_dimensions,
            tags=tags,
            recovery_notify=RecoveryNotifyForCreateRuleInput(enable=True),
            webhook=config.webhook,
        )

    def _build_update_request(self, rule_data: Dict, rule_id: str, config: VolcengineRuleConfig) -> UpdateRuleRequest:
        """Build update request."""
        threshold = rule_data["threshold"]
        original_dimensions = self.datasource._convert_label_to_dimensions(rule_data["labels"])

        conditions = self._build_update_conditions(threshold, config)

        tags = self._build_tags(config)

        # Convert alarm level from P0/P1/P2 to notice/warning/critical
        volcengine_level = VolcengineRuleConfig.convert_alarm_level_to_monitor_level(config.alarm_level)

        # Ensure alert_methods contains "Webhook" if webhook is provided
        alert_methods = config.alert_methods or []
        if config.webhook and "Webhook" not in alert_methods:
            alert_methods = alert_methods + ["Webhook"]

        return UpdateRuleRequest(
            id=rule_id,
            alert_methods=alert_methods,
            condition_operator="||",
            conditions=conditions,
            contact_group_ids=config.contact_group_ids or [],
            multiple_conditions=True,
            effect_end_at=rule_data["end"],
            effect_start_at=rule_data["start"],
            enable_state="enable",
            evaluation_count=threshold.window_size or config.default_evaluation_count,
            level=volcengine_level,
            namespace=self.datasource.namespace,
            regions=[self.datasource.region],
            rule_name=self._generate_rule_name(rule_data["unique_key"], rule_data["start"], rule_data["end"]),
            rule_type="static",
            silence_time=config.default_silence_time,
            sub_namespace=self.datasource.sub_namespace,
            original_dimensions=original_dimensions,
            level_conditions=[],
            tags=tags,
            recovery_notify=RecoveryNotifyForCreateRuleInput(enable=True),
            webhook=config.webhook,
        )

    def _build_update_conditions(
        self, threshold: Any, config: VolcengineRuleConfig
    ) -> List[ConditionForUpdateRuleInput]:
        """Build condition list."""
        conditions = []

        # Get metric unit
        metric = volcengine_metric_cache.get_metric_by_name(self.datasource.metric_name)
        unit = metric.unit if metric else config.default_unit

        if threshold.upper_bound is not None:
            conditions.append(
                ConditionForUpdateRuleInput(
                    comparison_operator=">",
                    metric_name=self.datasource.metric_name,
                    metric_unit=unit,
                    period=config.default_period,
                    statistics="avg",
                    threshold=str(threshold.upper_bound),
                )
            )

        if threshold.lower_bound is not None:
            conditions.append(
                ConditionForUpdateRuleInput(
                    comparison_operator="<",
                    metric_name=self.datasource.metric_name,
                    metric_unit=unit,
                    period=config.default_period,
                    statistics="avg",
                    threshold=str(threshold.lower_bound),
                )
            )

        return conditions

    def _build_create_conditions(
        self, threshold: Any, config: VolcengineRuleConfig
    ) -> List[ConditionForCreateRuleInput]:
        """Build condition list."""
        conditions = []

        # Get metric unit
        metric = volcengine_metric_cache.get_metric_by_name(self.datasource.metric_name)
        unit = metric.unit if metric else config.default_unit

        if threshold.upper_bound is not None:
            conditions.append(
                ConditionForCreateRuleInput(
                    comparison_operator=">",
                    metric_name=self.datasource.metric_name,
                    metric_unit=unit,
                    period=config.default_period,
                    statistics="avg",
                    threshold=str(threshold.upper_bound),
                )
            )

        if threshold.lower_bound is not None:
            conditions.append(
                ConditionForCreateRuleInput(
                    comparison_operator="<",
                    metric_name=self.datasource.metric_name,
                    metric_unit=unit,
                    period=config.default_period,
                    statistics="avg",
                    threshold=str(threshold.lower_bound),
                )
            )

        return conditions

    @staticmethod
    def format_time_range(start_hour: int, end_hour: int) -> tuple[str, str]:
        """Convert hour range (0-24) to formatted time string.

        Args:
            start_hour: Start hour (0-24)
            end_hour: End hour (0-24)

        Returns:
            Formatted time string like "00:00-23:59"
        """
        try:
            if not (0 <= start_hour <= 24 and 0 <= end_hour <= 24):
                raise ValueError("Hours must be between 0 and 24")

            if start_hour >= end_hour != 24:
                raise ValueError("Start hour must be less than end hour")

            # Start time always ends with :00，HH：MM
            start_time = f"{start_hour:02d}:00"

            # End time should be the end of the previous hour (end_hour-1)
            # For example, if end_hour is 5, the end time should be 04:59
            if end_hour == 0:
                end_time = "00:59"
            elif end_hour == 24:
                end_time = "23:59"
            else:
                # Subtract 1 from end_hour to get the correct end time
                adjusted_end_hour = end_hour - 1
                end_time = f"{adjusted_end_hour:02d}:59"

            return start_time, end_time

        except ValueError:
            return "00:00", "23:59"

    @staticmethod
    def _build_tags(config: VolcengineRuleConfig) -> List[ConvertTagForCreateRuleInput]:
        """Build tags for the rule from task projects, products, and customers."""
        tags = []

        # Add projects tags if projects exist in the task
        if hasattr(config.task, "projects") and config.task.projects:
            # Always create separate tags for each project
            for i, project in enumerate(config.task.projects, 1):
                tag_key = f"projects_{i:02d}"  # projects01, projects02, etc.
                tag_value = project  # value is a string, not a list
                tags.append(
                    ConvertTagForCreateRuleInput(
                        key=tag_key,
                        value=tag_value,
                    )
                )

        return tags
