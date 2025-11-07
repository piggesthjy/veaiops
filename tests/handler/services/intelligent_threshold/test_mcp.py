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

"""Tests for intelligent threshold mcp service."""

import pytest

from veaiops.handler.services.intelligent_threshold.mcp import call_threshold_agent
from veaiops.schema.types import TaskPriority


@pytest.mark.asyncio
async def test_call_threshold_agent_basic(mocker, mock_async_http_client):
    """Test calling threshold agent with basic parameters."""
    # Mock AsyncClientWithCtx using the factory fixture
    mock_response = mocker.MagicMock()
    mock_response.raise_for_status = mocker.MagicMock()
    mock_client = mock_async_http_client(response=mock_response)

    mocker.patch(
        "veaiops.handler.services.intelligent_threshold.mcp.AsyncClientWithCtx",
        return_value=mock_client,
    )

    from beanie import PydanticObjectId

    task_id = PydanticObjectId()
    task_version = 1
    datasource_id = "datasource123"
    metric_template_value = {"metric": "cpu_usage"}
    n_count = 5
    direction = "up"

    # Act
    await call_threshold_agent(
        task_id=task_id,
        task_version=task_version,
        datasource_id=datasource_id,
        metric_template_value=metric_template_value,
        n_count=n_count,
        direction=direction,
    )

    # Assert
    mock_client.post.assert_called_once()
    mock_response.raise_for_status.assert_called_once()


@pytest.mark.asyncio
async def test_call_threshold_agent_with_priority(mocker, mock_async_http_client):
    """Test calling threshold agent with custom priority."""
    # Mock AsyncClientWithCtx using the factory fixture
    mock_response = mocker.MagicMock()
    mock_response.raise_for_status = mocker.MagicMock()
    mock_client = mock_async_http_client(response=mock_response)

    mocker.patch(
        "veaiops.handler.services.intelligent_threshold.mcp.AsyncClientWithCtx",
        return_value=mock_client,
    )

    from beanie import PydanticObjectId

    task_id = PydanticObjectId()

    # Act
    await call_threshold_agent(
        task_id=task_id,
        task_version=2,
        datasource_id="datasource456",
        metric_template_value={"metric": "memory_usage"},
        n_count=10,
        direction="down",
        task_priority=TaskPriority.HIGH,
    )

    # Assert
    mock_client.post.assert_called_once()
    call_args = mock_client.post.call_args
    assert call_args is not None
    assert "json" in call_args.kwargs
    assert call_args.kwargs["json"]["task_priority"] == TaskPriority.HIGH


@pytest.mark.asyncio
async def test_call_threshold_agent_default_priority(mocker, mock_async_http_client):
    """Test calling threshold agent uses default NORMAL priority."""
    # Mock AsyncClientWithCtx using the factory fixture
    mock_response = mocker.MagicMock()
    mock_response.raise_for_status = mocker.MagicMock()
    mock_client = mock_async_http_client(response=mock_response)

    mocker.patch(
        "veaiops.handler.services.intelligent_threshold.mcp.AsyncClientWithCtx",
        return_value=mock_client,
    )

    from beanie import PydanticObjectId

    task_id = PydanticObjectId()

    # Act
    await call_threshold_agent(
        task_id=task_id,
        task_version=1,
        datasource_id="datasource789",
        metric_template_value={"metric": "disk_usage"},
        n_count=3,
        direction="up",
    )

    # Assert
    mock_client.post.assert_called_once()
    call_args = mock_client.post.call_args
    assert call_args is not None
    assert "json" in call_args.kwargs
    assert call_args.kwargs["json"]["task_priority"] == TaskPriority.NORMAL
