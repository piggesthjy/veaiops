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

"""Data source factory for creating appropriate data source instances based on configuration."""

import logging
from typing import Any, Dict

from veaiops.metrics.aliyun import AliyunDataSource
from veaiops.metrics.base import DataSource
from veaiops.metrics.volcengine import VolcengineDataSource
from veaiops.metrics.zabbix import ZabbixDataSource
from veaiops.schema.documents import DataSource as DataSourceDocument

logger = logging.getLogger(__name__)

__all__ = ["DataSourceFactory"]


class DataSourceFactory:
    """Factory class for creating data source instances based on configuration."""

    @staticmethod
    def create_datasource(doc: DataSourceDocument) -> DataSource:
        """Create appropriate data source instance based on the document configuration.

        Args:
            doc: Data source document from database

        Returns:
            Configured data source instance

        Raises:
            ValueError: If data source type is not supported
        """
        if not doc:
            raise ValueError("Data source document is required")

        logger.info(f"Creating data source of type: {doc.type}")

        # Common parameters for all data sources
        common_params = {
            "id": str(doc.id),
            "name": doc.name,
            "interval_seconds": 60,  # Default interval
        }

        if doc.type == "Zabbix":
            return DataSourceFactory._create_zabbix_datasource(doc, common_params)
        elif doc.type == "Aliyun":
            return DataSourceFactory._create_aliyun_datasource(doc, common_params)
        elif doc.type == "Volcengine":
            return DataSourceFactory._create_volcengine_datasource(doc, common_params)
        else:
            raise ValueError(f"Unsupported data source type: {doc.type}")

    @staticmethod
    def _create_zabbix_datasource(doc: DataSourceDocument, common_params: Dict[str, Any]) -> ZabbixDataSource:
        """Create Zabbix data source instance."""
        if not doc.zabbix_config:
            raise ValueError("Zabbix configuration is required for Zabbix data source")

        params = {**common_params}

        # Map zabbix_config to ZabbixDataSource parameters
        if doc.zabbix_config.metric_name:
            params["metric_name"] = doc.zabbix_config.metric_name

        if doc.zabbix_config.history_type:
            params["history_type"] = doc.zabbix_config.history_type

        # Convert targets to ZabbixTarget objects
        if doc.zabbix_config.targets:
            from veaiops.metrics.zabbix import ZabbixTarget

            params["targets"] = [
                ZabbixTarget(itemid=target.itemid, hostname=target.hostname) for target in doc.zabbix_config.targets
            ]

        if doc.connect:
            params["connect"] = doc.connect
        return ZabbixDataSource(**params)

    @staticmethod
    def _create_aliyun_datasource(doc: DataSourceDocument, common_params: Dict[str, Any]) -> AliyunDataSource:
        """Create Aliyun data source instance."""
        if not doc.aliyun_config:
            raise ValueError("Aliyun configuration is required for Aliyun data source")

        params = {**common_params}

        # Map aliyun_config to AliyunDataSource parameters
        if doc.aliyun_config.region:
            params["region"] = doc.aliyun_config.region
        if doc.aliyun_config.namespace:
            params["namespace"] = doc.aliyun_config.namespace
        if doc.aliyun_config.metric_name:
            params["metric_name"] = doc.aliyun_config.metric_name
        if doc.aliyun_config.dimensions:
            params["dimensions"] = doc.aliyun_config.dimensions
        if doc.aliyun_config.group_by:
            params["group_by"] = doc.aliyun_config.group_by
        if doc.connect:
            params["connect"] = doc.connect

        return AliyunDataSource(**params)

    @staticmethod
    def _create_volcengine_datasource(doc: DataSourceDocument, common_params: Dict[str, Any]) -> VolcengineDataSource:
        """Create Volcengine data source instance."""
        if not doc.volcengine_config:
            raise ValueError("Volcengine configuration is required for Volcengine data source")

        params = {**common_params}

        # Map volcengine_config to VolcengineDataSource parameters
        if doc.volcengine_config.region:
            params["region"] = doc.volcengine_config.region
        if doc.volcengine_config.namespace:
            params["namespace"] = doc.volcengine_config.namespace
        if doc.volcengine_config.metric_name:
            params["metric_name"] = doc.volcengine_config.metric_name
        if doc.volcengine_config.sub_namespace:
            params["sub_namespace"] = doc.volcengine_config.sub_namespace
        if doc.volcengine_config.group_by:
            params["group_by"] = doc.volcengine_config.group_by
        if doc.connect:
            params["connect"] = doc.connect
        # Convert instances format
        if doc.volcengine_config.instances:
            from volcenginesdkvolcobserve import DimensionForGetMetricDataInput, InstanceForGetMetricDataInput

            instances = []
            for instance_dict in doc.volcengine_config.instances:
                dimensions = []
                for key, value in instance_dict.items():
                    dimensions.append(DimensionForGetMetricDataInput(name=key, value=value))
                instances.append(InstanceForGetMetricDataInput(dimensions=dimensions))

            params["instances"] = instances

        return VolcengineDataSource(**params)

    @staticmethod
    def validate_config(doc: DataSourceDocument) -> bool:
        """Validate if the data source configuration is valid.

        Args:
            doc: Data source document

        Returns:
            True if configuration is valid, False otherwise
        """
        if not doc:
            return False

        config_map = {
            "Zabbix": doc.zabbix_config,
            "Aliyun": doc.aliyun_config,
            "Volcengine": doc.volcengine_config,
        }

        required_config = config_map.get(doc.type)
        return required_config is not None

    @staticmethod
    def get_config_summary(doc: DataSourceDocument) -> Dict[str, Any]:
        """Get a summary of the data source configuration."""
        if not doc:
            return {}

        summary = {
            "id": str(doc.id),
            "name": doc.name,
            "type": doc.type,
            "is_active": doc.is_active,
        }

        if doc.type == "Zabbix" and doc.zabbix_config:
            summary.update(
                {
                    "metric_name": doc.zabbix_config.metric_name,
                    "targets_count": len(doc.zabbix_config.targets or []),
                }
            )
        elif doc.type == "Aliyun" and doc.aliyun_config:
            summary.update(
                {
                    "region": doc.aliyun_config.region,
                    "namespace": doc.aliyun_config.namespace,
                    "metric_name": doc.aliyun_config.metric_name,
                }
            )
        elif doc.type == "Volcengine" and doc.volcengine_config:
            summary.update(
                {
                    "region": doc.volcengine_config.region,
                    "namespace": doc.volcengine_config.namespace,
                    "metric_name": doc.volcengine_config.metric_name,
                    "sub_namespace": doc.volcengine_config.sub_namespace,
                }
            )

        return summary
