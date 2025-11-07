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

from datetime import datetime

import pytest

from veaiops.handler.services.event.converter.intelligent_threshold import (
    convert_aliyun_alarm_to_event,
    convert_intelligent_threshold_alarm_to_event,
    convert_volcengine_alarm_to_event,
    handle_aliyun_resource_event_with_merge,
    handle_volcengine_resource_event,
)
from veaiops.schema.base.intelligent_threshold import (
    AliyunAlarmNotification,
    ResourceInfo,
    VolcengineAlarmPayload,
    ZabbixAlarmPayload,
)
from veaiops.schema.documents import Event
from veaiops.schema.types import DataSourceType, EventLevel


@pytest.mark.asyncio
async def test_convert_intelligent_threshold_alarm_to_event_volcengine(mocker):
    """Test convert_intelligent_threshold_alarm_to_event with Volcengine source."""
    mock_alarm = mocker.MagicMock(spec=VolcengineAlarmPayload)
    mock_converter = mocker.patch(
        "veaiops.handler.services.event.converter.intelligent_threshold.convert_volcengine_alarm_to_event",
        mocker.AsyncMock(return_value="volcengine_event"),
    )
    result = await convert_intelligent_threshold_alarm_to_event(DataSourceType.Volcengine, mock_alarm)
    mock_converter.assert_called_once_with(mock_alarm)
    assert result == "volcengine_event"


@pytest.mark.asyncio
async def test_convert_intelligent_threshold_alarm_to_event_aliyun(mocker):
    """Test convert_intelligent_threshold_alarm_to_event with Aliyun source."""
    mock_alarm = mocker.MagicMock(spec=AliyunAlarmNotification)
    mock_converter = mocker.patch(
        "veaiops.handler.services.event.converter.intelligent_threshold.convert_aliyun_alarm_to_event",
        mocker.AsyncMock(return_value="aliyun_event"),
    )
    result = await convert_intelligent_threshold_alarm_to_event(DataSourceType.Aliyun, mock_alarm)
    mock_converter.assert_called_once_with(mock_alarm)
    assert result == "aliyun_event"


@pytest.mark.asyncio
async def test_convert_intelligent_threshold_alarm_to_event_zabbix(mocker):
    """Test convert_intelligent_threshold_alarm_to_event with Zabbix source."""
    mock_alarm = mocker.MagicMock(spec=ZabbixAlarmPayload)
    mock_converter = mocker.patch(
        "veaiops.handler.services.event.converter.intelligent_threshold.convert_zabbix_alarm_to_event",
        mocker.AsyncMock(return_value="zabbix_event"),
    )
    result = await convert_intelligent_threshold_alarm_to_event(DataSourceType.Zabbix, mock_alarm)
    mock_converter.assert_called_once_with(mock_alarm)
    assert result == "zabbix_event"


@pytest.mark.asyncio
async def test_convert_intelligent_threshold_alarm_to_event_type_mismatch(mocker):
    """Test convert_intelligent_threshold_alarm_to_event with mismatched types."""
    # Test with Volcengine source but Aliyun alarm payload - should handle gracefully
    mock_alarm = mocker.MagicMock(spec=AliyunAlarmNotification)
    result = await convert_intelligent_threshold_alarm_to_event(DataSourceType.Volcengine, mock_alarm)
    assert result is None


@pytest.mark.asyncio
async def test_convert_volcengine_alarm_to_event_metric(mocker):
    """Test convert_volcengine_alarm_to_event with Metric type."""
    mock_alarm = mocker.MagicMock(spec=VolcengineAlarmPayload, type="Metric", tags=[], resources=[], level="critical")
    mock_handler = mocker.patch(
        "veaiops.handler.services.event.converter.intelligent_threshold.handle_volcengine_resource_event",
        mocker.AsyncMock(return_value="metric_event"),
    )
    result = await convert_volcengine_alarm_to_event(mock_alarm)
    mock_handler.assert_called_once()
    assert result == "metric_event"


@pytest.mark.asyncio
async def test_convert_aliyun_alarm_to_event_alert(mocker):
    """Test convert_aliyun_alarm_to_event with ALERT state."""
    mock_alarm = mocker.MagicMock(
        spec=AliyunAlarmNotification, alertState="ALERT", customLabels=[], triggerLevel="CRITICAL"
    )
    mock_handler = mocker.patch(
        "veaiops.handler.services.event.converter.intelligent_threshold.handle_aliyun_resource_event_with_merge",
        mocker.AsyncMock(return_value="alert_event"),
    )
    result = await convert_aliyun_alarm_to_event(mock_alarm)
    mock_handler.assert_called_once()
    assert result == "alert_event"


@pytest.mark.asyncio
async def test_handle_volcengine_resource_event_create(mocker):
    """Test handle_volcengine_resource_event creating a new event."""
    mock_alarm = mocker.MagicMock(
        spec=VolcengineAlarmPayload,
        type="Metric",
        account_id="test_account",
        rule_name="test_rule",
        rule_id="test_rule_id",
        namespace="test_namespace",
        sub_namespace="test_sub_namespace",
        level="critical",
        happened_at=str(datetime.now().timestamp()),
        rule_condition="test_condition",
        project="test_project",
        tags=[],
        resources=[],
        recovered_resources=None,
        no_data_resources=None,
        no_data_recovered_resources=None,
    )
    mock_resource = mocker.MagicMock(
        spec=ResourceInfo,
        alert_group_id="test_group_id",
        first_alert_time=datetime.now().timestamp(),
        region="test_region",
    )
    mock_find_query = mocker.MagicMock()
    mock_find_query.to_list = mocker.AsyncMock(return_value=[])
    mocker.patch.object(Event, "find", return_value=mock_find_query)
    mock_event_insert = mocker.patch.object(Event, "insert", mocker.AsyncMock())

    events = await handle_volcengine_resource_event(mock_alarm, EventLevel.P0, [], [], [], [mock_resource], "Metric")

    assert events is not None
    assert len(events) == 1
    mock_event_insert.assert_called_once()


@pytest.mark.asyncio
async def test_handle_volcengine_resource_event_update(mocker):
    """Test handle_volcengine_resource_event updating an existing event."""
    mock_alarm = mocker.MagicMock(
        spec=VolcengineAlarmPayload,
        type="Metric",
        account_id="test_account",
        rule_name="test_rule",
        rule_id="test_rule_id",
        namespace="test_namespace",
        sub_namespace="test_sub_namespace",
        level="critical",
        happened_at=str(datetime.now().timestamp()),
        rule_condition="test_condition",
        project="test_project",
        tags=[],
        resources=[],
        recovered_resources=None,
        no_data_resources=None,
        no_data_recovered_resources=None,
    )
    mock_resource = mocker.MagicMock(
        spec=ResourceInfo,
        alert_group_id="test_group_id",
        first_alert_time=datetime.now().timestamp(),
        region="test_region",
    )
    mock_existing_event = mocker.MagicMock(spec=Event)
    mock_existing_event.raw_data.resource.alert_group_id = "test_group_id"
    mock_find_query = mocker.MagicMock()
    mock_find_query.to_list = mocker.AsyncMock(return_value=[mock_existing_event])
    mocker.patch.object(Event, "find", return_value=mock_find_query)

    events = await handle_volcengine_resource_event(mock_alarm, EventLevel.P0, [], [], [], [mock_resource], "Metric")

    assert events is not None
    assert len(events) == 1
    mock_existing_event.save.assert_called_once()


@pytest.mark.asyncio
async def test_handle_aliyun_resource_event_with_merge_create_alert(mocker):
    """Test handle_aliyun_resource_event_with_merge creating a new alert event."""
    mock_alarm = mocker.MagicMock(
        spec=AliyunAlarmNotification, ruleId="test_rule", dimensions={}, regionId="test_region"
    )
    mock_find_query = mocker.MagicMock()
    mock_find_query.sort.return_value.to_list = mocker.AsyncMock(return_value=[])
    mocker.patch.object(Event, "find", return_value=mock_find_query)
    mock_event_save = mocker.patch.object(Event, "save", mocker.AsyncMock())

    events = await handle_aliyun_resource_event_with_merge(mock_alarm, EventLevel.P0, [], [], [], "ALERT")

    assert events is not None
    assert len(events) == 1
    mock_event_save.assert_called_once()


@pytest.mark.asyncio
async def test_handle_aliyun_resource_event_with_merge_update_alert(mocker):
    """Test handle_aliyun_resource_event_with_merge updating an existing alert event."""
    mock_alarm = mocker.MagicMock(
        spec=AliyunAlarmNotification, ruleId="test_rule", dimensions={}, regionId="test_region"
    )
    mock_existing_event = mocker.MagicMock(spec=Event)
    mock_existing_event.raw_data.alertState = "ALERT"
    mock_find_query = mocker.MagicMock()
    mock_find_query.sort.return_value.to_list = mocker.AsyncMock(return_value=[mock_existing_event])
    mocker.patch.object(Event, "find", return_value=mock_find_query)

    events = await handle_aliyun_resource_event_with_merge(mock_alarm, EventLevel.P0, [], [], [], "ALERT")

    assert events is not None
    assert len(events) == 1
    mock_existing_event.save.assert_called_once()


@pytest.mark.asyncio
async def test_handle_aliyun_resource_event_with_merge_recovery_no_existing(mocker):
    """Test handle_aliyun_resource_event_with_merge with recovery event but no existing events."""
    from veaiops.handler.services.event.converter.intelligent_threshold import (
        handle_aliyun_resource_event_with_merge,
    )

    mock_alarm = mocker.MagicMock(
        spec=AliyunAlarmNotification, ruleId="test_rule", dimensions={}, regionId="test_region"
    )
    mock_find_query = mocker.MagicMock()
    mock_find_query.sort.return_value.to_list = mocker.AsyncMock(return_value=[])
    mocker.patch.object(Event, "find", return_value=mock_find_query)
    mocker.patch.object(Event, "save", mocker.AsyncMock())

    events = await handle_aliyun_resource_event_with_merge(mock_alarm, EventLevel.P2, [], [], [], "OK")

    assert events is not None
    assert len(events) == 1


@pytest.mark.asyncio
async def test_handle_aliyun_resource_event_with_merge_recovery_existing_alert(mocker):
    """Test handle_aliyun_resource_event_with_merge recovery when latest event is ALERT."""
    from veaiops.handler.services.event.converter.intelligent_threshold import (
        handle_aliyun_resource_event_with_merge,
    )

    mock_alarm = mocker.MagicMock(
        spec=AliyunAlarmNotification, ruleId="test_rule", dimensions={}, regionId="test_region"
    )
    mock_existing_event = mocker.MagicMock(spec=Event)
    mock_existing_event.raw_data.alertState = "ALERT"
    mock_find_query = mocker.MagicMock()
    mock_find_query.sort.return_value.to_list = mocker.AsyncMock(return_value=[mock_existing_event])
    mocker.patch.object(Event, "find", return_value=mock_find_query)
    mocker.patch.object(Event, "save", mocker.AsyncMock())

    events = await handle_aliyun_resource_event_with_merge(mock_alarm, EventLevel.P2, [], [], [], "OK")

    assert events is not None
    assert len(events) == 1


@pytest.mark.asyncio
async def test_handle_aliyun_resource_event_with_merge_recovery_existing_recovery(mocker):
    """Test handle_aliyun_resource_event_with_merge recovery when latest event is already OK."""
    from veaiops.handler.services.event.converter.intelligent_threshold import (
        handle_aliyun_resource_event_with_merge,
    )

    mock_alarm = mocker.MagicMock(
        spec=AliyunAlarmNotification, ruleId="test_rule", dimensions={}, regionId="test_region"
    )
    mock_existing_event = mocker.MagicMock(spec=Event)
    mock_existing_event.raw_data.alertState = "OK"
    mock_find_query = mocker.MagicMock()
    mock_find_query.sort.return_value.to_list = mocker.AsyncMock(return_value=[mock_existing_event])
    mocker.patch.object(Event, "find", return_value=mock_find_query)

    events = await handle_aliyun_resource_event_with_merge(mock_alarm, EventLevel.P2, [], [], [], "OK")

    assert events is not None
    assert len(events) == 1
    mock_existing_event.save.assert_called_once()


@pytest.mark.asyncio
async def test_convert_zabbix_alarm_to_event(mocker):
    """Test convert_zabbix_alarm_to_event with Zabbix alarm payload."""
    from veaiops.handler.services.event.converter.intelligent_threshold import (
        convert_zabbix_alarm_to_event,
    )
    from veaiops.schema.base.intelligent_threshold import ZabbixAlarmNotification

    mock_params = mocker.MagicMock(spec=ZabbixAlarmNotification)
    mock_params.trigger_status = "PROBLEM"
    mock_params.message = "Severity: High"
    mock_params.tags = []
    mock_alarm = mocker.MagicMock(spec=ZabbixAlarmPayload)
    mock_alarm.params = mock_params

    mocker.patch(
        "veaiops.handler.services.event.converter.intelligent_threshold.handle_zabbix_resource_event_with_merge",
        mocker.AsyncMock(return_value=[mocker.MagicMock(spec=Event)]),
    )

    result = await convert_zabbix_alarm_to_event(mock_alarm)

    assert result is not None
    assert len(result) >= 1


@pytest.mark.asyncio
async def test_handle_volcengine_resource_event_no_resources(mocker):
    """Test handle_volcengine_resource_event with no resources."""
    mock_alarm = mocker.MagicMock(spec=VolcengineAlarmPayload)
    result = await handle_volcengine_resource_event(mock_alarm, EventLevel.P0, [], [], [], [], "Metric")

    assert result is None


@pytest.mark.asyncio
async def test_convert_aliyun_alarm_to_event_with_tags(mocker):
    """Test convert_aliyun_alarm_to_event extracting project/customer/product from tags."""
    from veaiops.handler.services.event.converter.intelligent_threshold import (
        convert_aliyun_alarm_to_event,
    )

    mock_alarm = mocker.MagicMock(
        spec=AliyunAlarmNotification,
        alertState="ALERT",
        triggerLevel="HIGH",
        customLabels=[
            mocker.MagicMock(labelKey="projects_01", labelValue="project1"),
            mocker.MagicMock(labelKey="customers_01", labelValue="customer1"),
            mocker.MagicMock(labelKey="products_01", labelValue="product1"),
        ],
        regionId="cn-beijing",
    )
    mock_handler = mocker.patch(
        "veaiops.handler.services.event.converter.intelligent_threshold.handle_aliyun_resource_event_with_merge",
        mocker.AsyncMock(return_value=[mocker.MagicMock(spec=Event)]),
    )

    result = await convert_aliyun_alarm_to_event(mock_alarm)

    assert result is not None
    mock_handler.assert_called_once()


@pytest.mark.asyncio
async def test_convert_volcengine_alarm_to_event_with_warning_level(mocker):
    """Test convert_volcengine_alarm_to_event with warning level."""
    from veaiops.handler.services.event.converter.intelligent_threshold import (
        convert_volcengine_alarm_to_event,
    )

    mock_alarm = mocker.MagicMock(
        spec=VolcengineAlarmPayload,
        type="Metric",
        level="warning",
        tags=[],
        resources=[],
        account_id="test_account",
        rule_name="test_rule",
        rule_id="test_rule_id",
        namespace="test_namespace",
        sub_namespace="test_sub_namespace",
    )
    mocker.patch(
        "veaiops.handler.services.event.converter.intelligent_threshold.handle_volcengine_resource_event",
        mocker.AsyncMock(return_value=[mocker.MagicMock(spec=Event)]),
    )

    result = await convert_volcengine_alarm_to_event(mock_alarm)

    assert result is not None


@pytest.mark.asyncio
async def test_convert_volcengine_alarm_to_event_with_notice_level(mocker):
    """Test convert_volcengine_alarm_to_event with notice level."""
    from veaiops.handler.services.event.converter.intelligent_threshold import (
        convert_volcengine_alarm_to_event,
    )

    mock_alarm = mocker.MagicMock(
        spec=VolcengineAlarmPayload,
        type="Metric",
        level="notice",
        tags=[],
        resources=[],
        account_id="test_account",
        rule_name="test_rule",
        rule_id="test_rule_id",
        namespace="test_namespace",
        sub_namespace="test_sub_namespace",
    )
    mocker.patch(
        "veaiops.handler.services.event.converter.intelligent_threshold.handle_volcengine_resource_event",
        mocker.AsyncMock(return_value=[mocker.MagicMock(spec=Event)]),
    )

    result = await convert_volcengine_alarm_to_event(mock_alarm)

    assert result is not None


@pytest.mark.asyncio
async def test_convert_volcengine_alarm_to_event_with_tags(mocker):
    """Test convert_volcengine_alarm_to_event extracting tags."""
    from veaiops.handler.services.event.converter.intelligent_threshold import (
        convert_volcengine_alarm_to_event,
    )

    mock_tag1 = mocker.MagicMock()
    mock_tag1.key = "projects_01"
    mock_tag1.value = "project1"

    mock_tag2 = mocker.MagicMock()
    mock_tag2.key = "customers_02"
    mock_tag2.value = "customer1"

    mock_tag3 = mocker.MagicMock()
    mock_tag3.key = "products_03"
    mock_tag3.value = "product1"

    mock_alarm = mocker.MagicMock(
        spec=VolcengineAlarmPayload,
        type="Metric",
        level="critical",
        tags=[mock_tag1, mock_tag2, mock_tag3],
        resources=[],
        account_id="test_account",
        rule_name="test_rule",
        rule_id="test_rule_id",
        namespace="test_namespace",
        sub_namespace="test_sub_namespace",
    )
    mocker.patch(
        "veaiops.handler.services.event.converter.intelligent_threshold.handle_volcengine_resource_event",
        mocker.AsyncMock(return_value=[mocker.MagicMock(spec=Event)]),
    )

    result = await convert_volcengine_alarm_to_event(mock_alarm)

    assert result is not None


@pytest.mark.asyncio
async def test_convert_zabbix_alarm_to_event_ok_status(mocker):
    """Test convert_zabbix_alarm_to_event with OK recovery status."""
    from veaiops.handler.services.event.converter.intelligent_threshold import (
        convert_zabbix_alarm_to_event,
    )
    from veaiops.schema.base.intelligent_threshold import ZabbixAlarmNotification

    mock_params = mocker.MagicMock(spec=ZabbixAlarmNotification)
    mock_params.trigger_status = "OK"
    mock_params.message = ""
    mock_params.tags = []
    mock_alarm = mocker.MagicMock(spec=ZabbixAlarmPayload)
    mock_alarm.params = mock_params

    mocker.patch(
        "veaiops.handler.services.event.converter.intelligent_threshold.handle_zabbix_resource_event_with_merge",
        mocker.AsyncMock(return_value=[mocker.MagicMock(spec=Event)]),
    )

    result = await convert_zabbix_alarm_to_event(mock_alarm)

    assert result is not None


@pytest.mark.asyncio
async def test_convert_zabbix_alarm_to_event_with_tags(mocker):
    """Test convert_zabbix_alarm_to_event extracting tags."""
    from veaiops.handler.services.event.converter.intelligent_threshold import (
        convert_zabbix_alarm_to_event,
    )
    from veaiops.schema.base.intelligent_threshold import ZabbixAlarmNotification

    mock_tag1 = mocker.MagicMock()
    mock_tag1.tag = "projects_01"
    mock_tag1.value = "project1"

    mock_tag2 = mocker.MagicMock()
    mock_tag2.tag = "customers_02"
    mock_tag2.value = "customer1"

    mock_params = mocker.MagicMock(spec=ZabbixAlarmNotification)
    mock_params.trigger_status = "PROBLEM"
    mock_params.message = "Severity: Disaster"
    mock_params.tags = [mock_tag1, mock_tag2]
    mock_alarm = mocker.MagicMock(spec=ZabbixAlarmPayload)
    mock_alarm.params = mock_params

    mocker.patch(
        "veaiops.handler.services.event.converter.intelligent_threshold.handle_zabbix_resource_event_with_merge",
        mocker.AsyncMock(return_value=[mocker.MagicMock(spec=Event)]),
    )

    result = await convert_zabbix_alarm_to_event(mock_alarm)

    assert result is not None


@pytest.mark.asyncio
async def test_convert_zabbix_alarm_to_event_unsupported_status(mocker):
    """Test convert_zabbix_alarm_to_event with unsupported trigger status."""
    from veaiops.handler.services.event.converter.intelligent_threshold import (
        convert_zabbix_alarm_to_event,
    )
    from veaiops.schema.base.intelligent_threshold import ZabbixAlarmNotification

    mock_params = mocker.MagicMock(spec=ZabbixAlarmNotification)
    mock_params.trigger_status = "UNKNOWN"
    mock_params.message = "Some message"
    mock_params.tags = []
    mock_params.model_dump = mocker.MagicMock(return_value={"key": "value"})
    mock_alarm = mocker.MagicMock(spec=ZabbixAlarmPayload)
    mock_alarm.params = mock_params

    mock_event_save = mocker.patch.object(Event, "save", mocker.AsyncMock())

    result = await convert_zabbix_alarm_to_event(mock_alarm)

    assert result is not None
    assert len(result) >= 1
    mock_event_save.assert_called_once()


@pytest.mark.asyncio
async def test_convert_aliyun_alarm_to_event_recovery(mocker):
    """Test convert_aliyun_alarm_to_event with OK (recovery) state."""
    from veaiops.handler.services.event.converter.intelligent_threshold import (
        convert_aliyun_alarm_to_event,
    )

    mock_alarm = mocker.MagicMock(
        spec=AliyunAlarmNotification,
        alertState="OK",
        triggerLevel="INFO",
        customLabels=[],
        regionId="cn-shanghai",
    )
    mock_handler = mocker.patch(
        "veaiops.handler.services.event.converter.intelligent_threshold.handle_aliyun_resource_event_with_merge",
        mocker.AsyncMock(return_value=[mocker.MagicMock(spec=Event)]),
    )

    result = await convert_aliyun_alarm_to_event(mock_alarm)

    assert result is not None
    mock_handler.assert_called_once()


@pytest.mark.asyncio
async def test_convert_aliyun_alarm_to_event_critical(mocker):
    """Test convert_aliyun_alarm_to_event with CRITICAL trigger level."""
    from veaiops.handler.services.event.converter.intelligent_threshold import (
        convert_aliyun_alarm_to_event,
    )

    mock_alarm = mocker.MagicMock(
        spec=AliyunAlarmNotification,
        alertState="ALERT",
        triggerLevel="CRITICAL",
        customLabels=[],
        regionId="",
    )
    mock_handler = mocker.patch(
        "veaiops.handler.services.event.converter.intelligent_threshold.handle_aliyun_resource_event_with_merge",
        mocker.AsyncMock(return_value=[mocker.MagicMock(spec=Event)]),
    )

    result = await convert_aliyun_alarm_to_event(mock_alarm)

    assert result is not None
    mock_handler.assert_called_once()


@pytest.mark.asyncio
async def test_handle_aliyun_resource_event_with_merge_no_region(mocker):
    """Test handle_aliyun_resource_event_with_merge with no region ID."""
    mock_alarm = mocker.MagicMock(spec=AliyunAlarmNotification, ruleId="test_rule", dimensions={}, regionId="")
    mock_find_query = mocker.MagicMock()
    mock_find_query.sort.return_value.to_list = mocker.AsyncMock(return_value=[])
    mocker.patch.object(Event, "find", return_value=mock_find_query)

    events = await handle_aliyun_resource_event_with_merge(mock_alarm, EventLevel.P0, [], [], [], "ALERT")

    assert events is not None
    assert len(events) == 1


@pytest.mark.asyncio
async def test_convert_volcengine_alarm_to_event_metric_recovered(mocker):
    """Test convert_volcengine_alarm_to_event with MetricRecovered type."""
    from veaiops.handler.services.event.converter.intelligent_threshold import (
        convert_volcengine_alarm_to_event,
    )

    mock_alarm = mocker.MagicMock(
        spec=VolcengineAlarmPayload,
        type="MetricRecovered",
        level="critical",
        tags=[],
        resources=[],
        recovered_resources=[],
        account_id="test_account",
        rule_name="test_rule",
        rule_id="test_rule_id",
        namespace="test_namespace",
        sub_namespace="test_sub_namespace",
    )
    mocker.patch(
        "veaiops.handler.services.event.converter.intelligent_threshold.handle_volcengine_resource_event",
        mocker.AsyncMock(return_value=[mocker.MagicMock(spec=Event)]),
    )

    result = await convert_volcengine_alarm_to_event(mock_alarm)

    assert result is not None


@pytest.mark.asyncio
async def test_convert_volcengine_alarm_to_event_unsupported_type(mocker):
    """Test convert_volcengine_alarm_to_event with unsupported type."""
    from veaiops.handler.services.event.converter.intelligent_threshold import (
        convert_volcengine_alarm_to_event,
    )

    mock_alarm = mocker.MagicMock(
        spec=VolcengineAlarmPayload,
        type="Unknown",
        level="critical",
        tags=[],
        resources=[],
        account_id="test_account",
        rule_name="test_rule",
        rule_id="test_rule_id",
        namespace="test_namespace",
        sub_namespace="test_sub_namespace",
    )

    result = await convert_volcengine_alarm_to_event(mock_alarm)

    # For unsupported types, it should return None or empty
    assert result is None or len(result) == 0


@pytest.mark.asyncio
async def test_handle_aliyun_resource_event_with_merge_with_dimensions(mocker):
    """Test handle_aliyun_resource_event_with_merge with dimensions."""
    mock_alarm = mocker.MagicMock(
        spec=AliyunAlarmNotification,
        ruleId="test_rule",
        dimensions={"instance_id": "i-12345"},
        regionId="cn-beijing",
    )
    mock_find_query = mocker.MagicMock()
    mock_find_query.sort.return_value.to_list = mocker.AsyncMock(return_value=[])
    mocker.patch.object(Event, "find", return_value=mock_find_query)

    events = await handle_aliyun_resource_event_with_merge(
        mock_alarm, EventLevel.P1, ["proj1"], ["cust1"], ["prod1"], "ALERT"
    )

    assert events is not None
    assert len(events) == 1


@pytest.mark.asyncio
async def test_convert_zabbix_alarm_to_event_high_severity(mocker):
    """Test convert_zabbix_alarm_to_event with high severity message."""
    from veaiops.handler.services.event.converter.intelligent_threshold import (
        convert_zabbix_alarm_to_event,
    )
    from veaiops.schema.base.intelligent_threshold import ZabbixAlarmNotification

    mock_params = mocker.MagicMock(spec=ZabbixAlarmNotification)
    mock_params.trigger_status = "PROBLEM"
    mock_params.message = "Severity: High - CPU usage is high"
    mock_params.tags = []
    mock_alarm = mocker.MagicMock(spec=ZabbixAlarmPayload)
    mock_alarm.params = mock_params

    mocker.patch(
        "veaiops.handler.services.event.converter.intelligent_threshold.handle_zabbix_resource_event_with_merge",
        mocker.AsyncMock(return_value=[mocker.MagicMock(spec=Event)]),
    )

    result = await convert_zabbix_alarm_to_event(mock_alarm)

    assert result is not None


@pytest.mark.asyncio
async def test_convert_zabbix_alarm_to_event_average_severity(mocker):
    """Test convert_zabbix_alarm_to_event with average severity."""
    from veaiops.handler.services.event.converter.intelligent_threshold import (
        convert_zabbix_alarm_to_event,
    )
    from veaiops.schema.base.intelligent_threshold import ZabbixAlarmNotification

    mock_params = mocker.MagicMock(spec=ZabbixAlarmNotification)
    mock_params.trigger_status = "PROBLEM"
    mock_params.message = "Severity: Average - warning detected"
    mock_params.tags = []
    mock_alarm = mocker.MagicMock(spec=ZabbixAlarmPayload)
    mock_alarm.params = mock_params

    mocker.patch(
        "veaiops.handler.services.event.converter.intelligent_threshold.handle_zabbix_resource_event_with_merge",
        mocker.AsyncMock(return_value=[mocker.MagicMock(spec=Event)]),
    )

    result = await convert_zabbix_alarm_to_event(mock_alarm)

    assert result is not None
