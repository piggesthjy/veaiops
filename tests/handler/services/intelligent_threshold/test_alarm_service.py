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

"""Tests for intelligent threshold alarm service."""

from datetime import datetime, timedelta, timezone

import pytest
from beanie import PydanticObjectId

from veaiops.handler.services.intelligent_threshold.alarm import (
    cleanup_old_alarm_sync_records,
    get_alarm_sync_records_by_status,
    get_alarm_sync_records_by_task_id,
    get_alarm_sync_records_by_task_version_id,
    get_recent_alarm_sync_records,
    list_alarm_sync_records,
)
from veaiops.schema.documents.intelligent_threshold.alarm_sync_record import AlarmSyncRecord
from veaiops.schema.models.base import TimeRange
from veaiops.schema.types import AlarmSyncRecordStatus, EventLevel


@pytest.mark.asyncio
async def test_list_alarm_sync_records_no_filter():
    """Test listing alarm sync records without filters."""
    # Arrange - create test records
    record1 = await AlarmSyncRecord(
        task_id=PydanticObjectId(),
        task_version_id=PydanticObjectId(),
        contact_group_ids=["group1"],
        alert_methods=["email"],
        alarm_level=EventLevel.P0,
        total=10,
        created=8,
        updated=2,
        deleted=0,
        failed=0,
        status=AlarmSyncRecordStatus.SUCCESS,
        error_message=None,
        webhook=None,
    ).insert()

    record2 = await AlarmSyncRecord(
        task_id=PydanticObjectId(),
        task_version_id=PydanticObjectId(),
        contact_group_ids=["group2"],
        alert_methods=["sms"],
        alarm_level=EventLevel.P2,
        total=5,
        created=5,
        updated=0,
        deleted=0,
        failed=0,
        status=AlarmSyncRecordStatus.SUCCESS,
        error_message=None,
        webhook=None,
    ).insert()

    # Act
    records, total = await list_alarm_sync_records()

    # Assert
    assert total >= 2
    assert len(records) >= 2

    # Cleanup
    await record1.delete()
    await record2.delete()


@pytest.mark.asyncio
async def test_list_alarm_sync_records_with_status_filter():
    """Test listing alarm sync records with status filter."""
    # Arrange
    record = await AlarmSyncRecord(
        task_id=PydanticObjectId(),
        task_version_id=PydanticObjectId(),
        contact_group_ids=["group1"],
        alert_methods=["email"],
        alarm_level=EventLevel.P1,
        total=3,
        created=2,
        updated=1,
        deleted=0,
        failed=0,
        status=AlarmSyncRecordStatus.SUCCESS,
        error_message=None,
        webhook=None,
    ).insert()

    # Act
    records, total = await list_alarm_sync_records(status=AlarmSyncRecordStatus.SUCCESS)

    # Assert
    assert total >= 1
    found = any(r.id == record.id for r in records)
    assert found

    # Cleanup
    await record.delete()


@pytest.mark.asyncio
async def test_list_alarm_sync_records_with_time_range():
    """Test listing alarm sync records with time range filter."""
    # Arrange
    now_utc = datetime.now(timezone.utc)
    record = await AlarmSyncRecord(
        task_id=PydanticObjectId(),
        task_version_id=PydanticObjectId(),
        contact_group_ids=["group1"],
        alert_methods=["email"],
        alarm_level=EventLevel.P0,
        total=1,
        created=1,
        updated=0,
        deleted=0,
        failed=0,
        status=AlarmSyncRecordStatus.SUCCESS,
        error_message=None,
        webhook=None,
    ).insert()

    # Create time range that includes now
    start_time = (now_utc - timedelta(hours=1)).timestamp()
    end_time = (now_utc + timedelta(hours=1)).timestamp()
    time_range = TimeRange(start_time=int(start_time), end_time=int(end_time))

    # Act
    records, total = await list_alarm_sync_records(created_at_range=time_range)

    # Assert
    assert total >= 1
    found = any(r.id == record.id for r in records)
    assert found

    # Cleanup
    await record.delete()


@pytest.mark.asyncio
async def test_get_alarm_sync_records_by_task_id():
    """Test getting alarm sync records by task ID."""
    # Arrange
    task_id = PydanticObjectId()
    record = await AlarmSyncRecord(
        task_id=task_id,
        task_version_id=PydanticObjectId(),
        contact_group_ids=["group1"],
        alert_methods=["email"],
        alarm_level=EventLevel.P0,
        total=5,
        created=5,
        updated=0,
        deleted=0,
        failed=0,
        status=AlarmSyncRecordStatus.SUCCESS,
        error_message=None,
        webhook=None,
    ).insert()

    # Act
    records = await get_alarm_sync_records_by_task_id(task_id)

    # Assert
    assert len(records) >= 1
    found = any(r.id == record.id for r in records)
    assert found

    # Cleanup
    await record.delete()


@pytest.mark.asyncio
async def test_get_alarm_sync_records_by_task_version_id():
    """Test getting alarm sync records by task version ID."""
    # Arrange
    task_version_id = PydanticObjectId()
    record = await AlarmSyncRecord(
        task_id=PydanticObjectId(),
        task_version_id=task_version_id,
        contact_group_ids=["group1"],
        alert_methods=["email"],
        alarm_level=EventLevel.P1,
        total=3,
        created=3,
        updated=0,
        deleted=0,
        failed=0,
        status=AlarmSyncRecordStatus.SUCCESS,
        error_message=None,
        webhook=None,
    ).insert()

    # Act
    records = await get_alarm_sync_records_by_task_version_id(task_version_id)

    # Assert
    assert len(records) >= 1
    found = any(r.id == record.id for r in records)
    assert found

    # Cleanup
    await record.delete()


@pytest.mark.asyncio
async def test_get_recent_alarm_sync_records():
    """Test getting recent alarm sync records."""
    # Arrange
    record = await AlarmSyncRecord(
        task_id=PydanticObjectId(),
        task_version_id=PydanticObjectId(),
        contact_group_ids=["group1"],
        alert_methods=["email"],
        alarm_level=EventLevel.P0,
        total=10,
        created=10,
        updated=0,
        deleted=0,
        failed=0,
        status=AlarmSyncRecordStatus.SUCCESS,
        error_message=None,
        webhook=None,
    ).insert()

    # Act
    records = await get_recent_alarm_sync_records(limit=100)

    # Assert
    assert len(records) >= 1
    found = any(r.id == record.id for r in records)
    assert found

    # Cleanup
    await record.delete()


@pytest.mark.asyncio
async def test_get_alarm_sync_records_by_status():
    """Test getting alarm sync records by status."""
    # Arrange
    record = await AlarmSyncRecord(
        task_id=PydanticObjectId(),
        task_version_id=PydanticObjectId(),
        contact_group_ids=["group1"],
        alert_methods=["email"],
        alarm_level=EventLevel.P0,
        total=5,
        created=5,
        updated=0,
        deleted=0,
        failed=0,
        status=AlarmSyncRecordStatus.SUCCESS,
        error_message=None,
        webhook=None,
    ).insert()

    # Act
    records = await get_alarm_sync_records_by_status(AlarmSyncRecordStatus.SUCCESS)

    # Assert
    assert len(records) >= 1
    found = any(r.id == record.id for r in records)
    assert found

    # Cleanup
    await record.delete()


@pytest.mark.asyncio
async def test_cleanup_old_alarm_sync_records():
    """Test cleaning up old alarm sync records."""
    # Arrange - create an old record
    old_record = await AlarmSyncRecord(
        task_id=PydanticObjectId(),
        task_version_id=PydanticObjectId(),
        contact_group_ids=["group1"],
        alert_methods=["email"],
        alarm_level=EventLevel.P0,
        total=1,
        created=1,
        updated=0,
        deleted=0,
        failed=0,
        status=AlarmSyncRecordStatus.SUCCESS,
        error_message=None,
        webhook=None,
        created_at=datetime.now(timezone.utc) - timedelta(days=40),
    ).insert()

    # Act
    deleted_count = await cleanup_old_alarm_sync_records(days_to_keep=30)

    # Assert
    assert deleted_count >= 1

    # Verify the old record is deleted
    check = await AlarmSyncRecord.get(old_record.id)
    assert check is None


@pytest.mark.asyncio
async def test_sync_alarm_rules_service_task_not_found(mocker):
    """Test sync_alarm_rules_service when task is not found."""
    from veaiops.handler.errors import RecordNotFoundError
    from veaiops.handler.services.intelligent_threshold.alarm import sync_alarm_rules_service
    from veaiops.schema.models.intelligent_threshold.alarm import SyncAlarmRulesPayload
    from veaiops.schema.types import EventLevel

    # Arrange
    sync_config = SyncAlarmRulesPayload(
        task_id=PydanticObjectId(),
        task_version_id=PydanticObjectId(),
        contact_group_ids=["group1"],
        alert_methods=["email"],
        alarm_level=EventLevel.P0,
        webhook="http://example.com/webhook",
    )

    # Mock IntelligentThresholdTask.get to return None
    mocker.patch(
        "veaiops.handler.services.intelligent_threshold.alarm.IntelligentThresholdTask.get",
        mocker.AsyncMock(return_value=None),
    )

    # Act & Assert
    with pytest.raises(RecordNotFoundError, match="IntelligentThresholdTask.*not found"):
        await sync_alarm_rules_service(sync_config)


@pytest.mark.asyncio
async def test_sync_alarm_rules_service_task_version_not_found(mocker):
    """Test sync_alarm_rules_service when task version is not found."""
    from veaiops.handler.errors import RecordNotFoundError
    from veaiops.handler.services.intelligent_threshold.alarm import sync_alarm_rules_service
    from veaiops.schema.models.intelligent_threshold.alarm import SyncAlarmRulesPayload
    from veaiops.schema.types import EventLevel

    # Arrange
    sync_config = SyncAlarmRulesPayload(
        task_id=PydanticObjectId(),
        task_version_id=PydanticObjectId(),
        contact_group_ids=["group1"],
        alert_methods=["email"],
        alarm_level=EventLevel.P0,
        webhook="http://example.com/webhook",
    )

    # Mock task query
    mock_task = mocker.MagicMock()
    mocker.patch(
        "veaiops.handler.services.intelligent_threshold.alarm.IntelligentThresholdTask.get",
        mocker.AsyncMock(return_value=mock_task),
    )
    mocker.patch(
        "veaiops.handler.services.intelligent_threshold.alarm.IntelligentThresholdTaskVersion.get",
        mocker.AsyncMock(return_value=None),
    )

    # Act & Assert
    with pytest.raises(RecordNotFoundError, match="IntelligentThresholdTaskVersion.*not found"):
        await sync_alarm_rules_service(sync_config)


@pytest.mark.asyncio
async def test_sync_alarm_rules_service_datasource_not_found(mocker):
    """Test sync_alarm_rules_service when datasource is not found."""
    from veaiops.handler.errors import RecordNotFoundError
    from veaiops.handler.services.intelligent_threshold.alarm import sync_alarm_rules_service
    from veaiops.schema.models.intelligent_threshold.alarm import SyncAlarmRulesPayload
    from veaiops.schema.types import EventLevel

    # Arrange
    sync_config = SyncAlarmRulesPayload(
        task_id=PydanticObjectId(),
        task_version_id=PydanticObjectId(),
        contact_group_ids=["group1"],
        alert_methods=["email"],
        alarm_level=EventLevel.P0,
        webhook="http://example.com/webhook",
    )

    # Mock task and version queries
    mock_task = mocker.MagicMock()
    mock_task_version = mocker.MagicMock()
    mocker.patch(
        "veaiops.handler.services.intelligent_threshold.alarm.IntelligentThresholdTask.get",
        mocker.AsyncMock(return_value=mock_task),
    )
    mocker.patch(
        "veaiops.handler.services.intelligent_threshold.alarm.IntelligentThresholdTaskVersion.get",
        mocker.AsyncMock(return_value=mock_task_version),
    )
    mocker.patch(
        "veaiops.handler.services.intelligent_threshold.alarm.DataSource.find_one",
        mocker.AsyncMock(return_value=None),
    )

    # Act & Assert
    with pytest.raises(RecordNotFoundError, match="Associated datasource metadata not found"):
        await sync_alarm_rules_service(sync_config)
