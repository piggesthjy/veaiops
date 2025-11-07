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
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from veaiops.metrics.volcengine import (
    VolcengineClient,
    VolcengineDataSource,
)
from veaiops.schema.documents.datasource.base import Connect
from veaiops.utils.crypto import EncryptedSecretStr


# Fixture for VolcengineDataSource
@pytest.fixture
def mock_volcengine_api():
    with patch("veaiops.metrics.volcengine.VOLCOBSERVEApi", autospec=True) as mock_api:
        mock_instance = mock_api.return_value
        yield mock_instance


@pytest.fixture
def volcengine_data_source():
    """Pytest fixture to create a VolcengineDataSource instance with a mocked connect object."""
    # Create a mock Connect object

    mock_connect = Connect(
        name="test_connect",
        type="Volcengine",
        volcengine_access_key_id="test_ak",
        volcengine_access_key_secret=EncryptedSecretStr("test_sk"),
        aliyun_access_key_id="dummy",
        aliyun_access_key_secret=EncryptedSecretStr("dummy"),
        zabbix_api_url="http://dummy.com",
        zabbix_api_user="dummy",
        zabbix_api_password=EncryptedSecretStr("dummy"),
    )

    with patch("veaiops.metrics.volcengine.VolcengineClient") as mock_client_class:
        mock_client_instance = mock_client_class.return_value
        mock_client_instance.get_metric_data = AsyncMock()

        data_source = VolcengineDataSource(
            id="volcengine_ds_1",
            name="Test Volcengine Source",
            type="Volcengine",
            interval_seconds=60,
            connect=mock_connect,
            region="cn-beijing",
            namespace="test_namespace",
            metric_name="cpu.usage_active",
            sub_namespace="ecs",
        )
        data_source._client = mock_client_instance
        yield data_source


# Tests for VolcengineDataSource
def test_volcengine_data_source_fetch_one_slot_success(volcengine_data_source):
    start = datetime(2023, 1, 1)
    end = start + timedelta(minutes=10)

    # Mock response data from Volcengine API
    mock_response = {
        "data": {
            "metric_data_results": [
                {
                    "data_points": [
                        {"timestamp": int(start.timestamp()) + 60, "value": "10.0"},
                        {"timestamp": int(start.timestamp()) + 120, "value": "11.0"},
                    ],
                    "dimensions": [
                        {"name": "Instance", "value": "i-123"},
                    ],
                }
            ]
        }
    }

    # Configure the mock client
    volcengine_data_source.client.get_metric_data = MagicMock(return_value=mock_response)

    time_series = asyncio.run(volcengine_data_source._fetch_one_slot(start, end))

    assert len(time_series) == 1
    ts1 = time_series[0]

    # Since InputTimeSeries is a TypedDict, we should access it as a dictionary
    assert ts1["name"] == "cpu.usage_active"
    assert ts1["labels"] == {"Instance": "i-123"}
    assert ts1["timestamps"] == [int(start.timestamp()) + 60, int(start.timestamp()) + 120]
    assert ts1["values"] == [10.0, 11.0]
    assert "unique_key" in ts1
    # Check the unique_key format: metric_name|key1=value1,...
    assert ts1["unique_key"] == "cpu.usage_active|Instance=i-123"


def test_volcengine_data_source_fetch_one_slot_multiple_instances(volcengine_data_source):
    start = datetime(2023, 1, 1)
    end = start + timedelta(minutes=10)

    # Mock response data from Volcengine API with multiple instances
    mock_response = {
        "data": {
            "metric_data_results": [
                {
                    "data_points": [
                        {"timestamp": int(start.timestamp()) + 60, "value": "10.0"},
                    ],
                    "dimensions": [
                        {"name": "Instance", "value": "i-123"},
                    ],
                },
                {
                    "data_points": [
                        {"timestamp": int(start.timestamp()) + 60, "value": "15.0"},
                    ],
                    "dimensions": [
                        {"name": "Instance", "value": "i-456"},
                    ],
                },
            ]
        }
    }

    # Configure the mock client
    volcengine_data_source.client.get_metric_data = MagicMock(return_value=mock_response)

    time_series = asyncio.run(volcengine_data_source._fetch_one_slot(start, end))

    assert len(time_series) == 2
    ts1 = time_series[0]
    ts2 = time_series[1]

    # Since InputTimeSeries is a TypedDict, we should access it as a dictionary
    assert ts1["name"] == "cpu.usage_active"
    assert ts1["labels"] == {"Instance": "i-123"}
    assert ts1["timestamps"] == [int(start.timestamp()) + 60]
    assert ts1["values"] == [10.0]
    assert "unique_key" in ts1
    assert ts1["unique_key"] == "cpu.usage_active|Instance=i-123"

    # Check second time series
    assert ts2["name"] == "cpu.usage_active"
    assert ts2["labels"] == {"Instance": "i-456"}
    assert ts2["timestamps"] == [int(start.timestamp()) + 60]
    assert ts2["values"] == [15.0]
    assert "unique_key" in ts2
    assert ts2["unique_key"] == "cpu.usage_active|Instance=i-456"


def test_volcengine_data_source_fetch_one_slot_error_handling(volcengine_data_source):
    """Test various error scenarios in _fetch_one_slot."""
    start = datetime(2023, 1, 1)
    end = start + timedelta(minutes=10)

    # Test API error
    volcengine_data_source.client.get_metric_data = MagicMock(side_effect=Exception("API Error"))
    with pytest.raises(Exception, match="API Error"):
        asyncio.run(volcengine_data_source._fetch_one_slot(start, end))

    # Test invalid timestamp
    mock_response_invalid = {
        "data": {
            "metric_data_results": [
                {
                    "data_points": [{"timestamp": "invalid", "value": "10.0"}],
                    "dimensions": [{"name": "Instance", "value": "i-123"}],
                }
            ]
        }
    }
    volcengine_data_source.client.get_metric_data = MagicMock(return_value=mock_response_invalid)
    with pytest.raises(Exception):
        asyncio.run(volcengine_data_source._fetch_one_slot(start, end))

    # Test missing value field
    mock_response_missing = {
        "data": {
            "metric_data_results": [
                {
                    "data_points": [{"timestamp": int(start.timestamp()) + 60}],
                    "dimensions": [{"name": "Instance", "value": "i-123"}],
                }
            ]
        }
    }
    volcengine_data_source.client.get_metric_data = MagicMock(return_value=mock_response_missing)
    with pytest.raises(Exception, match=r"Missing 'value' field in data point: .*"):
        asyncio.run(volcengine_data_source._fetch_one_slot(start, end))


# Tests for VolcengineClient
@pytest.fixture
def volcengine_client(mock_volcengine_api):
    from veaiops.utils.crypto import decrypt_secret_value

    # Create an EncryptedSecretStr and decrypt it for the client
    encrypted_sk = EncryptedSecretStr("test_sk")
    decrypted_sk = decrypt_secret_value(encrypted_sk)

    client = VolcengineClient(
        ak="test_ak",
        sk=decrypted_sk,
        region="cn-beijing",
    )
    client._api_instance = mock_volcengine_api
    return client


def test_volcengine_client_create_rule(volcengine_client, mock_volcengine_api):
    # Mock response
    mock_response = MagicMock()
    mock_response.to_dict.return_value = {"rule_id": "test_rule_id"}
    mock_volcengine_api.create_rule.return_value = mock_response

    # Create a mock request
    mock_request = MagicMock()

    result = volcengine_client.create_rule(mock_request)

    assert result == {"rule_id": "test_rule_id"}
    mock_volcengine_api.create_rule.assert_called_once_with(mock_request)


def test_volcengine_client_delete_rules(volcengine_client, mock_volcengine_api):
    # Mock response
    mock_response = MagicMock()
    mock_response.to_dict.return_value = {"deleted": True}
    mock_volcengine_api.delete_rules_by_ids.return_value = mock_response

    result = volcengine_client.delete_rules(["rule1", "rule2"])

    assert result == {"deleted": True}
    mock_volcengine_api.delete_rules_by_ids.assert_called_once()


def test_volcengine_client_list_all_rules(volcengine_client, mock_volcengine_api):
    """Test list_all_rules with pagination."""
    # Mock first page response
    mock_response1 = MagicMock()
    mock_rule1 = MagicMock()
    mock_rule1.rule_id = "rule1"
    mock_rule2 = MagicMock()
    mock_rule2.rule_id = "rule2"
    mock_response1.data = [mock_rule1, mock_rule2]
    mock_response1.total_count = 4

    # Mock second page response
    mock_response2 = MagicMock()
    mock_rule3 = MagicMock()
    mock_rule3.rule_id = "rule3"
    mock_rule4 = MagicMock()
    mock_rule4.rule_id = "rule4"
    mock_response2.data = [mock_rule3, mock_rule4]
    mock_response2.total_count = 4

    mock_volcengine_api.list_rules.side_effect = [mock_response1, mock_response2]

    result = volcengine_client.list_all_rules(batch_size=2)

    assert len(result) == 4
    assert result[0].rule_id == "rule1"
    assert result[3].rule_id == "rule4"


def test_volcengine_client_list_all_rules_with_filters(volcengine_client, mock_volcengine_api):
    """Test list_all_rules with filters."""
    mock_response = MagicMock()
    mock_rule = MagicMock()
    mock_rule.rule_id = "rule1"
    mock_response.data = [mock_rule]
    mock_response.total_count = 1

    mock_volcengine_api.list_rules.return_value = mock_response

    result = volcengine_client.list_all_rules(
        rule_name="test_rule",
        namespace=["VCM_ECS"],
        level=["critical"],
        enable_state=["enabled"],
    )

    assert len(result) == 1
    assert result[0].rule_id == "rule1"


def test_volcengine_rule_config_convert_alarm_level():
    """Test VolcengineRuleConfig.convert_alarm_level_to_monitor_level."""
    from veaiops.metrics.volcengine import VolcengineRuleConfig
    from veaiops.schema.types import EventLevel

    assert VolcengineRuleConfig.convert_alarm_level_to_monitor_level(EventLevel.P0) == "critical"
    assert VolcengineRuleConfig.convert_alarm_level_to_monitor_level(EventLevel.P1) == "warning"
    assert VolcengineRuleConfig.convert_alarm_level_to_monitor_level(EventLevel.P2) == "notice"


def test_volcengine_data_source_generate_unique_key_from_rule():
    """Test _generate_unique_key_from_rule static method."""
    from veaiops.metrics.volcengine import VolcengineDataSource

    mock_rule = MagicMock()
    mock_rule.rule_name = "test_rule"
    mock_rule.sub_namespace = "ecs"
    mock_rule.regions = ["cn-beijing"]

    # Mock the labels field
    mock_label = MagicMock()
    mock_label.name = "InstanceId"
    mock_label.value = ["i-123"]
    mock_rule.labels = [mock_label]

    result = VolcengineDataSource._generate_unique_key_from_rule(mock_rule)

    assert isinstance(result, str)
    assert len(result) > 0


@pytest.mark.asyncio
async def test_volcengine_data_source_sync_rules_for_intelligent_threshold_task(volcengine_data_source):
    """Test sync_rules_for_intelligent_threshold_task method."""
    from veaiops.schema.types import EventLevel

    mock_task = MagicMock()
    mock_task.namespace = "VCM_ECS"
    mock_task.datasource_id = volcengine_data_source.id
    mock_task.projects = ["project1"]

    mock_task_version = MagicMock()
    mock_task_version.threshold_config = MagicMock()
    mock_task_version.threshold_config.operator = ">="
    mock_task_version.threshold_config.threshold = 80.0
    mock_task_version.threshold_config.aggregation_type = "avg"
    mock_task_version.threshold_config.window_size = 3

    # Mock client methods
    with patch.object(volcengine_data_source.client, "list_all_rules", return_value=[]):
        with patch.object(volcengine_data_source.client, "create_rule", return_value={"rule_id": "test_rule_id"}):
            result = await volcengine_data_source.sync_rules_for_intelligent_threshold_task(
                task=mock_task,
                task_version=mock_task_version,
                contact_group_ids=["group1"],
                alert_methods=["Email"],
                alarm_level=EventLevel.P1,
            )

            assert "total" in result
            assert "created" in result
            assert "updated" in result
            assert "deleted" in result


def test_volcengine_data_source_convert_datapoints_to_timeseries(volcengine_data_source):
    """Test convert_datapoints_to_timeseries method."""
    start = datetime(2023, 1, 1)

    datapoints = {
        "data": {
            "metric_data_results": [
                {
                    "data_points": [
                        {"timestamp": int(start.timestamp()), "value": "10.0"},
                        {"timestamp": int(start.timestamp()) + 60, "value": "20.0"},
                    ],
                    "dimensions": [
                        {"name": "InstanceId", "value": "i-123"},
                    ],
                }
            ]
        }
    }

    result = volcengine_data_source.convert_datapoints_to_timeseries(datapoints)

    assert len(result) == 1
    assert result[0]["labels"]["InstanceId"] == "i-123"
    assert len(result[0]["timestamps"]) == 2
    assert len(result[0]["values"]) == 2


def test_volcengine_data_source_conversion_helpers(volcengine_data_source):
    """Test data conversion helper methods."""
    from veaiops.metrics.volcengine import VolcengineDataSource

    # Test convert_datapoints_to_timeseries with empty data
    assert volcengine_data_source.convert_datapoints_to_timeseries({}) == []

    # Test _extract_timestamps_and_values
    data_points = [
        {"timestamp": 1640000000, "value": "10.5"},
        {"timestamp": 1640000060, "value": "20.3"},
    ]
    timestamps, values = VolcengineDataSource._extract_timestamps_and_values(data_points)
    assert len(timestamps) == 2 and len(values) == 2
    assert timestamps[0] == 1640000000 and values[0] == 10.5

    # Test api_instance property initialization
    client = VolcengineClient(ak="test_ak", sk="test_sk", region="cn-beijing")
    api = client.api_instance
    assert api is not None and client.api_instance is api  # Lazy init + singleton


def test_volcengine_client_get_metric_data_with_instances():
    """Test get_metric_data with instances parameter."""
    client = VolcengineClient(ak="test_ak", sk="test_sk", region="cn-beijing")

    with patch("veaiops.metrics.volcengine.VOLCOBSERVEApi") as mock_api_class:
        mock_api_instance = mock_api_class.return_value
        mock_response = MagicMock()
        mock_response.to_dict.return_value = {"data": {}}
        mock_api_instance.get_metric_data.return_value = mock_response

        result = client.get_metric_data(
            namespace="VCM_ECS",
            sub_namespace="ecs",
            metric_name="CpuUsagePercent",
            start_time=1640000000,
            end_time=1640000060,
            period="60",
            instances=[{"name": "InstanceId", "value": ["i-123"]}],
        )

        assert "data" in result


def test_volcengine_client_operations_without_region():
    """Test various client operations raise error when region is not provided."""
    client = VolcengineClient(ak="test_ak", sk="test_sk")

    # Test create_rule
    with pytest.raises(ValueError, match="Region must be provided"):
        client.create_rule(MagicMock())

    # Test update_rule
    with pytest.raises(ValueError, match="Region must be provided"):
        client.update_rule(MagicMock())

    # Test delete_rules
    with pytest.raises(ValueError, match="Region must be provided"):
        client.delete_rules(["rule1"])

    # Test list_rules
    with pytest.raises(ValueError, match="Region must be provided"):
        client.list_rules()


def test_volcengine_client_list_contact_groups_with_mock():
    """Test list_contact_groups with mock to avoid actual API call."""
    client = VolcengineClient(ak="test_ak", sk="test_sk", region="cn-beijing")

    # Mock the _api_instance directly
    mock_api = MagicMock()
    mock_response = MagicMock()
    mock_api.list_contact_groups.return_value = mock_response
    client._api_instance = mock_api

    result = client.list_contact_groups(name="test")

    assert result == mock_response
    mock_api.list_contact_groups.assert_called_once()


def _create_test_volcengine_data_source():
    """Helper to create a test Volcengine data source. Must be called within a patch context."""
    from volcenginesdkvolcobserve import DimensionForGetMetricDataInput, InstanceForGetMetricDataInput

    from veaiops.metrics.volcengine import VolcengineDataSource
    from veaiops.schema.documents.datasource.base import Connect

    connect = Connect(
        name="test_volcengine_connect",
        type="Volcengine",
        volcengine_access_key_id="test_ak",
        volcengine_access_key_secret=EncryptedSecretStr("test_sk"),
        aliyun_access_key_id="dummy",
        aliyun_access_key_secret=EncryptedSecretStr("dummy"),
        zabbix_api_url="http://dummy.com",
        zabbix_api_user="dummy",
        zabbix_api_password=EncryptedSecretStr("dummy"),
    )

    # Create instance with proper format
    dimensions = [DimensionForGetMetricDataInput(name="InstanceId", value="i-123")]
    instances = [InstanceForGetMetricDataInput(dimensions=dimensions)]

    volcengine_data_source = VolcengineDataSource(
        connect=connect,
        id="volcengine_ds_1",
        name="Test Volcengine Source",
        type="Volcengine",
        instances=instances,
        interval_seconds=60,
        region="cn-beijing",
        namespace="VCM_ECS",
        metric_name="CpuUtil",
    )
    return volcengine_data_source


def test_volcengine_client_rule_operations_error_handling():
    """Test create_rule and update_rule error handling."""
    client = VolcengineClient(ak="test_ak", sk="test_sk", region="cn-beijing")
    mock_req = MagicMock()

    # Test create_rule error handling
    mock_api = MagicMock()
    mock_api.create_rule.side_effect = Exception("API Error")
    client._api_instance = mock_api

    with pytest.raises(Exception, match="API Error"):
        client.create_rule(req=mock_req)

    # Test update_rule error handling
    mock_api.update_rule.side_effect = Exception("API Error")
    with pytest.raises(Exception, match="API Error"):
        client.update_rule(req=mock_req)


def test_volcengine_client_edge_cases():
    """Test various client edge cases and error handling."""
    client = VolcengineClient(ak="test_ak", sk="test_sk", region="cn-beijing")
    mock_api = MagicMock()
    client._api_instance = mock_api

    # Test delete_rules with empty list
    mock_api.delete_rules.return_value = None
    client.delete_rules(rule_ids=[])  # Should not raise error

    # Test test_connection success
    mock_response = MagicMock()
    mock_response.contact_groups = []
    mock_api.list_contact_groups.return_value = mock_response
    result = client.test_connection()
    assert result is None

    # Test test_connection failure
    mock_api.list_contact_groups.side_effect = Exception("Connection failed")
    with pytest.raises(Exception, match="Connection failed"):
        client.test_connection()
