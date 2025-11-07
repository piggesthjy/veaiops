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

from datetime import datetime, timezone

import pytest
import pytest_asyncio

from veaiops.handler.services.intelligent_threshold.task import (
    delete_task,
    list_task_versions,
    list_tasks,
    update_task_result,
)
from veaiops.schema.documents import IntelligentThresholdTask, IntelligentThresholdTaskVersion
from veaiops.schema.models.base import TimeRange
from veaiops.schema.types import DataSourceType, IntelligentThresholdTaskStatus


@pytest_asyncio.fixture
async def test_threshold_task(test_connect):
    """Create a test intelligent threshold task."""
    task = await IntelligentThresholdTask(
        task_name="Test Threshold Task",
        datasource_id=test_connect.id,
        datasource_type=DataSourceType.Aliyun,
        auto_update=False,
        projects=["test_project"],
        is_active=True,
    ).insert()
    yield task
    # Note: Will be cleaned up if not already deleted


@pytest_asyncio.fixture
async def test_threshold_task_version(test_threshold_task):
    """Create a test task version."""
    from veaiops.schema.models.template.metric import MetricTemplateValue
    from veaiops.schema.types import IntelligentThresholdDirection, MetricType

    metric_value = MetricTemplateValue(
        name="cpu_usage",
        metric_type=MetricType.Count,
        max_value=100.0,
    )
    version = await IntelligentThresholdTaskVersion(
        task_id=test_threshold_task.id,
        metric_template_value=metric_value,
        n_count=2,
        direction=IntelligentThresholdDirection.UP,
        version=1,
        status=IntelligentThresholdTaskStatus.LAUNCHING,
        result=[],
    ).insert()
    yield version
    # Note: Will be cleaned up if not already deleted


@pytest.mark.asyncio
async def test_list_tasks_no_filter(test_threshold_task):
    """Test listing all tasks without filters."""
    # Act
    tasks, total = await list_tasks()

    # Assert
    assert total >= 1
    found = any(t.id == test_threshold_task.id for t in tasks)
    assert found


@pytest.mark.asyncio
async def test_list_tasks_with_project_filter(test_threshold_task):
    """Test listing tasks filtered by project."""
    # Act
    tasks, total = await list_tasks(projects=["test_project"])

    # Assert
    assert total >= 1
    found = any(t.id == test_threshold_task.id for t in tasks)
    assert found


@pytest.mark.asyncio
async def test_list_tasks_with_datasource_type_filter(test_threshold_task):
    """Test listing tasks filtered by datasource type."""
    # Act
    tasks, total = await list_tasks(datasource_type=DataSourceType.Aliyun)

    # Assert
    assert total >= 1
    found = any(t.id == test_threshold_task.id for t in tasks)
    assert found


@pytest.mark.asyncio
async def test_list_tasks_with_auto_update_filter(test_threshold_task):
    """Test listing tasks filtered by auto_update status."""
    # Act
    tasks, total = await list_tasks(auto_update=False)

    # Assert
    assert total >= 1
    found = any(t.id == test_threshold_task.id for t in tasks)
    assert found


@pytest.mark.asyncio
async def test_list_tasks_with_name_filter(test_threshold_task):
    """Test listing tasks with task name filter."""
    # Act
    tasks, total = await list_tasks(task_name="Test Threshold")

    # Assert
    assert total >= 1
    found = any(t.id == test_threshold_task.id for t in tasks)
    assert found


@pytest.mark.asyncio
async def test_list_tasks_pagination():
    """Test pagination in list_tasks."""
    # Act
    page1, total1 = await list_tasks(skip=0, limit=5)
    page2, total2 = await list_tasks(skip=5, limit=5)

    # Assert
    assert total1 == total2
    assert len(page1) <= 5
    assert len(page2) <= 5


@pytest.mark.asyncio
async def test_list_tasks_with_created_at_range(test_threshold_task):
    """Test listing tasks with created_at time range filter."""
    # Arrange
    now = datetime.now(timezone.utc)
    past = datetime(2020, 1, 1, tzinfo=timezone.utc)

    time_range = TimeRange(
        start_time=int(past.timestamp()),
        end_time=int(now.timestamp()) + 3600,
    )

    # Act
    tasks, total = await list_tasks(created_at_range=time_range)

    # Assert
    assert total >= 1
    found = any(t.id == test_threshold_task.id for t in tasks)
    assert found


@pytest.mark.asyncio
async def test_list_tasks_empty_project_filter():
    """Test listing tasks with non-matching project filter."""
    # Act
    tasks, total = await list_tasks(projects=["non_existent_project_xyz123"])

    # Assert
    assert total == 0
    assert len(tasks) == 0


@pytest.mark.asyncio
async def test_delete_task(test_threshold_task):
    """Test deleting a task."""
    # Arrange
    task_id = test_threshold_task.id

    # Act
    result = await delete_task(task_id)

    # Assert
    assert result is True

    # Verify task is deleted
    deleted_task = await IntelligentThresholdTask.get(task_id)
    assert deleted_task is None


@pytest.mark.asyncio
async def test_delete_task_with_versions(test_threshold_task, test_threshold_task_version):
    """Test deleting a task that has versions."""
    # Arrange
    task_id = test_threshold_task.id
    version_id = test_threshold_task_version.id

    # Act
    result = await delete_task(task_id)

    # Assert
    assert result is True

    # Verify task and version are deleted
    deleted_task = await IntelligentThresholdTask.get(task_id)
    deleted_version = await IntelligentThresholdTaskVersion.get(version_id)
    assert deleted_task is None
    assert deleted_version is None


@pytest.mark.asyncio
async def test_delete_task_not_found():
    """Test deleting a non-existent task."""
    from beanie import PydanticObjectId

    from veaiops.handler.errors import RecordNotFoundError

    # Act & Assert
    with pytest.raises(RecordNotFoundError, match="not found"):
        await delete_task(PydanticObjectId())


@pytest.mark.asyncio
async def test_update_task_result(test_threshold_task, test_threshold_task_version):
    """Test updating a task result."""
    # Act
    updated = await update_task_result(
        task_id=test_threshold_task.id,
        status=IntelligentThresholdTaskStatus.SUCCESS,
        task_version=1,
        result=[],
    )

    # Assert
    assert updated.status == IntelligentThresholdTaskStatus.SUCCESS
    assert updated.updated_at is not None

    # Cleanup
    await test_threshold_task_version.delete()
    await test_threshold_task.delete()


@pytest.mark.asyncio
async def test_update_task_result_not_found(test_threshold_task):
    """Test updating result for non-existent version."""
    from veaiops.handler.errors import RecordNotFoundError

    # Act & Assert
    with pytest.raises(RecordNotFoundError, match="not found"):
        await update_task_result(
            task_id=test_threshold_task.id,
            status=IntelligentThresholdTaskStatus.SUCCESS,
            task_version=999,
        )

    # Cleanup
    await test_threshold_task.delete()


@pytest.mark.asyncio
async def test_list_task_versions(test_threshold_task, test_threshold_task_version):
    """Test listing task versions."""
    # Act
    versions, total = await list_task_versions(test_threshold_task.id)

    # Assert
    assert total >= 1
    found = any(v.id == test_threshold_task_version.id for v in versions)
    assert found

    # Cleanup
    await test_threshold_task_version.delete()
    await test_threshold_task.delete()


@pytest.mark.asyncio
async def test_list_task_versions_with_status_filter(test_threshold_task, test_threshold_task_version):
    """Test listing task versions with status filter."""
    # Act
    versions, total = await list_task_versions(
        test_threshold_task.id,
        status=IntelligentThresholdTaskStatus.LAUNCHING,
    )

    # Assert
    assert total >= 1
    found = any(v.id == test_threshold_task_version.id for v in versions)
    assert found

    # Cleanup
    await test_threshold_task_version.delete()
    await test_threshold_task.delete()


@pytest.mark.asyncio
async def test_list_task_versions_pagination(test_threshold_task):
    """Test pagination in list_task_versions."""
    # Act
    page1, total1 = await list_task_versions(test_threshold_task.id, skip=0, limit=5)
    page2, total2 = await list_task_versions(test_threshold_task.id, skip=5, limit=5)

    # Assert
    assert total1 == total2
    assert len(page1) <= 5
    assert len(page2) <= 5

    # Cleanup
    await test_threshold_task.delete()


@pytest.mark.asyncio
async def test_list_task_versions_empty():
    """Test listing versions for task with no versions."""
    from beanie import PydanticObjectId

    # Arrange - create task without versions
    task = await IntelligentThresholdTask(
        task_name="No Versions Task",
        datasource_id=PydanticObjectId(),
        datasource_type=DataSourceType.Aliyun,
        auto_update=False,
        projects=[],
        is_active=True,
    ).insert()

    # Act
    versions, total = await list_task_versions(task.id)

    # Assert
    assert total == 0
    assert len(versions) == 0

    # Cleanup
    await task.delete()


@pytest.mark.asyncio
async def test_list_tasks_with_multiple_filters(test_threshold_task):
    """Test list_tasks with multiple filters applied."""
    # Act
    tasks, total = await list_tasks(
        projects=["test_project"],
        datasource_type=DataSourceType.Aliyun,
        auto_update=False,
        task_name="Test Threshold",
    )

    # Assert
    assert total >= 1
    found = any(t.id == test_threshold_task.id for t in tasks)
    assert found


@pytest.mark.asyncio
async def test_update_task_result_updates_status(test_threshold_task, test_threshold_task_version):
    """Test that update_task_result correctly updates the status field."""
    # Arrange
    from veaiops.schema.types import IntelligentThresholdTaskStatus

    # Act
    updated_version = await update_task_result(
        test_threshold_task.id,
        IntelligentThresholdTaskStatus.LAUNCHING,
        test_threshold_task_version.version,
    )

    # Assert
    assert updated_version is not None
    assert updated_version.status == IntelligentThresholdTaskStatus.LAUNCHING
