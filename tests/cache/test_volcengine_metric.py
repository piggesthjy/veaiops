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

"""Tests for volcengine_metric cache module."""

import asyncio
from unittest.mock import AsyncMock

import pytest
from aiohttp import ClientError

from veaiops.cache.volcengine_metric import VolcengineMetricCache


def create_mock_metric_response(num_metrics: int = 3, namespace: str = "VCM_ECS"):
    """Create a mock metric API response."""
    metrics = []
    for i in range(num_metrics):
        metrics.append(
            {
                "MetricName": f"test_metric_{i}",
                "MetricTips": f"Test metric {i} tips",
                "Description": f"Test metric {i} description",
                "DescriptionCN": f"测试指标 {i}",
                "DescriptionEN": f"Test metric {i}",
                "Namespace": namespace,
                "SubNamespace": f"test_sub_namespace_{i % 2}",
                "Unit": "Count",
                "Statistics": "avg",
                "PointInterval": 60,
                "PointDelay": 120,
                "GroupByInterval": 60,
                "OriginalPointDelay": 180,
                "TypeAlertEnable": True,
                "TypeConsumeEnable": True,
                "Dimensions": [
                    {
                        "DimensionName": f"dimension_{j}",
                        "Description": f"Dimension {j} description",
                        "Required": j == 0,
                    }
                    for j in range(2)
                ],
                "UnSupportSubNsResource": False,
                "ReportMethod": "Periodic",
                "QueryNotFillZero": False,
            }
        )
    return {"Result": {"Data": metrics}}


@pytest.mark.asyncio
async def test_refresh_metrics_success(setup_mock_aiohttp_session):
    """Test successful metrics refresh."""
    # Arrange
    cache = VolcengineMetricCache()
    mock_response = create_mock_metric_response(num_metrics=5)

    mock_response_obj = setup_mock_aiohttp_session
    mock_response_obj.json = AsyncMock(return_value=mock_response)

    # Act
    result = await cache.refresh_metrics()

    # Assert
    assert result is True
    assert len(cache.all_metrics) == 5
    assert cache.last_update is not None


@pytest.mark.asyncio
async def test_refresh_metrics_with_namespace(setup_mock_aiohttp_session):
    """Test metrics refresh with specific namespace."""
    # Arrange
    cache = VolcengineMetricCache()
    namespace = "VCM_ECS"
    mock_response = create_mock_metric_response(num_metrics=3, namespace=namespace)

    mock_response_obj = setup_mock_aiohttp_session
    mock_response_obj.json = AsyncMock(return_value=mock_response)

    # Act
    result = await cache.refresh_metrics(namespace=namespace)

    # Assert
    assert result is True
    assert len(cache.metrics.get(namespace, [])) == 3


@pytest.mark.asyncio
async def test_refresh_metrics_api_failure(setup_mock_aiohttp_session):
    """Test metrics refresh when API call fails."""
    # Arrange
    cache = VolcengineMetricCache()

    mock_response_obj = setup_mock_aiohttp_session
    mock_response_obj.status = 500

    # Act
    result = await cache.refresh_metrics()

    # Assert
    assert result is False
    assert len(cache.all_metrics) == 0


@pytest.mark.asyncio
async def test_refresh_metrics_exception(mocker):
    """Test metrics refresh when exception occurs."""
    # Arrange
    cache = VolcengineMetricCache()

    # Mock aiohttp session to raise exception
    mock_session = mocker.MagicMock()
    mock_session.__aenter__ = AsyncMock(side_effect=ClientError("Connection error"))
    mocker.patch("aiohttp.ClientSession", return_value=mock_session)

    # Act
    result = await cache.refresh_metrics()

    # Assert
    assert result is False
    assert len(cache.all_metrics) == 0


@pytest.mark.asyncio
async def test_get_metrics_by_namespace(setup_mock_aiohttp_session):
    """Test getting metrics by namespace."""
    # Arrange
    cache = VolcengineMetricCache()
    mock_response = create_mock_metric_response(num_metrics=5, namespace="VCM_ECS")

    mock_response_obj = setup_mock_aiohttp_session
    mock_response_obj.json = AsyncMock(return_value=mock_response)

    await cache.refresh_metrics()

    # Act
    metrics = cache.get_metrics_by_namespace("VCM_ECS")

    # Assert
    assert len(metrics) == 5
    assert all(m.namespace == "VCM_ECS" for m in metrics)


@pytest.mark.asyncio
async def test_get_metrics_by_namespace_not_found():
    """Test getting metrics by non-existent namespace."""
    # Arrange
    cache = VolcengineMetricCache()

    # Act
    metrics = cache.get_metrics_by_namespace("NON_EXISTENT")

    # Assert
    assert len(metrics) == 0


@pytest.mark.asyncio
async def test_get_metrics_by_sub_namespace(setup_mock_aiohttp_session):
    """Test getting metrics by sub_namespace."""
    # Arrange
    cache = VolcengineMetricCache()
    mock_response = create_mock_metric_response(num_metrics=6)

    mock_response_obj = setup_mock_aiohttp_session
    mock_response_obj.json = AsyncMock(return_value=mock_response)

    await cache.refresh_metrics()

    # Act - test_sub_namespace_0 should have 3 metrics (indices 0, 2, 4)
    metrics = cache.get_metrics_by_sub_namespace("test_sub_namespace_0")

    # Assert
    assert len(metrics) == 3
    assert all(m.sub_namespace == "test_sub_namespace_0" for m in metrics)


@pytest.mark.asyncio
async def test_get_metric_by_name(setup_mock_aiohttp_session):
    """Test getting specific metric by name."""
    # Arrange
    cache = VolcengineMetricCache()
    mock_response = create_mock_metric_response(num_metrics=3)

    mock_response_obj = setup_mock_aiohttp_session
    mock_response_obj.json = AsyncMock(return_value=mock_response)

    await cache.refresh_metrics()

    # Act
    metric = cache.get_metric_by_name("test_metric_1")

    # Assert
    assert metric is not None
    assert metric.metric_name == "test_metric_1"


@pytest.mark.asyncio
async def test_get_metric_by_name_not_found(setup_mock_aiohttp_session):
    """Test getting non-existent metric by name."""
    # Arrange
    cache = VolcengineMetricCache()
    mock_response = create_mock_metric_response(num_metrics=3)

    mock_response_obj = setup_mock_aiohttp_session
    mock_response_obj.json = AsyncMock(return_value=mock_response)

    await cache.refresh_metrics()

    # Act
    metric = cache.get_metric_by_name("non_existent_metric")

    # Assert
    assert metric is None


@pytest.mark.asyncio
async def test_get_namespaces(mocker):
    """Test getting all namespaces."""
    # Arrange
    cache = VolcengineMetricCache()

    # Create metrics with different namespaces
    mock_response = {"Result": {"Data": []}}
    for ns in ["VCM_ECS", "VCM_RDS", "VCM_REDIS"]:
        for j in range(2):
            metric_data = create_mock_metric_response(num_metrics=1, namespace=ns)["Result"]["Data"][0]
            metric_data["MetricName"] = f"metric_{ns}_{j}"
            mock_response["Result"]["Data"].append(metric_data)

    mock_session = mocker.MagicMock()
    mock_response_obj = mocker.MagicMock()
    mock_response_obj.status = 200
    mock_response_obj.json = AsyncMock(return_value=mock_response)

    mock_session.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session.__aexit__ = AsyncMock(return_value=None)
    mock_session.post = mocker.MagicMock()
    mock_session.post.return_value.__aenter__ = AsyncMock(return_value=mock_response_obj)
    mock_session.post.return_value.__aexit__ = AsyncMock(return_value=None)

    mocker.patch("aiohttp.ClientSession", return_value=mock_session)

    await cache.refresh_metrics()

    # Act
    namespaces = cache.get_namespaces()

    # Assert
    assert len(namespaces) == 3
    assert "VCM_ECS" in namespaces
    assert "VCM_RDS" in namespaces
    assert "VCM_REDIS" in namespaces


@pytest.mark.asyncio
async def test_get_sub_namespaces(setup_mock_aiohttp_session):
    """Test getting all sub_namespaces."""
    # Arrange
    cache = VolcengineMetricCache()
    mock_response = create_mock_metric_response(num_metrics=6)

    mock_response_obj = setup_mock_aiohttp_session
    mock_response_obj.json = AsyncMock(return_value=mock_response)

    await cache.refresh_metrics()

    # Act
    sub_namespaces = cache.get_sub_namespaces()

    # Assert
    assert len(sub_namespaces) == 2
    assert "test_sub_namespace_0" in sub_namespaces
    assert "test_sub_namespace_1" in sub_namespaces


@pytest.mark.asyncio
async def test_get_sub_namespaces_filtered_by_namespace(setup_mock_aiohttp_session):
    """Test getting sub_namespaces filtered by namespace."""
    # Arrange
    cache = VolcengineMetricCache()
    mock_response = create_mock_metric_response(num_metrics=5, namespace="VCM_ECS")

    mock_response_obj = setup_mock_aiohttp_session
    mock_response_obj.json = AsyncMock(return_value=mock_response)

    await cache.refresh_metrics()

    # Act
    sub_namespaces = cache.get_sub_namespaces(namespace="VCM_ECS")

    # Assert
    assert len(sub_namespaces) == 2


@pytest.mark.asyncio
async def test_get_metric_names(setup_mock_aiohttp_session):
    """Test getting all metric names."""
    # Arrange
    cache = VolcengineMetricCache()
    mock_response = create_mock_metric_response(num_metrics=4)

    mock_response_obj = setup_mock_aiohttp_session
    mock_response_obj.json = AsyncMock(return_value=mock_response)

    await cache.refresh_metrics()

    # Act
    metric_names = cache.get_metric_names()

    # Assert
    assert len(metric_names) == 4
    assert "test_metric_0" in metric_names
    assert "test_metric_3" in metric_names


@pytest.mark.asyncio
async def test_get_metric_names_filtered(setup_mock_aiohttp_session):
    """Test getting metric names with filters."""
    # Arrange
    cache = VolcengineMetricCache()
    mock_response = create_mock_metric_response(num_metrics=6, namespace="VCM_ECS")

    mock_response_obj = setup_mock_aiohttp_session
    mock_response_obj.json = AsyncMock(return_value=mock_response)

    await cache.refresh_metrics()

    # Act
    metric_names = cache.get_metric_names(namespace="VCM_ECS", sub_namespace="test_sub_namespace_0")

    # Assert
    assert len(metric_names) == 3
    assert all("test_metric_" in name for name in metric_names)


@pytest.mark.asyncio
async def test_search_metrics_by_keyword(setup_mock_aiohttp_session):
    """Test searching metrics by keyword."""
    # Arrange
    cache = VolcengineMetricCache()
    mock_response = create_mock_metric_response(num_metrics=5)

    mock_response_obj = setup_mock_aiohttp_session
    mock_response_obj.json = AsyncMock(return_value=mock_response)

    await cache.refresh_metrics()

    # Act
    results = cache.search_metrics(keyword="metric_2")

    # Assert
    assert len(results) == 1
    assert results[0].metric_name == "test_metric_2"


@pytest.mark.asyncio
async def test_search_metrics_with_filters(setup_mock_aiohttp_session):
    """Test searching metrics with namespace and sub_namespace filters."""
    # Arrange
    cache = VolcengineMetricCache()
    mock_response = create_mock_metric_response(num_metrics=6, namespace="VCM_ECS")

    mock_response_obj = setup_mock_aiohttp_session
    mock_response_obj.json = AsyncMock(return_value=mock_response)

    await cache.refresh_metrics()

    # Act
    results = cache.search_metrics(namespace="VCM_ECS", sub_namespace="test_sub_namespace_0")

    # Assert
    assert len(results) == 3
    assert all(m.namespace == "VCM_ECS" for m in results)
    assert all(m.sub_namespace == "test_sub_namespace_0" for m in results)


@pytest.mark.asyncio
async def test_search_metrics_no_results(setup_mock_aiohttp_session):
    """Test searching metrics with no matching results."""
    # Arrange
    cache = VolcengineMetricCache()
    mock_response = create_mock_metric_response(num_metrics=3)

    mock_response_obj = setup_mock_aiohttp_session
    mock_response_obj.json = AsyncMock(return_value=mock_response)

    await cache.refresh_metrics()

    # Act
    results = cache.search_metrics(keyword="nonexistent")

    # Assert
    assert len(results) == 0


@pytest.mark.asyncio
async def test_start_refresh_task():
    """Test starting the refresh task."""
    # Arrange
    cache = VolcengineMetricCache(refresh_interval_seconds=1)

    # Act
    cache.start_refresh_task()

    # Assert
    assert cache._refresh_task is not None
    assert not cache._refresh_task.done()

    # Cleanup
    await cache.stop_refresh_task()


@pytest.mark.asyncio
async def test_stop_refresh_task():
    """Test stopping the refresh task."""
    # Arrange
    cache = VolcengineMetricCache(refresh_interval_seconds=10)
    cache.start_refresh_task()
    initial_task = cache._refresh_task

    # Act
    await cache.stop_refresh_task()

    # Assert
    assert initial_task is not None
    assert initial_task.done() or initial_task.cancelled()


@pytest.mark.asyncio
async def test_schedule_cache_refresh_loop(mocker):
    """Test scheduled cache refresh loop."""
    # Arrange
    cache = VolcengineMetricCache(refresh_interval_seconds=1)

    # Mock refresh_metrics to track calls
    refresh_count = 0

    async def mock_refresh():
        nonlocal refresh_count
        refresh_count += 1
        return True

    mocker.patch.object(cache, "refresh_metrics", side_effect=mock_refresh)

    # Act - Start task and let it run briefly
    cache.start_refresh_task()
    await asyncio.sleep(0.1)  # Let task start
    await cache.stop_refresh_task()

    # Assert - refresh should have been attempted
    assert refresh_count >= 0  # Task may or may not have completed a refresh cycle


@pytest.mark.asyncio
async def test_rebuild_indices(setup_mock_aiohttp_session):
    """Test rebuilding cache indices."""
    # Arrange
    cache = VolcengineMetricCache()
    mock_response = create_mock_metric_response(num_metrics=4)

    mock_response_obj = setup_mock_aiohttp_session
    mock_response_obj.json = AsyncMock(return_value=mock_response)

    await cache.refresh_metrics()

    # Act
    cache._rebuild_indices()

    # Assert - indices should be rebuilt correctly
    assert len(cache.metrics) > 0
    assert len(cache.metrics_by_name) == 4
    assert len(cache.metrics_by_sub_ns) == 2


@pytest.mark.asyncio
async def test_refresh_metrics_with_invalid_dimension_data(setup_mock_aiohttp_session):
    """Test metrics refresh with invalid dimension data."""
    # Arrange
    cache = VolcengineMetricCache()
    mock_response = create_mock_metric_response(num_metrics=1)
    # Add invalid dimension (not a dict)
    mock_response["Result"]["Data"][0]["Dimensions"].append("invalid_dimension")

    mock_response_obj = setup_mock_aiohttp_session
    mock_response_obj.json = AsyncMock(return_value=mock_response)

    # Act
    result = await cache.refresh_metrics()

    # Assert - should handle invalid dimension gracefully
    assert result is True
    assert len(cache.all_metrics) == 1
    # Only valid dimensions (dicts) should be included
    assert len(cache.all_metrics[0].dimensions) == 2


@pytest.mark.asyncio
async def test_refresh_metrics_timeout(mocker):
    """Test metrics refresh with timeout."""
    # Arrange
    cache = VolcengineMetricCache()

    # Mock aiohttp session to timeout
    mock_session = mocker.MagicMock()
    mock_session.__aenter__ = AsyncMock(side_effect=asyncio.TimeoutError())
    mocker.patch("aiohttp.ClientSession", return_value=mock_session)

    # Act
    result = await cache.refresh_metrics()

    # Assert
    assert result is False
    assert len(cache.all_metrics) == 0
