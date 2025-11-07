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

"""Tests for metric template router endpoints."""

import pytest
from beanie import PydanticObjectId

from veaiops.handler.errors.errors import AlreadyExistsError, RecordNotFoundError
from veaiops.handler.routers.apis.v1.datasource.template import (
    create_template,
    delete_template,
    get_template,
    get_templates,
    toggle_template,
    update_template,
)
from veaiops.schema.documents import MetricTemplate
from veaiops.schema.documents.meta.user import User
from veaiops.schema.models.base import ToggleActiveRequest
from veaiops.schema.types import MetricType


def create_sample_template(name: str, metric_type: MetricType, **kwargs) -> MetricTemplate:
    """Helper function to create a MetricTemplate with default values."""
    return MetricTemplate(
        name=name,
        metric_type=metric_type,
        min_step=1.0,
        max_value=100.0,
        min_value=0.0,
        min_violation=1.0,
        min_violation_ratio=0.1,
        normal_range_start=0.0,
        normal_range_end=80.0,
        missing_value=None,
        failure_interval_expectation=3,
        display_unit="percent",
        linear_scale=1.0,
        max_time_gap=300,
        min_ts_length=10,
        is_active=True,
        **kwargs,
    )


@pytest.mark.asyncio
async def test_create_template_success(test_user: User):
    """Test successful metric template creation."""
    # Arrange
    template = create_sample_template(
        name="CPU Usage Template",
        metric_type=MetricType.CPUUsedCore,
    )

    # Act
    response = await create_template(template=template, current_user=test_user)

    # Assert
    assert response.message == "Metric template created successfully"
    created = await MetricTemplate.find_one({"name": template.name, "metric_type": template.metric_type})
    assert created is not None
    assert created.name == "CPU Usage Template"
    assert created.metric_type == MetricType.CPUUsedCore
    assert created.created_user == test_user.username
    assert created.updated_user == test_user.username


@pytest.mark.asyncio
async def test_create_template_already_exists(test_user: User):
    """Test creating a template that already exists."""
    # Arrange
    existing_template = create_sample_template(
        name="Memory Template",
        metric_type=MetricType.MemoryUsedBytes,
        created_user=test_user.username,
        updated_user=test_user.username,
    )
    await existing_template.insert()

    new_template = create_sample_template(
        name="Memory Template",
        metric_type=MetricType.MemoryUsedBytes,
    )

    # Act & Assert
    with pytest.raises(AlreadyExistsError) as exc_info:
        await create_template(template=new_template, current_user=test_user)

    assert "already exists" in str(exc_info.value.detail).lower()


@pytest.mark.asyncio
async def test_get_template_success():
    """Test successful retrieval of a metric template by ID."""
    # Arrange
    template = create_sample_template(
        name="Disk Usage Template",
        metric_type=MetricType.Latency,
    )
    await template.insert()
    assert template.id is not None

    # Act
    response = await get_template(uid=template.id)

    # Assert
    assert response.message == "Metric template retrieved successfully"
    assert response.data is not None
    assert response.data.name == "Disk Usage Template"
    assert response.data.metric_type == MetricType.Latency


@pytest.mark.asyncio
async def test_get_template_not_found():
    """Test retrieving a non-existent template."""
    # Arrange
    fake_id = PydanticObjectId()

    # Act & Assert
    with pytest.raises(RecordNotFoundError) as exc_info:
        await get_template(uid=fake_id)

    assert "not found" in str(exc_info.value.detail).lower()


@pytest.mark.asyncio
async def test_get_templates_success():
    """Test retrieving all metric templates."""
    # Arrange
    template1 = create_sample_template(
        name="Template 1",
        metric_type=MetricType.Count,
    )
    template2 = create_sample_template(
        name="Template 2",
        metric_type=MetricType.Throughput,
    )
    await template1.insert()
    await template2.insert()

    # Act
    response = await get_templates(skip=0, limit=100)

    # Assert
    assert response.message == "Metric templates retrieved successfully"
    assert response.data is not None
    assert len(response.data) >= 2
    template_names = [t.name for t in response.data]
    assert "Template 1" in template_names
    assert "Template 2" in template_names


@pytest.mark.asyncio
async def test_get_templates_with_pagination():
    """Test retrieving templates with pagination."""
    # Arrange
    for i in range(5):
        template = create_sample_template(
            name=f"Template {i}",
            metric_type=MetricType.ErrorRate,
        )
        await template.insert()

    # Act
    response = await get_templates(skip=2, limit=2)

    # Assert
    assert response.message == "Metric templates retrieved successfully"
    assert response.data is not None
    assert len(response.data) <= 2


@pytest.mark.asyncio
async def test_update_template_success(test_user: User):
    """Test successful template update."""
    # Arrange
    template = create_sample_template(
        name="Network Template",
        metric_type=MetricType.SuccessRate,
    )
    await template.insert()
    assert template.id is not None

    update_data = {
        "min_step": 2.0,
        "max_value": 150.0,
    }

    # Act
    response = await update_template(
        template_id=template.id,
        update_data=update_data,
        current_user=test_user,
    )

    # Assert
    assert response.message == "Metric template updated successfully"
    updated = await MetricTemplate.get(template.id)
    assert updated is not None
    assert updated.min_step == 2.0
    assert updated.max_value == 150.0
    assert updated.updated_user == test_user.username
    assert updated.updated_at is not None


@pytest.mark.asyncio
async def test_update_template_not_found(test_user: User):
    """Test updating a non-existent template."""
    # Arrange
    fake_id = PydanticObjectId()
    update_data = {"min_step": 2.0}

    # Act & Assert
    with pytest.raises(RecordNotFoundError) as exc_info:
        await update_template(
            template_id=fake_id,
            update_data=update_data,
            current_user=test_user,
        )

    assert "not found" in str(exc_info.value.detail).lower()


@pytest.mark.asyncio
async def test_update_template_name_conflict(test_user: User):
    """Test updating template with conflicting name and metric_type."""
    # Arrange
    existing_template = create_sample_template(
        name="Existing Template",
        metric_type=MetricType.ErrorCount,
    )
    await existing_template.insert()

    template_to_update = create_sample_template(
        name="Template to Update",
        metric_type=MetricType.FatalErrorCount,
    )
    await template_to_update.insert()
    assert template_to_update.id is not None

    update_data = {
        "name": "Existing Template",
        "metric_type": MetricType.ErrorCount,
    }

    # Act & Assert
    with pytest.raises(AlreadyExistsError) as exc_info:
        await update_template(
            template_id=template_to_update.id,
            update_data=update_data,
            current_user=test_user,
        )

    assert "already exists" in str(exc_info.value.detail).lower()


@pytest.mark.asyncio
async def test_update_template_same_name_allowed(test_user: User):
    """Test updating template with same name (no conflict)."""
    # Arrange
    template = create_sample_template(
        name="Same Name Template",
        metric_type=MetricType.CounterRate,
    )
    await template.insert()
    assert template.id is not None

    update_data = {
        "name": "Same Name Template",
        "min_step": 3.0,
    }

    # Act
    response = await update_template(
        template_id=template.id,
        update_data=update_data,
        current_user=test_user,
    )

    # Assert
    assert response.message == "Metric template updated successfully"
    updated = await MetricTemplate.get(template.id)
    assert updated is not None
    assert updated.min_step == 3.0


@pytest.mark.asyncio
async def test_toggle_template_active():
    """Test toggling template active status."""
    # Arrange
    template = create_sample_template(
        name="Toggle Template",
        metric_type=MetricType.ResourceUtilizationRate,
    )
    await template.insert()
    assert template.id is not None

    request = ToggleActiveRequest(active=False)

    # Act
    response = await toggle_template(uid=template.id, request=request)

    # Assert
    assert "successfully" in response.message.lower()
    updated = await MetricTemplate.get(template.id)
    assert updated is not None
    assert updated.is_active is False


@pytest.mark.asyncio
async def test_toggle_template_not_found():
    """Test toggling non-existent template."""
    # Arrange
    fake_id = PydanticObjectId()
    request = ToggleActiveRequest(active=False)

    # Act & Assert
    with pytest.raises(RecordNotFoundError) as exc_info:
        await toggle_template(uid=fake_id, request=request)

    assert "not found" in str(exc_info.value.detail).lower()


@pytest.mark.asyncio
async def test_delete_template_success():
    """Test successful template deletion."""
    # Arrange
    template = create_sample_template(
        name="Delete Template",
        metric_type=MetricType.LatencySecond,
    )
    await template.insert()
    assert template.id is not None

    # Act
    response = await delete_template(uid=template.id)

    # Assert
    assert "successfully" in response.message.lower()
    deleted = await MetricTemplate.get(template.id)
    assert deleted is None


@pytest.mark.asyncio
async def test_delete_template_not_found():
    """Test deleting a non-existent template."""
    # Arrange
    fake_id = PydanticObjectId()

    # Act & Assert
    with pytest.raises(RecordNotFoundError) as exc_info:
        await delete_template(uid=fake_id)

    assert "not found" in str(exc_info.value.detail).lower()
