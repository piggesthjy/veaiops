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

"""Tests for DataSource base class."""

from datetime import datetime

import pytest

from veaiops.metrics.base import generate_unique_key
from veaiops.metrics.timeseries import InputTimeSeries


@pytest.mark.asyncio
async def test_datasource_with_real_connect_document(test_aliyun_connect):
    """Test DataSource works with real Connect document from database."""
    # Arrange - use real connect from database
    from tests.metrics.conftest import TestDataSource

    # Act - create DataSource with actual database connect
    ds = TestDataSource(
        id="test_id", type="Aliyun", name="Test DataSource", interval_seconds=300, connect=test_aliyun_connect
    )

    # Assert - all properties are set correctly
    assert ds.id == "test_id"
    assert ds.type == "Aliyun"
    assert ds.name == "Test DataSource"
    assert ds.interval_seconds == 300
    assert ds.connect == test_aliyun_connect
    assert ds.concurrency_group() == "test_group"
    assert ds.get_concurrency_quota == 10


@pytest.mark.asyncio
async def test_datasource_fetch_returns_timeseries(test_aliyun_connect):
    """Test that DataSource fetch method returns InputTimeSeries list."""
    # Arrange
    from tests.metrics.conftest import TestDataSource

    ds = TestDataSource(
        id="test_id", type="Aliyun", name="Test DataSource", interval_seconds=60, connect=test_aliyun_connect
    )

    # Override _fetch_one_slot to return test data
    async def mock_fetch_one_slot(start, end=None):
        return [
            InputTimeSeries(
                name="test_metric",
                timestamps=[int(start.timestamp())],
                values=[100.0],
                labels={"host": "server1"},
                unique_key="test_metric|host=server1",
            )
        ]

    ds._fetch_one_slot = mock_fetch_one_slot

    # Act
    start = datetime(2025, 1, 1, 12, 0, 0)
    end = datetime(2025, 1, 1, 13, 0, 0)
    result = await ds.fetch(start, end)

    # Assert
    assert isinstance(result, list)
    assert len(result) == 1
    assert result[0]["name"] == "test_metric"
    assert result[0]["labels"] == {"host": "server1"}


def test_generate_unique_key():
    """Test generate_unique_key with various label combinations."""
    # Test with labels - should be sorted
    result = generate_unique_key("cpu_usage", {"host": "server1", "instance": "web"})
    assert result == "cpu_usage|host=server1,instance=web"

    # Test with empty labels
    result = generate_unique_key("memory_usage", {})
    assert result == "memory_usage|"

    # Test deterministic sorting - label order doesn't affect key
    labels1 = {"a": "1", "b": "2", "c": "3"}
    labels2 = {"c": "3", "a": "1", "b": "2"}
    result1 = generate_unique_key("test_metric", labels1)
    result2 = generate_unique_key("test_metric", labels2)
    assert result1 == result2 == "test_metric|a=1,b=2,c=3"

    # Test special characters are preserved
    result = generate_unique_key("metric@name", {"key-1": "value_1", "key.2": "value@2"})
    assert result == "metric@name|key-1=value_1,key.2=value@2"


@pytest.mark.asyncio
async def test_datasource_connects_to_database(test_aliyun_datasource):
    """Test that DataSource can be created from database document."""
    # Arrange - datasource document exists in database
    from veaiops.schema.documents.datasource.base import DataSource as DataSourceDoc

    # Act - query datasource from database
    ds_from_db = await DataSourceDoc.find_one(DataSourceDoc.name == test_aliyun_datasource.name)

    # Assert - datasource is found with correct attributes
    assert ds_from_db is not None
    assert ds_from_db.name == test_aliyun_datasource.name
    assert ds_from_db.type == test_aliyun_datasource.type


@pytest.mark.asyncio
async def test_multiple_datasources_isolation(test_aliyun_datasource, test_volcengine_datasource):
    """Test that multiple datasources are isolated in database."""
    # Arrange - two datasources exist
    from veaiops.schema.documents.datasource.base import DataSource as DataSourceDoc

    # Act - query both datasources
    all_datasources = await DataSourceDoc.find_all().to_list()

    # Assert - both exist and are different
    assert len(all_datasources) >= 2
    ds_names = [ds.name for ds in all_datasources]
    assert test_aliyun_datasource.name in ds_names
    assert test_volcengine_datasource.name in ds_names
    assert test_aliyun_datasource.id != test_volcengine_datasource.id


@pytest.mark.asyncio
async def test_datasource_fetch_with_no_end_time(test_aliyun_connect):
    """Test DataSource fetch method when end time is None."""
    from tests.metrics.conftest import TestDataSource

    ds = TestDataSource(
        id="test_id", type="Aliyun", name="Test DataSource", interval_seconds=60, connect=test_aliyun_connect
    )

    async def mock_fetch_one_slot(start, end=None):
        return [
            InputTimeSeries(
                name="test_metric",
                timestamps=[int(start.timestamp())],
                values=[50.0],
                labels={},
                unique_key="test_metric|",
            )
        ]

    ds._fetch_one_slot = mock_fetch_one_slot

    # Act - fetch with no end time
    start = datetime(2025, 1, 1, 12, 0, 0)
    result = await ds.fetch(start, end=None)

    # Assert
    assert isinstance(result, list)
    assert len(result) == 1
    assert result[0]["values"] == [50.0]


@pytest.mark.asyncio
async def test_datasource_fetch_with_end_before_start(test_aliyun_connect):
    """Test DataSource fetch method when end time is before start time."""
    from tests.metrics.conftest import TestDataSource

    ds = TestDataSource(
        id="test_id", type="Aliyun", name="Test DataSource", interval_seconds=60, connect=test_aliyun_connect
    )

    async def mock_fetch_one_slot(start, end=None):
        return [
            InputTimeSeries(
                name="test_metric",
                timestamps=[int(start.timestamp())],
                values=[75.0],
                labels={"env": "prod"},
                unique_key="test_metric|env=prod",
            )
        ]

    ds._fetch_one_slot = mock_fetch_one_slot

    # Act - fetch with end before start (should be corrected to start)
    start = datetime(2025, 1, 1, 12, 0, 0)
    end = datetime(2025, 1, 1, 11, 0, 0)
    result = await ds.fetch(start, end)

    # Assert - should still return results
    assert isinstance(result, list)
    assert len(result) == 1


@pytest.mark.asyncio
async def test_datasource_model_dump(test_aliyun_connect):
    """Test DataSource model_dump method."""
    from tests.metrics.conftest import TestDataSource

    # Arrange
    ds = TestDataSource(
        id="test_dump_id", type="Aliyun", name="Test Dump", interval_seconds=120, connect=test_aliyun_connect
    )

    # Act
    dumped = ds.model_dump()

    # Assert
    assert isinstance(dumped, dict)
    assert dumped["id"] == "test_dump_id"
    assert dumped["type"] == "Aliyun"
    assert dumped["name"] == "Test Dump"
    assert dumped["interval_seconds"] == 120


@pytest.mark.asyncio
async def test_datasource_model_dump_json(test_aliyun_connect):
    """Test DataSource model_dump_json method."""
    from tests.metrics.conftest import TestDataSource

    # Arrange
    ds = TestDataSource(
        id="test_json_id", type="Volcengine", name="Test JSON", interval_seconds=180, connect=test_aliyun_connect
    )

    # Act
    dumped_json = ds.model_dump_json()

    # Assert
    assert isinstance(dumped_json, str)
    assert '"id":"test_json_id"' in dumped_json or '"id": "test_json_id"' in dumped_json
    assert "Test JSON" in dumped_json


@pytest.mark.asyncio
async def test_rate_limiter_acquire_token():
    """Test RateLimiter token acquisition."""
    from veaiops.metrics.base import RateLimiter

    # Arrange
    group = "test_group"
    qps = 10

    # Act - acquire a token
    await RateLimiter.acquire_token(group, qps)

    # Assert - should complete without error
    assert True  # If we reach here, token was acquired successfully


@pytest.mark.asyncio
async def test_rate_limiter_multiple_acquisitions():
    """Test RateLimiter handles multiple token acquisitions."""
    from veaiops.metrics.base import RateLimiter

    # Arrange
    group = "multi_test_group"
    qps = 5

    # Act - acquire multiple tokens
    for _ in range(3):
        await RateLimiter.acquire_token(group, qps)

    # Assert - all acquisitions should complete
    assert True


@pytest.mark.asyncio
async def test_rate_limit_decorator_with_callable_group(test_aliyun_connect):
    """Test rate_limit decorator with callable concurrency_group."""
    from veaiops.metrics.base import rate_limit

    class TestDataSourceCallable:
        def __init__(self):
            self._group = "callable_group"

        def concurrency_group(self):
            return self._group

        def get_concurrency_quota(self):
            return 10

        @rate_limit
        async def fetch_data(self):
            return "data_fetched"

    # Arrange
    ds = TestDataSourceCallable()

    # Act
    result = await ds.fetch_data()

    # Assert
    assert result == "data_fetched"


@pytest.mark.asyncio
async def test_rate_limit_decorator_with_async_quota(test_aliyun_connect):
    """Test rate_limit decorator with async get_concurrency_quota."""
    from veaiops.metrics.base import rate_limit

    class TestDataSourceAsync:
        def concurrency_group(self):
            return "async_group"

        async def get_concurrency_quota(self):
            return 15

        @rate_limit
        async def fetch_data(self):
            return "async_data"

    # Arrange
    ds = TestDataSourceAsync()

    # Act
    result = await ds.fetch_data()

    # Assert
    assert result == "async_data"


@pytest.mark.asyncio
async def test_base_rule_synchronizer_execute_operations_success(test_aliyun_connect):
    """Test BaseRuleSynchronizer execute_operations with successful operations."""
    from tests.metrics.conftest import TestDataSource
    from veaiops.metrics.base import BaseRuleSynchronizer

    class TestRuleSynchronizer(BaseRuleSynchronizer):
        async def sync_rules(self, config):
            return {}

    # Arrange
    ds = TestDataSource(id="test", type="Aliyun", name="Test", interval_seconds=60, connect=test_aliyun_connect)
    synchronizer = TestRuleSynchronizer(ds)

    operations = [
        {"type": "create", "rule_name": "rule1"},
        {"type": "update", "rule_name": "rule2"},
        {"type": "delete", "rule_name": "rule3"},
    ]

    async def mock_create(operation):
        return {"status": "success", "operation": "create", "rule_id": "r1", "rule_name": operation["rule_name"]}

    async def mock_update(operation):
        return {"status": "success", "operation": "update", "rule_id": "r2", "rule_name": operation["rule_name"]}

    async def mock_delete(operation):
        return {
            "status": "success",
            "operation": "delete",
            "rule_ids": ["r3"],
            "rule_name": operation["rule_name"],
        }

    operation_func_map = {"create": mock_create, "update": mock_update, "delete": mock_delete}

    # Act
    result = await synchronizer.execute_operations(operations, operation_func_map)

    # Assert
    assert result["created"] == 1
    assert result["updated"] == 1
    assert result["deleted"] == 1
    assert result["failed"] == 0
    assert result["total"] == 3


@pytest.mark.asyncio
async def test_base_rule_synchronizer_execute_operations_with_failures(test_aliyun_connect):
    """Test BaseRuleSynchronizer execute_operations handles failures."""
    from tests.metrics.conftest import TestDataSource
    from veaiops.metrics.base import BaseRuleSynchronizer

    class TestRuleSynchronizer(BaseRuleSynchronizer):
        async def sync_rules(self, config):
            return {}

    # Arrange
    ds = TestDataSource(id="test", type="Aliyun", name="Test", interval_seconds=60, connect=test_aliyun_connect)
    synchronizer = TestRuleSynchronizer(ds)

    operations = [
        {"type": "create", "rule_name": "fail_rule"},
    ]

    async def mock_create_fail(operation):
        raise Exception("API Error")

    operation_func_map = {"create": mock_create_fail}

    # Act
    result = await synchronizer.execute_operations(operations, operation_func_map)

    # Assert
    assert result["created"] == 0
    assert result["failed"] == 1
    assert result["total"] == 1


@pytest.mark.asyncio
async def test_base_rule_synchronizer_execute_operations_with_failed_status(test_aliyun_connect):
    """Test BaseRuleSynchronizer execute_operations handles failed status."""
    from tests.metrics.conftest import TestDataSource
    from veaiops.metrics.base import BaseRuleSynchronizer

    class TestRuleSynchronizer(BaseRuleSynchronizer):
        async def sync_rules(self, config):
            return {}

    # Arrange
    ds = TestDataSource(id="test", type="Aliyun", name="Test", interval_seconds=60, connect=test_aliyun_connect)
    synchronizer = TestRuleSynchronizer(ds)

    operations = [
        {"type": "create", "rule_name": "status_fail_rule"},
    ]

    async def mock_create_status_fail(operation):
        return {"status": "failed", "error": "Validation failed"}

    operation_func_map = {"create": mock_create_status_fail}

    # Act
    result = await synchronizer.execute_operations(operations, operation_func_map)

    # Assert
    assert result["created"] == 0
    assert result["failed"] == 1
    """Test cases for generate_unique_key function."""

    def test_generate_unique_key_simple(self):
        """Test generate_unique_key with simple labels."""
        name = "cpu_usage"
        labels = {"host": "server1", "instance": "web"}

        result = generate_unique_key(name, labels)

        assert result == "cpu_usage|host=server1,instance=web"

    def test_generate_unique_key_empty_labels(self):
        """Test generate_unique_key with empty labels."""
        name = "memory_usage"
        labels = {}

        result = generate_unique_key(name, labels)

        assert result == "memory_usage|"

    def test_generate_unique_key_single_label(self):
        """Test generate_unique_key with single label."""
        name = "disk_usage"
        labels = {"device": "/dev/sda1"}

        result = generate_unique_key(name, labels)

        assert result == "disk_usage|device=/dev/sda1"

    def test_generate_unique_key_labels_sorted(self):
        """Test that labels are sorted for consistent keys."""
        name = "network_bytes"
        labels = {"interface": "eth0", "direction": "in", "host": "server1"}

        result = generate_unique_key(name, labels)

        # Labels should be sorted alphabetically by key
        assert result == "network_bytes|direction=in,host=server1,interface=eth0"

    def test_generate_unique_key_same_content_different_order(self):
        """Test that different label orders produce the same key."""
        name = "test_metric"
        labels1 = {"a": "1", "b": "2", "c": "3"}
        labels2 = {"c": "3", "a": "1", "b": "2"}

        result1 = generate_unique_key(name, labels1)
        result2 = generate_unique_key(name, labels2)

        assert result1 == result2
        assert result1 == "test_metric|a=1,b=2,c=3"

    def test_generate_unique_key_special_characters(self):
        """Test generate_unique_key with special characters."""
        name = "metric@name"
        labels = {"key-1": "value_1", "key.2": "value@2"}

        result = generate_unique_key(name, labels)

        assert result == "metric@name|key-1=value_1,key.2=value@2"

    def test_generate_unique_key_empty_name(self):
        """Test generate_unique_key with empty name."""
        name = ""
        labels = {"host": "server1"}

        result = generate_unique_key(name, labels)

        assert result == "|host=server1"

    def test_generate_unique_key_numeric_values(self):
        """Test generate_unique_key with numeric label values."""
        name = "test_metric"
        labels = {"port": "8080", "cpu": "0", "memory": "1024"}

        result = generate_unique_key(name, labels)

        assert result == "test_metric|cpu=0,memory=1024,port=8080"

    def test_generate_unique_key_unicode_characters(self):
        """Test generate_unique_key with unicode characters."""
        name = "测试指标"
        labels = {"服务器": "主机1", "应用": "网站"}

        result = generate_unique_key(name, labels)

        assert result == "测试指标|应用=网站,服务器=主机1"

    def test_generate_unique_key_long_values(self):
        """Test generate_unique_key with long values."""
        name = "very_long_metric_name_with_many_characters"
        labels = {
            "very_long_label_key_with_many_characters": "very_long_label_value_with_many_characters",
            "short": "val",
        }

        result = generate_unique_key(name, labels)

        expected = "very_long_metric_name_with_many_characters|short=val,very_long_label_key_with_many_characters=very_long_label_value_with_many_characters"  # noqa
        assert result == expected
