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

from veaiops.metrics.zabbix import (
    ZabbixClient,
    ZabbixDataSource,
    ZabbixTarget,
    ZabbixTriggerConfig,
)
from veaiops.schema.documents.datasource.base import Connect
from veaiops.utils.crypto import EncryptedSecretStr


# Fixtures for Zabbix Pydantic Models
@pytest.fixture
def zabbix_trigger_tag_data():
    return {"tag": "env", "value": "prod"}


@pytest.fixture
def zabbix_trigger_config_data():
    return {
        "hostname": "zabbix-server",
        "metric_name": "system.cpu.load[percpu,avg1]",
        "start": 1672531200,
        "end": 1672534800,
        "threshold": 0.8,
        "threshold_operator": ">",
        "aggregation_function": "avg",
        "aggregation_period": "5m",
    }


@pytest.fixture
def zabbix_target_data():
    return {"itemid": "23456", "hostname": "zabbix-server"}


# Fixture for ZabbixDataSource
@pytest.fixture
def mock_zabbix_api():
    with patch("veaiops.metrics.zabbix.ZabbixAPI") as mock_api:
        mock_instance = mock_api.return_value
        mock_instance.login = MagicMock()
        mock_instance.history = MagicMock()
        mock_instance.trigger = MagicMock()
        mock_instance.template = MagicMock()
        mock_instance.mediatype = MagicMock()
        mock_instance.usergroup = MagicMock()
        mock_instance.item = MagicMock()
        mock_instance.host = MagicMock()
        mock_instance.action = MagicMock()
        mock_instance.user = MagicMock()
        yield mock_instance


@pytest.fixture
def zabbix_data_source():
    """Pytest fixture to create a ZabbixDataSource instance with a mocked connect object."""
    # Create a mock Connect object
    mock_connect = Connect(  # type: ignore
        name="test_connect",
        type="Zabbix",
        zabbix_api_url="https://zabbix.example.com",
        zabbix_api_user="test_user",
        zabbix_api_password=EncryptedSecretStr("test_password"),
    )
    with patch("veaiops.metrics.zabbix.ZabbixClient") as mock_client_class:
        mock_client_instance = mock_client_class.return_value
        mock_client_instance.get_metric_data = AsyncMock()
        data_source = ZabbixDataSource(
            id="zabbix_ds_1",
            name="Test Zabbix Source",
            type="Zabbix",
            interval_seconds=60,
            connect=mock_connect,
            targets=[ZabbixTarget(itemid="12345", hostname="zabbix.example.com")],
            metric_name="system.cpu.load",
            history_type=0,
        )
        data_source._client = mock_client_instance
        data_source._build_item_labels_map = MagicMock(return_value={12345: {"label1": "value1"}})
        yield data_source


# Tests for ZabbixDataSource
# Note: Removed test_zabbix_data_source_init as it only tests trivial initialization


def test_fetch_one_slot(zabbix_data_source):
    """Test _fetch_one_slot with various data scenarios."""
    start = datetime(2023, 1, 1)
    end = start + timedelta(minutes=10)

    # Test success case
    history_data = [
        {"itemid": "12345", "clock": int(start.timestamp()) + 60, "value": "10.0"},
        {"itemid": "12345", "clock": int(start.timestamp()) + 120, "value": "11.0"},
    ]
    zabbix_data_source.client.get_metric_data.side_effect = [history_data, []]
    time_series = asyncio.run(zabbix_data_source._fetch_one_slot(start, end))
    assert len(time_series) == 1
    assert time_series[0]["name"] == "system.cpu.load"
    assert time_series[0]["values"] == [10.0, 11.0]

    # Test no data
    zabbix_data_source.client.get_metric_data.return_value = []
    time_series = asyncio.run(zabbix_data_source._fetch_one_slot(start, end))
    assert len(time_series) == 0

    # Test API error
    zabbix_data_source.client.get_metric_data.side_effect = Exception("API Error")
    with pytest.raises(Exception, match="API Error"):
        asyncio.run(zabbix_data_source._fetch_one_slot(start, end))

    # Test invalid data
    zabbix_data_source.client.get_metric_data.side_effect = [
        [{"itemid": "12345", "clock": "invalid", "value": "10.0"}],
        [],
    ]
    with pytest.raises(ValueError):
        asyncio.run(zabbix_data_source._fetch_one_slot(start, end))

    # Test missing fields
    zabbix_data_source.client.get_metric_data.side_effect = [[{"itemid": "12345", "value": "10.0"}], []]
    with pytest.raises(KeyError):
        asyncio.run(zabbix_data_source._fetch_one_slot(start, end))


# Tests for ZabbixClient
@pytest.fixture
def zabbix_client(mock_zabbix_api):
    client = ZabbixClient(
        url="http://zabbix.example.com",
        user="admin",
        password="password",
    )
    client.zapi = mock_zabbix_api
    return client


def test_zabbix_client_create_rule(zabbix_client):
    zabbix_client.create_rule = AsyncMock()
    trigger_configs = [
        ZabbixTriggerConfig(
            hostname="host1",
            metric_name="metric1",
            start=0,
            end=1,
            threshold=10,
            threshold_operator=">",
            aggregation_function="avg",
            aggregation_period="5m",
        )
    ]
    asyncio.run(zabbix_client.create_rule("test_key", trigger_configs))
    zabbix_client.create_rule.assert_called_once_with("test_key", trigger_configs)


def test_zabbix_client_query_methods(zabbix_client):
    """Test various query methods of ZabbixClient."""
    # Test get_templates
    zabbix_client.zapi.template.get.return_value = [{"templateid": "1", "host": "Template OS Linux"}]
    templates = zabbix_client.get_templates()
    assert len(templates) == 1
    assert templates[0].templateid == "1"

    # Test get_mediatypes
    zabbix_client.zapi.mediatype.get.return_value = [
        {"mediatypeid": "1", "name": "Email", "type": "0"},
        {"mediatypeid": "2", "name": "SMS", "type": "1"},
    ]
    mediatypes = zabbix_client.get_mediatypes()
    assert len(mediatypes) == 2
    assert mediatypes[0].media_type_id == "1"

    # Test get_metrics_by_template_id
    zabbix_client.zapi.item.get.return_value = [
        {"value_type": "0", "name": "CPU Load", "key_": "system.cpu.load[percpu,avg1]"},
        {"value_type": "3", "name": "Memory Usage", "key_": "vm.memory.size[used]"},
    ]
    metrics = zabbix_client.get_metrics_by_template_id("10001")
    assert len(metrics) == 2
    assert metrics[0].name == "CPU Load"

    # Test get_items_by_host_and_metric_name
    zabbix_client.zapi.item.get.return_value = [{"itemid": "23456"}]
    items = zabbix_client.get_items_by_host_and_metric_name("zabbix-server", "system.cpu.load")
    assert len(items) == 1
    assert items[0].itemid == "23456"

    # Test get_triggers
    zabbix_client.zapi.trigger.get.return_value = [{"triggerid": "1", "description": "test"}]
    triggers = zabbix_client.get_triggers("test")
    assert len(triggers) == 1


def test_zabbix_data_source_build_item_labels_map(zabbix_data_source):
    # Call the original implementation directly
    labels_map = ZabbixDataSource._build_item_labels_map(zabbix_data_source)
    assert 12345 in labels_map
    assert labels_map[12345]["hostname"] == "zabbix.example.com"
    assert labels_map[12345]["itemid"] == "12345"


def test_zabbix_client_create_default_mediatype(zabbix_client):
    zabbix_client.zapi.mediatype.get.return_value = []
    zabbix_client.zapi.mediatype.create = MagicMock()
    with patch("veaiops.metrics.zabbix.get_settings") as mock_settings:
        mock_settings.return_value.event_center_url = "http://example.com/"
        zabbix_client.create_default_mediatype()
        zabbix_client.zapi.mediatype.create.assert_called_once()


def test_zabbix_client_create_rule_with_contact_groups(zabbix_client):
    zabbix_client.zapi.trigger.create = MagicMock()
    zabbix_client.create_action = MagicMock()
    trigger_configs = [
        ZabbixTriggerConfig(
            hostname="host1",
            metric_name="metric1",
            start=0,
            end=1,
            threshold=10,
            threshold_operator=">",
            aggregation_function="avg",
            aggregation_period="5m",
        )
    ]
    zabbix_client.create_rule("test_key", trigger_configs, [], 4, ["1"], ["2"])
    zabbix_client.zapi.trigger.create.assert_called_once()
    zabbix_client.create_action.assert_called_once_with(
        trigger_name="test_key", user_group_ids=["1"], media_type_ids=["2"]
    )


def test_zabbix_client_update_rule_with_existing_trigger(zabbix_client):
    zabbix_client.zapi.trigger.get.return_value = [{"triggerid": "123"}]
    zabbix_client.zapi.trigger.update = MagicMock()
    zabbix_client.update_action = MagicMock()
    trigger_configs = [
        ZabbixTriggerConfig(
            hostname="host1",
            metric_name="metric1",
            start=0,
            end=1,
            threshold=10,
            threshold_operator=">",
            aggregation_function="avg",
            aggregation_period="5m",
        )
    ]
    existing_trigger = {"triggerid": "123"}
    zabbix_client.update_rule("test_key", trigger_configs, existing_trigger, [], 4, ["1"], ["2"])
    zabbix_client.zapi.trigger.update.assert_called()
    zabbix_client.update_action.assert_called_once()


def test_zabbix_client_update_rule_delete_actions_without_contact_groups(zabbix_client):
    zabbix_client.zapi.trigger.get.return_value = [{"triggerid": "123"}]
    zabbix_client.zapi.trigger.update = MagicMock()
    zabbix_client.delete_action = MagicMock()
    trigger_configs = [
        ZabbixTriggerConfig(
            hostname="host1",
            metric_name="metric1",
            start=0,
            end=1,
            threshold=10,
            threshold_operator=">",
            aggregation_function="avg",
            aggregation_period="5m",
        )
    ]
    existing_trigger = {"triggerid": "123"}
    zabbix_client.update_rule("test_key", trigger_configs, existing_trigger, [], 4, None, None)
    zabbix_client.delete_action.assert_called_once_with("test_key")


def test_zabbix_client_delete_rules_bulk(zabbix_client):
    zabbix_client.delete_action = MagicMock()
    zabbix_client.zapi.trigger.get.return_value = [{"triggerid": "123"}, {"triggerid": "456"}]
    zabbix_client.zapi.trigger.delete = MagicMock()
    zabbix_client.delete_rules(["key1", "key2"])
    assert zabbix_client.delete_action.call_count == 2
    zabbix_client.zapi.trigger.delete.assert_called_once_with("123", "456")


def test_zabbix_client_create_default_action(zabbix_client):
    zabbix_client.zapi.action.get.return_value = []
    zabbix_client.zapi.user.get.return_value = [{"userid": "1"}]
    zabbix_client.zapi.mediatype.get.return_value = [{"mediatypeid": "1"}]
    zabbix_client.zapi.action.create = MagicMock()
    zabbix_client.create_default_action("admin")
    zabbix_client.zapi.action.create.assert_called_once()


def test_zabbix_data_source_build_tags():
    from veaiops.schema.documents import IntelligentThresholdTask

    task = MagicMock(spec=IntelligentThresholdTask)
    task.projects = ["project1", "project2"]

    tags = ZabbixDataSource._build_tags(task)
    assert len(tags) >= 3  # default tag + 2 project tags
    assert any(tag.tag == "managed-by" for tag in tags)
    assert any(tag.tag == "projects_01" and tag.value == "project1" for tag in tags)
    assert any(tag.tag == "projects_02" and tag.value == "project2" for tag in tags)


def test_zabbix_data_source_sync_rules_for_intelligent_threshold_task(zabbix_data_source):
    from veaiops.schema.base.intelligent_threshold import IntelligentThresholdConfig, MetricThresholdResult
    from veaiops.schema.documents import IntelligentThresholdTask, IntelligentThresholdTaskVersion
    from veaiops.schema.types import EventLevel

    # Create mock task and task_version
    task = MagicMock(spec=IntelligentThresholdTask)
    task.projects = ["project1"]

    threshold_config = MagicMock(spec=IntelligentThresholdConfig)
    threshold_config.start_hour = 0
    threshold_config.end_hour = 24
    threshold_config.window_size = 5
    threshold_config.upper_bound = 100.0
    threshold_config.lower_bound = 10.0

    metric_result = MagicMock(spec=MetricThresholdResult)
    metric_result.labels = {"hostname": "zabbix.example.com"}
    metric_result.thresholds = [threshold_config]

    task_version = MagicMock(spec=IntelligentThresholdTaskVersion)
    task_version.result = [metric_result]

    # Mock client methods
    zabbix_data_source.client.get_triggers = MagicMock(return_value=[])
    zabbix_data_source.client.create_rule = MagicMock()

    # Call sync_rules
    result = asyncio.run(
        zabbix_data_source.sync_rules_for_intelligent_threshold_task(
            task=task,
            task_version=task_version,
            alarm_level=EventLevel.P2,
        )
    )

    assert result["total"] >= 0
    assert "created" in result
    assert "updated" in result
    assert "deleted" in result


def test_zabbix_client_update_rule_with_actions(zabbix_client):
    zabbix_client.zapi.trigger.get.return_value = [{"triggerid": "123"}]
    zabbix_client.zapi.trigger.update = MagicMock()
    zabbix_client.update_action = MagicMock()
    trigger_configs = [
        ZabbixTriggerConfig(
            hostname="host1",
            metric_name="metric1",
            start=0,
            end=1,
            threshold=10,
            threshold_operator=">",
            aggregation_function="avg",
            aggregation_period="5m",
        )
    ]
    existing_trigger = {"triggerid": "123"}
    zabbix_client.update_rule("test_key", trigger_configs, existing_trigger, [], 4, ["1"], ["2"])
    zabbix_client.update_action.assert_called_once_with(
        trigger_name="test_key", user_group_ids=["1"], media_type_ids=["2"]
    )
