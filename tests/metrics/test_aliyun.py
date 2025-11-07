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

from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch

import pytest
import pytest_asyncio

from veaiops.metrics.aliyun import (
    AliyunClient,
    AliyunDataSource,
)
from veaiops.schema.base.data_source import AliyunDataSourceConfig
from veaiops.schema.documents import Connect
from veaiops.schema.documents.datasource.base import DataSource as DataSourceDoc
from veaiops.utils.crypto import EncryptedSecretStr


# Fixture for AliyunDataSource
@pytest_asyncio.fixture
async def aliyun_data_source():
    """Pytest fixture to create a AliyunDataSource instance with a real connect object in db."""
    # Create a Connect document in the in-memory database
    connect_doc = await Connect(
        name="test_connect",
        type="Aliyun",
        aliyun_access_key_id="test_ak",
        aliyun_access_key_secret=EncryptedSecretStr("test_sk"),
        volcengine_access_key_id="dummy",
        volcengine_access_key_secret=EncryptedSecretStr("dummy"),
        zabbix_api_url="http://dummy.com",
        zabbix_api_user="dummy",
        zabbix_api_password=EncryptedSecretStr("dummy"),
    ).create()

    # 2. Create DataSource document
    ds_doc = await DataSourceDoc(
        name="Test Aliyun Source",
        type="Aliyun",
        connect=connect_doc,
        aliyun_config=AliyunDataSourceConfig(
            connect_name="test_connect",
            region="cn-beijing",
            namespace="test_namespace",
            metric_name="cpu.usage_active",
        ),
    ).create()

    # 3. Instantiate the runtime AliyunDataSource object
    await ds_doc.fetch_link(DataSourceDoc.connect)

    init_data = {
        "id": str(ds_doc.id),
        "name": ds_doc.name,
        "type": ds_doc.type,
        "connect": ds_doc.connect,
        "interval_seconds": 60,  # This is part of the runtime model, not the db doc
        "region": ds_doc.aliyun_config.region,
        "namespace": ds_doc.aliyun_config.namespace,
        "metric_name": ds_doc.aliyun_config.metric_name,
    }

    with patch("veaiops.metrics.aliyun.AliyunClient") as mock_client_class:
        mock_client_instance = mock_client_class.return_value
        mock_client_instance.get_metric_data = MagicMock()

        data_source = AliyunDataSource(**init_data)

        data_source._client = mock_client_instance
        yield data_source

        # Clean up the documents
        await ds_doc.delete()
        await connect_doc.delete()


# Tests for AliyunDataSource
# Note: Removed test_aliyun_data_source_init as it only tests trivial initialization


@pytest.mark.asyncio
async def test_aliyun_data_source_fetch_one_slot_success(aliyun_data_source):
    start = datetime(2023, 1, 1)
    end = start + timedelta(minutes=10)

    # Mock response data from Aliyun API
    mock_response = MagicMock()
    mock_response.body.datapoints = (
        '[{"timestamp": 1672531260000, "Average": "10.0", "Instance": "i-123"}, '
        '{"timestamp": 1672531320000, "Average": "11.0", "Instance": "i-123"}]'
    )
    mock_response.body.next_token = None

    # Configure the mock client
    aliyun_data_source.client.get_metric_data = MagicMock(return_value=mock_response)

    time_series = await aliyun_data_source._fetch_one_slot(start, end)

    assert len(time_series) == 1
    ts1 = time_series[0]

    # Since InputTimeSeries is a TypedDict, we should access it as a dictionary
    assert ts1["name"] == "cpu.usage_active"
    assert ts1["labels"] == {"Instance": "i-123"}
    assert ts1["timestamps"] == [1672531260, 1672531320]
    assert ts1["values"] == [10.0, 11.0]
    assert "unique_key" in ts1
    # Check the unique_key format: metric_name|key1=value1,...
    assert ts1["unique_key"] == "cpu.usage_active|Instance=i-123"


@pytest.mark.asyncio
async def test_aliyun_data_source_fetch_one_slot_multiple_instances(aliyun_data_source):
    start = datetime(2023, 1, 1)
    end = start + timedelta(minutes=10)

    # Mock response data from Aliyun API with multiple instances
    mock_response = MagicMock()
    mock_response.body.datapoints = (
        '[{"timestamp": 1672531260000, "Average": "10.0", "Instance": "i-123"}, '
        '{"timestamp": 1672531260000, "Average": "15.0", "Instance": "i-456"}]'
    )
    mock_response.body.next_token = None

    # Configure the mock client
    aliyun_data_source.client.get_metric_data = MagicMock(return_value=mock_response)

    time_series = await aliyun_data_source._fetch_one_slot(start, end)

    assert len(time_series) == 2
    ts1 = time_series[0]
    ts2 = time_series[1]

    # Since InputTimeSeries is a TypedDict, we should access it as a dictionary
    assert ts1["name"] == "cpu.usage_active"
    assert ts1["labels"] == {"Instance": "i-123"}
    assert ts1["timestamps"] == [1672531260]
    assert ts1["values"] == [10.0]
    assert "unique_key" in ts1
    assert ts1["unique_key"] == "cpu.usage_active|Instance=i-123"

    # Check second time series
    assert ts2["name"] == "cpu.usage_active"
    assert ts2["labels"] == {"Instance": "i-456"}
    assert ts2["timestamps"] == [1672531260]
    assert ts2["values"] == [15.0]
    assert "unique_key" in ts2
    assert ts2["unique_key"] == "cpu.usage_active|Instance=i-456"


@pytest.mark.asyncio
async def test_aliyun_data_source_fetch_one_slot_no_data(aliyun_data_source):
    start = datetime(2023, 1, 1)
    end = start + timedelta(minutes=10)

    # Mock empty response
    mock_response = MagicMock()
    mock_response.body.datapoints = "[]"
    mock_response.body.next_token = None

    aliyun_data_source.client.get_metric_data = MagicMock(return_value=mock_response)
    time_series = await aliyun_data_source._fetch_one_slot(start, end)
    assert len(time_series) == 0


@pytest.mark.asyncio
async def test_aliyun_data_source_fetch_one_slot_api_error(aliyun_data_source):
    start = datetime(2023, 1, 1)
    end = start + timedelta(minutes=10)

    aliyun_data_source.client.get_metric_data = MagicMock(side_effect=Exception("API Error"))
    with pytest.raises(Exception, match="API Error"):
        await aliyun_data_source._fetch_one_slot(start, end)


@pytest.mark.asyncio
async def test_aliyun_data_source_fetch_one_slot_invalid_data(aliyun_data_source):
    start = datetime(2023, 1, 1)
    end = start + timedelta(minutes=10)

    # Mock response with invalid timestamp
    mock_response = MagicMock()
    mock_response.body.datapoints = '[{"timestamp": "invalid", "Average": "10.0", "Instance": "i-123"}]'
    mock_response.body.next_token = None

    aliyun_data_source.client.get_metric_data = MagicMock(return_value=mock_response)
    with pytest.raises(Exception):
        await aliyun_data_source._fetch_one_slot(start, end)


@pytest.mark.asyncio
async def test_aliyun_data_source_fetch_one_slot_missing_fields(aliyun_data_source):
    start = datetime(2023, 1, 1)
    end = start + timedelta(minutes=10)

    # Mock response with missing value field
    mock_response = MagicMock()
    mock_response.body.datapoints = '[{"timestamp": 1672531260000, "Instance": "i-123"}]'
    mock_response.body.next_token = None

    aliyun_data_source.client.get_metric_data = MagicMock(return_value=mock_response)
    with pytest.raises(Exception, match=r"Timestamp or value is None at index .*"):
        await aliyun_data_source._fetch_one_slot(start, end)


# Tests for AliyunClient
@pytest.fixture
def aliyun_client():
    client = AliyunClient(
        ak="test_ak",
        sk="test_sk",
        region="cn-beijing",
    )
    return client


# Note: Removed test_aliyun_client_init as it only tests trivial initialization


@pytest.mark.asyncio
async def test_aliyun_client_get_metric_data(aliyun_client):
    # Mock the client
    with patch.object(aliyun_client, "_client") as mock_aliyun_client:
        # Mock response
        mock_response = MagicMock()
        mock_aliyun_client.describe_metric_list_with_options.return_value = mock_response

        result = aliyun_client.get_metric_data(
            namespace="test_namespace",
            metric_name="cpu.usage_active",
            dimensions=None,
            start_time="2023-01-01 00:00:00",
            end_time="2023-01-01 01:00:00",
            period="60",
        )

        assert result == mock_response
        mock_aliyun_client.describe_metric_list_with_options.assert_called_once()


@pytest.mark.asyncio
async def test_aliyun_client_get_existing_rules(aliyun_client):
    # Mock the client
    with patch.object(aliyun_client, "_client") as mock_aliyun_client:
        # Mock response
        mock_response = MagicMock()
        mock_aliyun_client.describe_metric_rule_list_with_options.return_value = mock_response

        # Create a mock request
        mock_request = MagicMock()

        result = aliyun_client.get_existing_rules(mock_request)

        assert result == mock_response
        mock_aliyun_client.describe_metric_rule_list_with_options.assert_called_once_with(
            mock_request, mock_aliyun_client.describe_metric_rule_list_with_options.call_args[0][1]
        )


@pytest.mark.asyncio
async def test_aliyun_client_create_rule(aliyun_client):
    # Mock the client
    with patch.object(aliyun_client, "_client") as mock_aliyun_client:
        # Mock response
        mock_response = MagicMock()
        mock_aliyun_client.put_resource_metric_rule_with_options.return_value = mock_response

        # Create a mock request
        mock_request = MagicMock()

        result = aliyun_client.create_rule(mock_request)

        assert result == mock_response
        mock_aliyun_client.put_resource_metric_rule_with_options.assert_called_once_with(
            mock_request, mock_aliyun_client.put_resource_metric_rule_with_options.call_args[0][1]
        )


@pytest.mark.asyncio
async def test_aliyun_client_delete_rules(aliyun_client):
    # Mock the client
    with patch.object(aliyun_client, "_client") as mock_aliyun_client:
        # Mock response
        mock_response = MagicMock()
        mock_aliyun_client.delete_metric_rules_with_options.return_value = mock_response

        # Create a mock request
        mock_request = MagicMock()

        result = aliyun_client.delete_rules(mock_request)

        assert result == mock_response
        mock_aliyun_client.delete_metric_rules_with_options.assert_called_once_with(
            mock_request, mock_aliyun_client.delete_metric_rules_with_options.call_args[0][1]
        )


@pytest.mark.asyncio
async def test_aliyun_client_describe_project_meta(aliyun_client):
    """Test describe_project_meta method."""
    with patch.object(aliyun_client, "_client") as mock_aliyun_client:
        mock_response = MagicMock()
        mock_aliyun_client.describe_project_meta_with_options.return_value = mock_response

        mock_request = MagicMock()
        result = aliyun_client.describe_project_meta(mock_request)

        assert result == mock_response
        mock_aliyun_client.describe_project_meta_with_options.assert_called_once()


@pytest.mark.asyncio
async def test_aliyun_client_describe_metric_meta_list(aliyun_client):
    """Test describe_metric_meta_list method."""
    with patch.object(aliyun_client, "_client") as mock_aliyun_client:
        mock_response = MagicMock()
        mock_aliyun_client.describe_metric_meta_list_with_options.return_value = mock_response

        mock_request = MagicMock()
        mock_request.page_number = 1
        mock_request.page_size = 10
        result = aliyun_client.describe_metric_meta_list(mock_request)

        assert result == mock_response
        mock_aliyun_client.describe_metric_meta_list_with_options.assert_called_once()


@pytest.mark.asyncio
async def test_aliyun_client_describe_contact_group_list(aliyun_client):
    """Test describe_contact_group_list method."""
    with patch.object(aliyun_client, "_client") as mock_aliyun_client:
        mock_response = MagicMock()
        mock_aliyun_client.describe_contact_group_list_with_options.return_value = mock_response

        mock_request = MagicMock()
        mock_request.page_number = 1
        mock_request.page_size = 10
        result = aliyun_client.describe_contact_group_list(mock_request)

        assert result == mock_response
        mock_aliyun_client.describe_contact_group_list_with_options.assert_called_once()


@pytest.mark.asyncio
async def test_aliyun_client_test_connection(aliyun_client):
    """Test test_connection method."""
    with patch.object(aliyun_client, "_client") as mock_aliyun_client:
        mock_response = MagicMock()
        mock_aliyun_client.describe_project_meta_with_options.return_value = mock_response

        result = aliyun_client.test_connection()

        assert result is None
        mock_aliyun_client.describe_project_meta_with_options.assert_called_once()


@pytest.mark.asyncio
async def test_aliyun_datasource_concurrency_group(aliyun_data_source):
    """Test concurrency_group property."""
    result = aliyun_data_source.concurrency_group

    assert "aliyun_" in result
    assert "test_ak" in result


@pytest.mark.asyncio
async def test_aliyun_datasource_get_group_key(aliyun_data_source):
    """Test _get_group_key method."""
    # Test with multiple fields
    point = {"timestamp": 1672531260000, "Average": "10.0", "Instance": "i-123", "Region": "cn-beijing"}
    result = aliyun_data_source._get_group_key(point)

    assert "Instance:i-123" in result
    assert "Region:cn-beijing" in result
    assert "timestamp" not in result
    assert "Average" not in result


@pytest.mark.asyncio
async def test_aliyun_datasource_extract_labels(aliyun_data_source):
    """Test _extract_labels method."""
    point = {"timestamp": 1672531260000, "Average": "10.0", "Instance": "i-123", "Region": "cn-beijing"}
    result = aliyun_data_source._extract_labels(point)

    assert result == {"Instance": "i-123", "Region": "cn-beijing"}
    assert "timestamp" not in result
    assert "Average" not in result


@pytest.mark.asyncio
async def test_aliyun_datasource_build_labels():
    """Test _build_labels static method."""
    from veaiops.metrics.aliyun import AliyunDataSource

    # Create mock task with projects
    mock_task = MagicMock()
    mock_task.projects = ["project1", "project2", "project3"]

    result = AliyunDataSource._build_labels(mock_task)

    assert len(result) == 3
    assert result[0].key == "projects_01"
    assert result[0].value == "project1"
    assert result[1].key == "projects_02"
    assert result[1].value == "project2"


@pytest.mark.asyncio
async def test_aliyun_datasource_create_escalations(aliyun_data_source):
    """Test _create_escalations method."""
    params = {
        "statistics": "Average",
        "comparison_operator": "GreaterThanThreshold",
        "threshold": "80.0",
        "times": 3,
    }

    # Test critical level
    result = aliyun_data_source._create_escalations("critical", params)
    assert result.critical is not None
    assert result.warn is None
    assert result.info is None

    # Test warn level
    result = aliyun_data_source._create_escalations("warn", params)
    assert result.critical is None
    assert result.warn is not None
    assert result.info is None

    # Test info level
    result = aliyun_data_source._create_escalations("info", params)
    assert result.critical is None
    assert result.warn is None
    assert result.info is not None


@pytest.mark.asyncio
async def test_aliyun_datasource_compare_rules():
    """Test _compare_rules static method."""
    from veaiops.metrics.aliyun import AliyunDataSource

    existing_rules = {
        "rule1": MagicMock(),
        "rule2": MagicMock(),
        "rule3": MagicMock(),
    }

    desired_rules = {
        "rule2": MagicMock(),  # Update
        "rule3": MagicMock(),  # Update
        "rule4": MagicMock(),  # Create
    }

    create_rules, update_rules, delete_rule_ids = AliyunDataSource._compare_rules(existing_rules, desired_rules)

    assert len(create_rules) == 1
    assert len(update_rules) == 2
    assert delete_rule_ids == ["rule1"]


@pytest.mark.asyncio
async def test_aliyun_datasource_put_rule(aliyun_data_source):
    """Test _put_rule method."""
    mock_rule = MagicMock()
    mock_rule.rule_id = "test_rule_123"

    mock_response = MagicMock()
    mock_response.to_dict = MagicMock(return_value={"success": True})

    aliyun_data_source.client.create_rule = MagicMock(return_value=mock_response)

    result = aliyun_data_source._put_rule(mock_rule)

    assert result["rule_id"] == "test_rule_123"
    assert result["status"] == "success"
    assert "response" in result


@pytest.mark.asyncio
async def test_aliyun_datasource_put_rule_error(aliyun_data_source):
    """Test _put_rule method with error."""
    mock_rule = MagicMock()
    mock_rule.rule_id = "test_rule_123"

    aliyun_data_source.client.create_rule = MagicMock(side_effect=Exception("API Error"))

    with pytest.raises(Exception, match="API Error"):
        aliyun_data_source._put_rule(mock_rule)


@pytest.mark.asyncio
async def test_aliyun_datasource_delete_rules(aliyun_data_source):
    """Test _delete_rules method."""
    rule_ids = ["rule1", "rule2", "rule3"]

    mock_response = MagicMock()
    mock_response.to_dict = MagicMock(return_value={"success": True})

    aliyun_data_source.client.delete_rules = MagicMock(return_value=mock_response)

    result = aliyun_data_source._delete_rules(rule_ids)

    assert result["rule_ids"] == rule_ids
    assert result["status"] == "success"
    assert "response" in result


@pytest.mark.asyncio
async def test_aliyun_datasource_delete_rules_error(aliyun_data_source):
    """Test _delete_rules method with error."""
    rule_ids = ["rule1", "rule2"]

    aliyun_data_source.client.delete_rules = MagicMock(side_effect=Exception("Delete failed"))

    with pytest.raises(Exception, match="Delete failed"):
        aliyun_data_source._delete_rules(rule_ids)


@pytest.mark.asyncio
async def test_aliyun_datasource_list_rules(aliyun_data_source):
    """Test _list_rules method."""
    mock_response = MagicMock()
    mock_alarm1 = MagicMock()
    mock_alarm1.rule_id = "rule1"
    mock_alarm2 = MagicMock()
    mock_alarm2.rule_id = "rule2"

    mock_response.body.alarms.alarm = [mock_alarm1, mock_alarm2]

    aliyun_data_source.client.get_existing_rules = MagicMock(return_value=mock_response)

    result = aliyun_data_source._list_rules()

    assert len(result) == 2
    assert "rule1" in result
    assert "rule2" in result


@pytest.mark.asyncio
async def test_aliyun_datasource_list_rules_error(aliyun_data_source):
    """Test _list_rules method with error."""
    aliyun_data_source.client.get_existing_rules = MagicMock(side_effect=Exception("List failed"))

    with pytest.raises(Exception, match="List failed"):
        aliyun_data_source._list_rules()


@pytest.mark.asyncio
async def test_aliyun_datasource_fetch_with_pagination(aliyun_data_source):
    """Test fetch with pagination (next_token)."""
    start = datetime(2023, 1, 1)
    end = start + timedelta(minutes=10)

    # First response with next_token
    mock_response1 = MagicMock()
    mock_response1.body.datapoints = '[{"timestamp": 1672531260000, "Average": "10.0", "Instance": "i-123"}]'
    mock_response1.body.next_token = "token123"

    # Second response without next_token
    mock_response2 = MagicMock()
    mock_response2.body.datapoints = '[{"timestamp": 1672531320000, "Average": "11.0", "Instance": "i-123"}]'
    mock_response2.body.next_token = None

    aliyun_data_source.client.get_metric_data = MagicMock(side_effect=[mock_response1, mock_response2])

    time_series = await aliyun_data_source._fetch_one_slot(start, end)

    assert len(time_series) == 1
    assert len(time_series[0]["timestamps"]) == 2
    assert time_series[0]["timestamps"] == [1672531260, 1672531320]


@pytest.mark.asyncio
async def test_aliyun_datasource_fetch_with_group_by(test_aliyun_connect):
    """Test DataSource with group_by parameter."""
    from veaiops.metrics.aliyun import AliyunDataSource

    ds = AliyunDataSource(
        id="test_id",
        type="Aliyun",
        name="Test DataSource",
        interval_seconds=60,
        connect=test_aliyun_connect,
        region="cn-beijing",
        namespace="acs_ecs_dashboard",
        metric_name="cpu_idle",
        group_by=["InstanceId", "Region"],
    )

    start = datetime(2023, 1, 1)
    end = start + timedelta(minutes=10)

    mock_response = MagicMock()
    mock_response.body.datapoints = (
        '[{"timestamp": 1672531260000, "Average": "10.0", "InstanceId": "i-123", "Region": "cn-beijing"}]'
    )
    mock_response.body.next_token = None

    with patch("veaiops.metrics.aliyun.AliyunClient") as mock_client_class:
        mock_client_instance = mock_client_class.return_value
        mock_client_instance.get_metric_data = MagicMock(return_value=mock_response)

        ds._client = mock_client_instance

        time_series = await ds._fetch_one_slot(start, end)

        assert len(time_series) == 1
        assert time_series[0]["labels"]["InstanceId"] == "i-123"
        assert time_series[0]["labels"]["Region"] == "cn-beijing"
