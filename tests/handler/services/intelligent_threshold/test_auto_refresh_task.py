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

"""Tests for intelligent threshold auto refresh task service."""

from unittest.mock import AsyncMock, patch

import pytest
import pytest_asyncio
from beanie import PydanticObjectId

from veaiops.handler.services.intelligent_threshold.auto_refresh_task import (
    _rollback_auto_refresh_task_creation,
    check_and_update_overall_record_status,
    initialize_auto_refresh_task,
    process_detail_alarm_inject_status,
    process_detail_task_status,
    process_record_detail_tasks,
    scheduled_process_record_detail_tasks,
)
from veaiops.schema.documents.intelligent_threshold.alarm_sync_record import AlarmSyncRecord
from veaiops.schema.documents.intelligent_threshold.auto_refresh_task import (
    AutoIntelligentThresholdTaskRecord,
    AutoIntelligentThresholdTaskRecordDetail,
)
from veaiops.schema.documents.intelligent_threshold.task import IntelligentThresholdTask
from veaiops.schema.documents.intelligent_threshold.task_version import IntelligentThresholdTaskVersion
from veaiops.schema.models.template.metric import MetricTemplateValue
from veaiops.schema.types import (
    AlarmSyncRecordStatus,
    AutoIntelligentThresholdTaskAlarmInjectStatus,
    AutoIntelligentThresholdTaskDetailStatus,
    AutoIntelligentThresholdTaskDetailTaskStatus,
    AutoIntelligentThresholdTaskStatus,
    DataSourceType,
    EventLevel,
    IntelligentThresholdDirection,
    IntelligentThresholdTaskStatus,
    MetricType,
)


@pytest_asyncio.fixture
async def test_threshold_task(test_connect):
    """Create a test intelligent threshold task."""
    task = await IntelligentThresholdTask(
        task_name="Test Threshold Task",
        datasource_id=test_connect.id,
        datasource_type=DataSourceType.Aliyun,
        auto_update=True,
        projects=["test_project"],
        is_active=True,
    ).insert()
    yield task
    await task.delete()


@pytest_asyncio.fixture
async def test_threshold_task_no_auto_update(test_connect):
    """Create a test intelligent threshold task without auto_update."""
    task = await IntelligentThresholdTask(
        task_name="Test Threshold Task No Auto",
        datasource_id=test_connect.id,
        datasource_type=DataSourceType.Aliyun,
        auto_update=False,
        projects=["test_project"],
        is_active=True,
    ).insert()
    yield task
    await task.delete()


@pytest_asyncio.fixture
async def test_threshold_task_version(test_threshold_task):
    """Create a test task version."""
    metric_value = MetricTemplateValue(name="cpu_usage", metric_type=MetricType.Count)

    version = await IntelligentThresholdTaskVersion(
        task_id=test_threshold_task.id,
        version=0,
        metric_template_value=metric_value,
        n_count=5,
        direction=IntelligentThresholdDirection.UP,
        created_user="test_user",
        updated_user="test_user",
        status=IntelligentThresholdTaskStatus.RUNNING,
        result=None,
    ).insert()
    yield version
    await version.delete()


@pytest_asyncio.fixture
async def test_alarm_sync_record(test_threshold_task):
    """Create a test alarm sync record."""
    record = await AlarmSyncRecord(
        task_id=test_threshold_task.id,
        task_version_id=PydanticObjectId(),
        contact_group_ids=["group1"],
        alert_methods=["email"],
        alarm_level=EventLevel.P1,
        total=5,
        created=5,
        updated=0,
        deleted=0,
        failed=0,
        status=AlarmSyncRecordStatus.INITIALIZED,
        error_message=None,
        webhook=None,
    ).insert()
    yield record
    await record.delete()


@pytest.mark.asyncio
async def test_initialize_auto_refresh_task_with_auto_update_tasks(test_threshold_task):
    """Test initializing auto refresh task with auto_update tasks."""
    # Act
    record = await initialize_auto_refresh_task()

    # Assert
    assert record is not None
    assert record.id is not None
    assert record.status == AutoIntelligentThresholdTaskStatus.PROCESSING
    assert record.task_all is not None
    assert len(record.task_all) >= 1
    assert test_threshold_task.id in record.task_all

    # Verify detail records were created
    detail_records = await AutoIntelligentThresholdTaskRecordDetail.find(
        AutoIntelligentThresholdTaskRecordDetail.auto_intelligent_threshold_task_record_id == record.id
    ).to_list()
    assert len(detail_records) >= 1
    assert detail_records[0].intelligent_threshold_task_id == test_threshold_task.id
    assert detail_records[0].status == AutoIntelligentThresholdTaskDetailStatus.PENDING
    assert detail_records[0].intelligent_threshold_task_status == AutoIntelligentThresholdTaskDetailTaskStatus.PENDING

    # Cleanup
    await record.delete()
    for detail in detail_records:
        await detail.delete()


@pytest.mark.asyncio
async def test_initialize_auto_refresh_task_no_auto_update_tasks(test_threshold_task_no_auto_update):
    """Test initializing auto refresh task with no auto_update tasks."""
    # Act
    record = await initialize_auto_refresh_task()

    # Assert
    assert record is not None
    assert record.status == AutoIntelligentThresholdTaskStatus.COMPLETED
    assert record.task_all is not None
    assert len(record.task_all) == 0

    # Cleanup
    await record.delete()


@pytest.mark.asyncio
async def test_initialize_auto_refresh_task_db_error_with_rollback(test_threshold_task):
    """Test auto refresh task initialization with database error triggers rollback."""
    # Arrange - Mock the insert method to fail
    with patch.object(AutoIntelligentThresholdTaskRecordDetail, "insert", side_effect=Exception("DB Error")):
        # Act & Assert
        with pytest.raises(Exception, match="Failed to initialize auto refresh task"):
            await initialize_auto_refresh_task()


@pytest.mark.asyncio
async def test_rollback_auto_refresh_task_creation():
    """Test rollback of auto refresh task creation."""
    # Arrange
    task_record = await AutoIntelligentThresholdTaskRecord(
        status=AutoIntelligentThresholdTaskStatus.PENDING,
        task_all=[],
    ).insert()

    detail_records = [
        await AutoIntelligentThresholdTaskRecordDetail(
            auto_intelligent_threshold_task_record_id=task_record.id,
            intelligent_threshold_task_id=PydanticObjectId(),
            version=0,
            status=AutoIntelligentThresholdTaskDetailStatus.PENDING,
            intelligent_threshold_task_status=AutoIntelligentThresholdTaskDetailTaskStatus.PENDING,
            alarm_inject_status=AutoIntelligentThresholdTaskAlarmInjectStatus.INITIALIZED,
            created_user="test_user",
            updated_user="test_user",
        ).insert()
    ]

    # Act
    await _rollback_auto_refresh_task_creation(task_record, detail_records)

    # Assert
    deleted_task = await AutoIntelligentThresholdTaskRecord.find_one(
        AutoIntelligentThresholdTaskRecord.id == task_record.id
    )
    assert deleted_task is None

    for detail in detail_records:
        deleted_detail = await AutoIntelligentThresholdTaskRecordDetail.find_one(
            AutoIntelligentThresholdTaskRecordDetail.id == detail.id
        )
        assert deleted_detail is None


@pytest.mark.asyncio
async def test_rollback_with_empty_records():
    """Test rollback with empty records list."""
    # Arrange
    task_record = await AutoIntelligentThresholdTaskRecord(
        status=AutoIntelligentThresholdTaskStatus.PENDING,
        task_all=[],
    ).insert()

    # Act - should not raise
    await _rollback_auto_refresh_task_creation(task_record, [])

    # Assert
    deleted_task = await AutoIntelligentThresholdTaskRecord.find_one(
        AutoIntelligentThresholdTaskRecord.id == task_record.id
    )
    assert deleted_task is None


@pytest.mark.asyncio
async def test_scheduled_process_record_detail_tasks_no_record():
    """Test scheduled processing when no record exists."""
    # Act - should not raise
    await scheduled_process_record_detail_tasks()


@pytest.mark.asyncio
async def test_scheduled_process_record_detail_tasks_with_completed_record(test_threshold_task):
    """Test scheduled processing with completed record."""
    # Arrange
    record = await AutoIntelligentThresholdTaskRecord(
        status=AutoIntelligentThresholdTaskStatus.COMPLETED,
        task_all=[test_threshold_task.id],
    ).insert()

    # Act - should not process
    await scheduled_process_record_detail_tasks()

    # Assert - record should still be completed
    updated_record = await AutoIntelligentThresholdTaskRecord.find_one(
        AutoIntelligentThresholdTaskRecord.id == record.id
    )
    assert updated_record is not None
    assert updated_record.status == AutoIntelligentThresholdTaskStatus.COMPLETED

    # Cleanup
    await record.delete()


@pytest.mark.asyncio
async def test_process_record_detail_tasks_max_iterations():
    """Test process_record_detail_tasks respects max_iterations."""
    # Arrange
    record = await AutoIntelligentThresholdTaskRecord(
        status=AutoIntelligentThresholdTaskStatus.PROCESSING,
        task_all=[],
    ).insert()

    with patch(
        "veaiops.handler.services.intelligent_threshold.auto_refresh_task.process_detail_task_status",
        new_callable=AsyncMock,
    ):
        with patch(
            "veaiops.handler.services.intelligent_threshold.auto_refresh_task.process_detail_alarm_inject_status",
            new_callable=AsyncMock,
        ):
            with patch(
                "veaiops.handler.services.intelligent_threshold.auto_refresh_task.check_and_update_overall_record_status",
                new_callable=AsyncMock,
                return_value=False,  # Keep returning False to test max_iterations
            ):
                # Act - with max_iterations=3 and gap_time=0 for fast testing
                await process_record_detail_tasks(record, max_iterations=3, gap_time=0)

    # Cleanup
    await record.delete()


@pytest.mark.asyncio
async def test_process_detail_task_status_pending_task(test_threshold_task, test_threshold_task_version):
    """Test processing a pending threshold task."""
    # Arrange
    record = await AutoIntelligentThresholdTaskRecord(
        status=AutoIntelligentThresholdTaskStatus.PROCESSING,
        task_all=[test_threshold_task.id],
    ).insert()

    detail_record = await AutoIntelligentThresholdTaskRecordDetail(
        auto_intelligent_threshold_task_record_id=record.id,
        intelligent_threshold_task_id=test_threshold_task.id,
        version=0,
        status=AutoIntelligentThresholdTaskDetailStatus.PENDING,
        intelligent_threshold_task_status=AutoIntelligentThresholdTaskDetailTaskStatus.PENDING,
        alarm_inject_status=AutoIntelligentThresholdTaskAlarmInjectStatus.INITIALIZED,
        created_user="test_user",
        updated_user="test_user",
    ).insert()

    with patch(
        "veaiops.handler.services.intelligent_threshold.auto_refresh_task.call_threshold_agent",
        new_callable=AsyncMock,
    ):
        # Act
        await process_detail_task_status(record)

    # Assert
    updated_detail = await AutoIntelligentThresholdTaskRecordDetail.find_one(
        AutoIntelligentThresholdTaskRecordDetail.id == detail_record.id
    )
    assert updated_detail is not None
    assert updated_detail.status == AutoIntelligentThresholdTaskDetailStatus.PROCESSING
    assert updated_detail.intelligent_threshold_task_status == AutoIntelligentThresholdTaskDetailTaskStatus.PROCESSING
    assert updated_detail.version == 1  # Version should increment

    # Cleanup
    await record.delete()
    await detail_record.delete()


@pytest.mark.asyncio
async def test_process_detail_task_status_processing_task_success(test_threshold_task, test_threshold_task_version):
    """Test processing a task that transitioned to success."""
    # Arrange
    record = await AutoIntelligentThresholdTaskRecord(
        status=AutoIntelligentThresholdTaskStatus.PROCESSING,
        task_all=[test_threshold_task.id],
    ).insert()

    detail_record = await AutoIntelligentThresholdTaskRecordDetail(
        auto_intelligent_threshold_task_record_id=record.id,
        intelligent_threshold_task_id=test_threshold_task.id,
        version=0,
        status=AutoIntelligentThresholdTaskDetailStatus.PROCESSING,
        intelligent_threshold_task_status=AutoIntelligentThresholdTaskDetailTaskStatus.PROCESSING,
        alarm_inject_status=AutoIntelligentThresholdTaskAlarmInjectStatus.INITIALIZED,
        created_user="test_user",
        updated_user="test_user",
    ).insert()

    # Update task version status to SUCCESS
    test_threshold_task_version.status = IntelligentThresholdTaskStatus.SUCCESS
    await test_threshold_task_version.save()

    # Act
    await process_detail_task_status(record)

    # Assert
    updated_detail = await AutoIntelligentThresholdTaskRecordDetail.find_one(
        AutoIntelligentThresholdTaskRecordDetail.id == detail_record.id
    )
    assert updated_detail is not None
    assert updated_detail.intelligent_threshold_task_status == AutoIntelligentThresholdTaskDetailTaskStatus.SUCCESS

    # Cleanup
    await record.delete()
    await detail_record.delete()


@pytest.mark.asyncio
async def test_process_detail_task_status_processing_task_failed(test_threshold_task, test_threshold_task_version):
    """Test processing a task that failed."""
    # Arrange
    record = await AutoIntelligentThresholdTaskRecord(
        status=AutoIntelligentThresholdTaskStatus.PROCESSING,
        task_all=[test_threshold_task.id],
    ).insert()

    detail_record = await AutoIntelligentThresholdTaskRecordDetail(
        auto_intelligent_threshold_task_record_id=record.id,
        intelligent_threshold_task_id=test_threshold_task.id,
        version=0,
        status=AutoIntelligentThresholdTaskDetailStatus.PROCESSING,
        intelligent_threshold_task_status=AutoIntelligentThresholdTaskDetailTaskStatus.PROCESSING,
        alarm_inject_status=AutoIntelligentThresholdTaskAlarmInjectStatus.INITIALIZED,
        created_user="test_user",
        updated_user="test_user",
    ).insert()

    # Update task version status to FAILED
    test_threshold_task_version.status = IntelligentThresholdTaskStatus.FAILED
    await test_threshold_task_version.save()

    # Act
    await process_detail_task_status(record)

    # Assert
    updated_detail = await AutoIntelligentThresholdTaskRecordDetail.find_one(
        AutoIntelligentThresholdTaskRecordDetail.id == detail_record.id
    )
    assert updated_detail is not None
    assert updated_detail.intelligent_threshold_task_status == AutoIntelligentThresholdTaskDetailTaskStatus.FAILED

    # Cleanup
    await record.delete()
    await detail_record.delete()


@pytest.mark.asyncio
async def test_process_detail_task_status_success_with_alarm_record(
    test_threshold_task, test_threshold_task_version, test_alarm_sync_record
):
    """Test processing a successful task with alarm sync record."""
    # Arrange
    record = await AutoIntelligentThresholdTaskRecord(
        status=AutoIntelligentThresholdTaskStatus.PROCESSING,
        task_all=[test_threshold_task.id],
    ).insert()

    detail_record = await AutoIntelligentThresholdTaskRecordDetail(
        auto_intelligent_threshold_task_record_id=record.id,
        intelligent_threshold_task_id=test_threshold_task.id,
        version=0,
        status=AutoIntelligentThresholdTaskDetailStatus.PROCESSING,
        intelligent_threshold_task_status=AutoIntelligentThresholdTaskDetailTaskStatus.SUCCESS,
        alarm_inject_status=AutoIntelligentThresholdTaskAlarmInjectStatus.INITIALIZED,
        created_user="test_user",
        updated_user="test_user",
    ).insert()

    # Act
    await process_detail_task_status(record)

    # Assert
    updated_detail = await AutoIntelligentThresholdTaskRecordDetail.find_one(
        AutoIntelligentThresholdTaskRecordDetail.id == detail_record.id
    )
    assert updated_detail is not None
    assert updated_detail.alarm_inject_status == AutoIntelligentThresholdTaskAlarmInjectStatus.PENDING

    # Cleanup
    await record.delete()
    await detail_record.delete()


@pytest.mark.asyncio
async def test_process_detail_task_status_success_no_alarm_record(test_threshold_task, test_threshold_task_version):
    """Test processing a successful task without alarm sync record."""
    # Arrange
    record = await AutoIntelligentThresholdTaskRecord(
        status=AutoIntelligentThresholdTaskStatus.PROCESSING,
        task_all=[test_threshold_task.id],
    ).insert()

    detail_record = await AutoIntelligentThresholdTaskRecordDetail(
        auto_intelligent_threshold_task_record_id=record.id,
        intelligent_threshold_task_id=test_threshold_task.id,
        version=0,
        status=AutoIntelligentThresholdTaskDetailStatus.PROCESSING,
        intelligent_threshold_task_status=AutoIntelligentThresholdTaskDetailTaskStatus.SUCCESS,
        alarm_inject_status=AutoIntelligentThresholdTaskAlarmInjectStatus.INITIALIZED,
        created_user="test_user",
        updated_user="test_user",
    ).insert()

    # Act
    await process_detail_task_status(record)

    # Assert
    updated_detail = await AutoIntelligentThresholdTaskRecordDetail.find_one(
        AutoIntelligentThresholdTaskRecordDetail.id == detail_record.id
    )
    assert updated_detail is not None
    assert updated_detail.status == AutoIntelligentThresholdTaskDetailStatus.COMPLETED

    # Cleanup
    await record.delete()
    await detail_record.delete()


@pytest.mark.asyncio
async def test_process_detail_alarm_inject_status_pending_alarm(
    test_threshold_task, test_threshold_task_version, test_alarm_sync_record
):
    """Test processing alarm injection for pending alarm status with empty result list."""
    # Arrange - result can be empty list when there are no metrics to sync
    record = await AutoIntelligentThresholdTaskRecord(
        status=AutoIntelligentThresholdTaskStatus.PROCESSING,
        task_all=[test_threshold_task.id],
    ).insert()

    # Create task version with empty results - this is treated as "no results" by the logic
    metric_value = MetricTemplateValue(name="cpu_usage", metric_type=MetricType.Count)

    version = await IntelligentThresholdTaskVersion(
        task_id=test_threshold_task.id,
        version=1,
        metric_template_value=metric_value,
        n_count=5,
        direction=IntelligentThresholdDirection.UP,
        created_user="test_user",
        updated_user="test_user",
        status=IntelligentThresholdTaskStatus.SUCCESS,
        result=[],
    ).insert()

    detail_record = await AutoIntelligentThresholdTaskRecordDetail(
        auto_intelligent_threshold_task_record_id=record.id,
        intelligent_threshold_task_id=test_threshold_task.id,
        version=1,
        status=AutoIntelligentThresholdTaskDetailStatus.PROCESSING,
        intelligent_threshold_task_status=AutoIntelligentThresholdTaskDetailTaskStatus.SUCCESS,
        alarm_inject_status=AutoIntelligentThresholdTaskAlarmInjectStatus.PENDING,
        created_user="test_user",
        updated_user="test_user",
    ).insert()

    # Act
    await process_detail_alarm_inject_status(record)

    # Assert - empty result list is treated as "no results", so status becomes FAILED
    updated_detail = await AutoIntelligentThresholdTaskRecordDetail.find_one(
        AutoIntelligentThresholdTaskRecordDetail.id == detail_record.id
    )
    assert updated_detail is not None
    assert updated_detail.alarm_inject_status == AutoIntelligentThresholdTaskAlarmInjectStatus.FAILED

    # Cleanup
    await record.delete()
    await detail_record.delete()
    await version.delete()


@pytest.mark.asyncio
async def test_process_detail_alarm_inject_status_initialized_alarm():
    """Test processing alarm injection for initialized alarm status (should skip)."""
    # Arrange
    record = await AutoIntelligentThresholdTaskRecord(
        status=AutoIntelligentThresholdTaskStatus.PROCESSING,
        task_all=[],
    ).insert()

    detail_record = await AutoIntelligentThresholdTaskRecordDetail(
        auto_intelligent_threshold_task_record_id=record.id,
        intelligent_threshold_task_id=PydanticObjectId(),
        version=0,
        status=AutoIntelligentThresholdTaskDetailStatus.PROCESSING,
        intelligent_threshold_task_status=AutoIntelligentThresholdTaskDetailTaskStatus.SUCCESS,
        alarm_inject_status=AutoIntelligentThresholdTaskAlarmInjectStatus.INITIALIZED,
        created_user="test_user",
        updated_user="test_user",
    ).insert()

    # Act
    await process_detail_alarm_inject_status(record)

    # Assert
    updated_detail = await AutoIntelligentThresholdTaskRecordDetail.find_one(
        AutoIntelligentThresholdTaskRecordDetail.id == detail_record.id
    )
    assert updated_detail is not None
    # Status should not change
    assert updated_detail.alarm_inject_status == AutoIntelligentThresholdTaskAlarmInjectStatus.INITIALIZED

    # Cleanup
    await record.delete()
    await detail_record.delete()


@pytest.mark.asyncio
async def test_process_detail_alarm_inject_status_success_alarm():
    """Test processing alarm injection that's already successful."""
    # Arrange
    record = await AutoIntelligentThresholdTaskRecord(
        status=AutoIntelligentThresholdTaskStatus.PROCESSING,
        task_all=[],
    ).insert()

    detail_record = await AutoIntelligentThresholdTaskRecordDetail(
        auto_intelligent_threshold_task_record_id=record.id,
        intelligent_threshold_task_id=PydanticObjectId(),
        version=0,
        status=AutoIntelligentThresholdTaskDetailStatus.PROCESSING,
        intelligent_threshold_task_status=AutoIntelligentThresholdTaskDetailTaskStatus.SUCCESS,
        alarm_inject_status=AutoIntelligentThresholdTaskAlarmInjectStatus.SUCCESS,
        created_user="test_user",
        updated_user="test_user",
    ).insert()

    # Act
    await process_detail_alarm_inject_status(record)

    # Assert
    updated_detail = await AutoIntelligentThresholdTaskRecordDetail.find_one(
        AutoIntelligentThresholdTaskRecordDetail.id == detail_record.id
    )
    assert updated_detail is not None
    assert updated_detail.status == AutoIntelligentThresholdTaskDetailStatus.COMPLETED

    # Cleanup
    await record.delete()
    await detail_record.delete()


@pytest.mark.asyncio
async def test_process_detail_alarm_inject_status_failed_alarm():
    """Test processing alarm injection that failed."""
    # Arrange
    record = await AutoIntelligentThresholdTaskRecord(
        status=AutoIntelligentThresholdTaskStatus.PROCESSING,
        task_all=[],
    ).insert()

    detail_record = await AutoIntelligentThresholdTaskRecordDetail(
        auto_intelligent_threshold_task_record_id=record.id,
        intelligent_threshold_task_id=PydanticObjectId(),
        version=0,
        status=AutoIntelligentThresholdTaskDetailStatus.PROCESSING,
        intelligent_threshold_task_status=AutoIntelligentThresholdTaskDetailTaskStatus.SUCCESS,
        alarm_inject_status=AutoIntelligentThresholdTaskAlarmInjectStatus.FAILED,
        created_user="test_user",
        updated_user="test_user",
    ).insert()

    # Act
    await process_detail_alarm_inject_status(record)

    # Assert
    updated_detail = await AutoIntelligentThresholdTaskRecordDetail.find_one(
        AutoIntelligentThresholdTaskRecordDetail.id == detail_record.id
    )
    assert updated_detail is not None
    assert updated_detail.status == AutoIntelligentThresholdTaskDetailStatus.COMPLETED

    # Cleanup
    await record.delete()
    await detail_record.delete()


@pytest.mark.asyncio
async def test_process_detail_alarm_inject_status_missing_task(test_alarm_sync_record):
    """Test processing alarm injection with missing task."""
    # Arrange
    record = await AutoIntelligentThresholdTaskRecord(
        status=AutoIntelligentThresholdTaskStatus.PROCESSING,
        task_all=[],
    ).insert()

    detail_record = await AutoIntelligentThresholdTaskRecordDetail(
        auto_intelligent_threshold_task_record_id=record.id,
        intelligent_threshold_task_id=PydanticObjectId(),  # Non-existent task
        version=0,
        status=AutoIntelligentThresholdTaskDetailStatus.PROCESSING,
        intelligent_threshold_task_status=AutoIntelligentThresholdTaskDetailTaskStatus.SUCCESS,
        alarm_inject_status=AutoIntelligentThresholdTaskAlarmInjectStatus.PENDING,
        created_user="test_user",
        updated_user="test_user",
    ).insert()

    # Act
    await process_detail_alarm_inject_status(record)

    # Assert
    updated_detail = await AutoIntelligentThresholdTaskRecordDetail.find_one(
        AutoIntelligentThresholdTaskRecordDetail.id == detail_record.id
    )
    assert updated_detail is not None
    assert updated_detail.alarm_inject_status == AutoIntelligentThresholdTaskAlarmInjectStatus.FAILED

    # Cleanup
    await record.delete()
    await detail_record.delete()


@pytest.mark.asyncio
async def test_process_detail_alarm_inject_status_missing_version(test_threshold_task, test_alarm_sync_record):
    """Test processing alarm injection with missing task version."""
    # Arrange
    record = await AutoIntelligentThresholdTaskRecord(
        status=AutoIntelligentThresholdTaskStatus.PROCESSING,
        task_all=[test_threshold_task.id],
    ).insert()

    detail_record = await AutoIntelligentThresholdTaskRecordDetail(
        auto_intelligent_threshold_task_record_id=record.id,
        intelligent_threshold_task_id=test_threshold_task.id,
        version=999,  # Non-existent version
        status=AutoIntelligentThresholdTaskDetailStatus.PROCESSING,
        intelligent_threshold_task_status=AutoIntelligentThresholdTaskDetailTaskStatus.SUCCESS,
        alarm_inject_status=AutoIntelligentThresholdTaskAlarmInjectStatus.PENDING,
        created_user="test_user",
        updated_user="test_user",
    ).insert()

    # Act
    await process_detail_alarm_inject_status(record)

    # Assert
    updated_detail = await AutoIntelligentThresholdTaskRecordDetail.find_one(
        AutoIntelligentThresholdTaskRecordDetail.id == detail_record.id
    )
    assert updated_detail is not None
    assert updated_detail.alarm_inject_status == AutoIntelligentThresholdTaskAlarmInjectStatus.FAILED

    # Cleanup
    await record.delete()
    await detail_record.delete()


@pytest.mark.asyncio
async def test_process_detail_alarm_inject_status_no_result(test_threshold_task, test_alarm_sync_record):
    """Test processing alarm injection with task version that has no results."""
    # Arrange
    metric_value = MetricTemplateValue(name="cpu_usage", metric_type=MetricType.Count)

    version = await IntelligentThresholdTaskVersion(
        task_id=test_threshold_task.id,
        version=0,
        metric_template_value=metric_value,
        n_count=5,
        direction=IntelligentThresholdDirection.UP,
        created_user="test_user",
        updated_user="test_user",
        status=IntelligentThresholdTaskStatus.SUCCESS,
        result=None,  # No result
    ).insert()

    record = await AutoIntelligentThresholdTaskRecord(
        status=AutoIntelligentThresholdTaskStatus.PROCESSING,
        task_all=[test_threshold_task.id],
    ).insert()

    detail_record = await AutoIntelligentThresholdTaskRecordDetail(
        auto_intelligent_threshold_task_record_id=record.id,
        intelligent_threshold_task_id=test_threshold_task.id,
        version=0,
        status=AutoIntelligentThresholdTaskDetailStatus.PROCESSING,
        intelligent_threshold_task_status=AutoIntelligentThresholdTaskDetailTaskStatus.SUCCESS,
        alarm_inject_status=AutoIntelligentThresholdTaskAlarmInjectStatus.PENDING,
        created_user="test_user",
        updated_user="test_user",
    ).insert()

    # Act
    await process_detail_alarm_inject_status(record)

    # Assert
    updated_detail = await AutoIntelligentThresholdTaskRecordDetail.find_one(
        AutoIntelligentThresholdTaskRecordDetail.id == detail_record.id
    )
    assert updated_detail is not None
    assert updated_detail.alarm_inject_status == AutoIntelligentThresholdTaskAlarmInjectStatus.FAILED

    # Cleanup
    await record.delete()
    await detail_record.delete()
    await version.delete()


@pytest.mark.asyncio
async def test_process_detail_alarm_inject_status_no_previous_alarm_record(test_threshold_task):
    """Test processing alarm injection when no previous alarm sync record exists."""
    # Arrange
    metric_value = MetricTemplateValue(name="cpu_usage", metric_type=MetricType.Count)

    version = await IntelligentThresholdTaskVersion(
        task_id=test_threshold_task.id,
        version=0,
        metric_template_value=metric_value,
        n_count=5,
        direction=IntelligentThresholdDirection.UP,
        created_user="test_user",
        updated_user="test_user",
        status=IntelligentThresholdTaskStatus.SUCCESS,
        result=[],
    ).insert()

    record = await AutoIntelligentThresholdTaskRecord(
        status=AutoIntelligentThresholdTaskStatus.PROCESSING,
        task_all=[test_threshold_task.id],
    ).insert()

    detail_record = await AutoIntelligentThresholdTaskRecordDetail(
        auto_intelligent_threshold_task_record_id=record.id,
        intelligent_threshold_task_id=test_threshold_task.id,
        version=0,
        status=AutoIntelligentThresholdTaskDetailStatus.PROCESSING,
        intelligent_threshold_task_status=AutoIntelligentThresholdTaskDetailTaskStatus.SUCCESS,
        alarm_inject_status=AutoIntelligentThresholdTaskAlarmInjectStatus.PENDING,
        created_user="test_user",
        updated_user="test_user",
    ).insert()

    # Act
    await process_detail_alarm_inject_status(record)

    # Assert
    updated_detail = await AutoIntelligentThresholdTaskRecordDetail.find_one(
        AutoIntelligentThresholdTaskRecordDetail.id == detail_record.id
    )
    assert updated_detail is not None
    assert updated_detail.alarm_inject_status == AutoIntelligentThresholdTaskAlarmInjectStatus.FAILED

    # Cleanup
    await record.delete()
    await detail_record.delete()
    await version.delete()


@pytest.mark.asyncio
async def test_check_and_update_overall_record_status_all_completed():
    """Test checking overall record status when all details are completed."""
    # Arrange
    record = await AutoIntelligentThresholdTaskRecord(
        status=AutoIntelligentThresholdTaskStatus.PROCESSING,
        task_all=[],
    ).insert()

    detail_record = await AutoIntelligentThresholdTaskRecordDetail(
        auto_intelligent_threshold_task_record_id=record.id,
        intelligent_threshold_task_id=PydanticObjectId(),
        version=0,
        status=AutoIntelligentThresholdTaskDetailStatus.COMPLETED,
        intelligent_threshold_task_status=AutoIntelligentThresholdTaskDetailTaskStatus.SUCCESS,
        alarm_inject_status=AutoIntelligentThresholdTaskAlarmInjectStatus.SUCCESS,
        created_user="test_user",
        updated_user="test_user",
    ).insert()

    # Act
    result = await check_and_update_overall_record_status(record)

    # Assert
    assert result is True

    updated_record = await AutoIntelligentThresholdTaskRecord.find_one(
        AutoIntelligentThresholdTaskRecord.id == record.id
    )
    assert updated_record is not None
    assert updated_record.status == AutoIntelligentThresholdTaskStatus.COMPLETED

    # Cleanup
    await record.delete()
    await detail_record.delete()


@pytest.mark.asyncio
async def test_check_and_update_overall_record_status_still_processing():
    """Test checking overall record status when details still processing."""
    # Arrange
    record = await AutoIntelligentThresholdTaskRecord(
        status=AutoIntelligentThresholdTaskStatus.PROCESSING,
        task_all=[],
    ).insert()

    detail_record = await AutoIntelligentThresholdTaskRecordDetail(
        auto_intelligent_threshold_task_record_id=record.id,
        intelligent_threshold_task_id=PydanticObjectId(),
        version=0,
        status=AutoIntelligentThresholdTaskDetailStatus.PROCESSING,
        intelligent_threshold_task_status=AutoIntelligentThresholdTaskDetailTaskStatus.PROCESSING,
        alarm_inject_status=AutoIntelligentThresholdTaskAlarmInjectStatus.INITIALIZED,
        created_user="test_user",
        updated_user="test_user",
    ).insert()

    # Act
    result = await check_and_update_overall_record_status(record)

    # Assert
    assert result is False

    updated_record = await AutoIntelligentThresholdTaskRecord.find_one(
        AutoIntelligentThresholdTaskRecord.id == record.id
    )
    assert updated_record is not None
    assert updated_record.status == AutoIntelligentThresholdTaskStatus.PROCESSING

    # Cleanup
    await record.delete()
    await detail_record.delete()


@pytest.mark.asyncio
async def test_check_and_update_overall_record_status_empty_record():
    """Test checking overall record status with no detail records."""
    # Arrange
    record = await AutoIntelligentThresholdTaskRecord(
        status=AutoIntelligentThresholdTaskStatus.PROCESSING,
        task_all=[],
    ).insert()

    # Act
    result = await check_and_update_overall_record_status(record)

    # Assert
    assert result is True

    updated_record = await AutoIntelligentThresholdTaskRecord.find_one(
        AutoIntelligentThresholdTaskRecord.id == record.id
    )
    assert updated_record is not None
    assert updated_record.status == AutoIntelligentThresholdTaskStatus.COMPLETED

    # Cleanup
    await record.delete()
