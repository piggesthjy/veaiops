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

"""Tests for cache lifespan management."""

import asyncio

import aiohttp
import pytest

from veaiops.cache import VolcengineMetricCache, VolcengineProductCache
from veaiops.lifespan.cache import cache_lifespan, graceful_shutdown, volcengine_metric_cache, volcengine_product_cache


@pytest.mark.asyncio
async def test_volcengine_product_cache_initialization():
    """Test volcengine product cache can be initialized."""
    cache = VolcengineProductCache(refresh_interval_seconds=10)
    assert cache.products == []
    assert cache.last_update is None
    assert cache._refresh_task is None
    assert cache.refresh_interval_seconds == 10


@pytest.mark.asyncio
async def test_volcengine_metric_cache_initialization():
    """Test volcengine metric cache can be initialized."""
    cache = VolcengineMetricCache(refresh_interval_seconds=10)
    assert cache.metrics == {}
    assert cache.metrics_by_name == {}
    assert cache.metrics_by_sub_ns == {}
    assert cache.all_metrics == []
    assert cache.last_update is None
    assert cache._refresh_task is None
    assert cache.refresh_interval_seconds == 10


@pytest.mark.asyncio
async def test_product_cache_refresh_success(monkeypatch, mock_aiohttp_session, mock_volcengine_product_data):
    """Test successful product cache refresh."""
    cache = VolcengineProductCache(refresh_interval_seconds=10)

    # Mock aiohttp.ClientSession
    session = mock_aiohttp_session([{"status": 200, "json_data": mock_volcengine_product_data}])
    monkeypatch.setattr("aiohttp.ClientSession", lambda timeout: session)

    await cache.refresh_products()

    assert len(cache.products) == 3
    assert cache.last_update is not None
    assert cache.products[0].namespace == "VCM_ECS"
    assert cache.products[0].description == "Elastic Compute Service"
    assert cache.products[0].type_name == "ECS"
    assert cache.products[0].type_id == "ecs_type_001"


@pytest.mark.asyncio
async def test_product_cache_refresh_http_error(monkeypatch, mock_aiohttp_session):
    """Test product cache refresh handles HTTP errors."""
    cache = VolcengineProductCache(refresh_interval_seconds=10)

    # Mock HTTP error
    session = mock_aiohttp_session([{"status": 500, "raise_error": aiohttp.ClientError("Server error")}])
    monkeypatch.setattr("aiohttp.ClientSession", lambda timeout: session)

    with pytest.raises(Exception, match="Failed to refresh product data"):
        await cache.refresh_products()

    assert len(cache.products) == 0
    assert cache.last_update is None


@pytest.mark.asyncio
async def test_product_cache_refresh_timeout(monkeypatch):
    """Test product cache refresh handles timeout."""
    cache = VolcengineProductCache(refresh_interval_seconds=10)

    async def mock_timeout_session(*args, **kwargs):
        raise asyncio.TimeoutError("Request timeout")

    # Mock aiohttp.ClientSession to raise TimeoutError
    class MockSessionContext:
        async def __aenter__(self):
            raise asyncio.TimeoutError("Request timeout")

        async def __aexit__(self, exc_type, exc_val, exc_tb):
            pass

    monkeypatch.setattr("aiohttp.ClientSession", lambda timeout: MockSessionContext())

    with pytest.raises(Exception, match="Failed to refresh product data"):
        await cache.refresh_products()


@pytest.mark.asyncio
async def test_product_cache_get_products():
    """Test getting product list from cache."""
    cache = VolcengineProductCache(refresh_interval_seconds=10)

    # Manually add products
    from veaiops.cache.volcengine_product import VolcengineMetricProduct

    cache.products = [
        VolcengineMetricProduct(
            namespace="VCM_ECS", description="Elastic Compute Service", type_name="ECS", type_id="ecs_001"
        )
    ]

    products = cache.get_products()
    assert len(products) == 1
    assert products[0].namespace == "VCM_ECS"


@pytest.mark.asyncio
async def test_product_cache_get_products_dict():
    """Test getting product dictionary from cache."""
    cache = VolcengineProductCache(refresh_interval_seconds=10)

    from veaiops.cache.volcengine_product import VolcengineMetricProduct

    cache.products = [
        VolcengineMetricProduct(
            namespace="VCM_ECS", description="Elastic Compute Service", type_name="ECS", type_id="ecs_001"
        ),
        VolcengineMetricProduct(
            namespace="VCM_RDS", description="Relational Database Service", type_name="RDS", type_id="rds_001"
        ),
    ]

    products_dict = cache.get_products_dict()
    assert len(products_dict) == 2
    assert "VCM_ECS" in products_dict
    assert products_dict["VCM_ECS"]["description"] == "Elastic Compute Service"
    assert products_dict["VCM_RDS"]["type"] == "RDS"


@pytest.mark.asyncio
async def test_product_cache_start_and_stop_refresh_task():
    """Test starting and stopping product cache refresh task."""
    cache = VolcengineProductCache(refresh_interval_seconds=1)

    # Start task
    cache.start_refresh_task()
    assert cache._refresh_task is not None
    assert not cache._refresh_task.done()

    # Give it a moment to start
    await asyncio.sleep(0.1)

    # Stop task
    await cache.stop_refresh_task()
    assert cache._refresh_task.done()


@pytest.mark.asyncio
async def test_metric_cache_refresh_success(monkeypatch, mock_aiohttp_session, mock_volcengine_metric_data):
    """Test successful metric cache refresh."""
    cache = VolcengineMetricCache(refresh_interval_seconds=10)

    # Mock aiohttp.ClientSession
    session = mock_aiohttp_session([{"status": 200, "json_data": mock_volcengine_metric_data}])
    monkeypatch.setattr("aiohttp.ClientSession", lambda timeout: session)

    result = await cache.refresh_metrics()

    assert result is True
    assert len(cache.all_metrics) == 3
    assert cache.last_update is not None
    assert "VCM_ECS" in cache.metrics
    assert len(cache.metrics["VCM_ECS"]) == 3


@pytest.mark.asyncio
async def test_metric_cache_refresh_with_namespace(monkeypatch, mock_aiohttp_session, mock_volcengine_metric_data):
    """Test metric cache refresh with specific namespace."""
    cache = VolcengineMetricCache(refresh_interval_seconds=10)

    # Mock aiohttp.ClientSession
    session = mock_aiohttp_session([{"status": 200, "json_data": mock_volcengine_metric_data}])
    monkeypatch.setattr("aiohttp.ClientSession", lambda timeout: session)

    result = await cache.refresh_metrics(namespace="VCM_ECS")

    assert result is True
    assert len(cache.metrics["VCM_ECS"]) == 3


@pytest.mark.asyncio
async def test_metric_cache_refresh_http_error(monkeypatch, mock_aiohttp_session):
    """Test metric cache refresh handles HTTP errors."""
    cache = VolcengineMetricCache(refresh_interval_seconds=10)

    # Mock HTTP 500 error
    session = mock_aiohttp_session([{"status": 500, "json_data": {}}])
    monkeypatch.setattr("aiohttp.ClientSession", lambda timeout: session)

    result = await cache.refresh_metrics()

    assert result is False
    assert len(cache.all_metrics) == 0


@pytest.mark.asyncio
async def test_metric_cache_rebuild_indices(monkeypatch, mock_aiohttp_session, mock_volcengine_metric_data):
    """Test metric cache indices are properly rebuilt."""
    cache = VolcengineMetricCache(refresh_interval_seconds=10)

    # Mock aiohttp.ClientSession
    session = mock_aiohttp_session([{"status": 200, "json_data": mock_volcengine_metric_data}])
    monkeypatch.setattr("aiohttp.ClientSession", lambda timeout: session)

    await cache.refresh_metrics()

    # Check indices
    assert "CpuUtil" in cache.metrics_by_name
    assert cache.metrics_by_name["CpuUtil"].metric_name == "CpuUtil"
    assert "Instance" in cache.metrics_by_sub_ns
    assert len(cache.metrics_by_sub_ns["Instance"]) == 3


@pytest.mark.asyncio
async def test_metric_cache_start_and_stop_refresh_task():
    """Test starting and stopping metric cache refresh task."""
    cache = VolcengineMetricCache(refresh_interval_seconds=1)

    # Start task
    cache.start_refresh_task()
    assert cache._refresh_task is not None
    assert not cache._refresh_task.done()

    # Give it a moment to start
    await asyncio.sleep(0.1)

    # Stop task
    await cache.stop_refresh_task()
    assert cache._refresh_task.done()


@pytest.mark.asyncio
async def test_metric_cache_dimension_parsing(monkeypatch, mock_aiohttp_session, mock_volcengine_metric_data):
    """Test metric cache properly parses dimensions."""
    cache = VolcengineMetricCache(refresh_interval_seconds=10)

    # Mock aiohttp.ClientSession
    session = mock_aiohttp_session([{"status": 200, "json_data": mock_volcengine_metric_data}])
    monkeypatch.setattr("aiohttp.ClientSession", lambda timeout: session)

    await cache.refresh_metrics()

    # Check CpuUtil dimensions
    cpu_metric = cache.metrics_by_name["CpuUtil"]
    assert len(cpu_metric.dimensions) == 1
    assert cpu_metric.dimensions[0].dimension_name == "InstanceId"
    assert cpu_metric.dimensions[0].required is True

    # Check DiskUtil dimensions (has multiple dimensions)
    disk_metric = cache.metrics_by_name["DiskUtil"]
    assert len(disk_metric.dimensions) == 2
    assert disk_metric.dimensions[0].dimension_name == "InstanceId"
    assert disk_metric.dimensions[1].dimension_name == "MountPoint"
    assert disk_metric.dimensions[1].required is False


@pytest.mark.asyncio
async def test_cache_lifespan_success(
    monkeypatch, mock_aiohttp_session, mock_volcengine_product_data, mock_volcengine_metric_data
):
    """Test cache lifespan context manager with successful initialization."""
    from unittest.mock import MagicMock

    # Create mock app
    app = MagicMock()

    # Mock both refresh calls
    refresh_call_count = [0]

    async def mock_refresh(*args, **kwargs):
        refresh_call_count[0] += 1
        if refresh_call_count[0] == 1:
            # First call for products
            volcengine_product_cache.products = [
                MagicMock(namespace="VCM_ECS", description="Test", type_name="ECS", type_id="001")
            ]
        else:
            # Second call for metrics
            volcengine_metric_cache.all_metrics = [MagicMock()]

    monkeypatch.setattr(volcengine_product_cache, "refresh_products", mock_refresh)
    monkeypatch.setattr(volcengine_metric_cache, "refresh_metrics", mock_refresh)

    # Mock task start/stop
    monkeypatch.setattr(volcengine_product_cache, "start_refresh_task", lambda: None)
    monkeypatch.setattr(volcengine_metric_cache, "start_refresh_task", lambda: None)

    async def mock_stop():
        pass

    monkeypatch.setattr(volcengine_product_cache, "stop_refresh_task", mock_stop)
    monkeypatch.setattr(volcengine_metric_cache, "stop_refresh_task", mock_stop)

    # Test lifespan
    async with cache_lifespan(app):
        # Within lifespan context
        assert refresh_call_count[0] == 2

    # After exiting lifespan, graceful_shutdown should have been called


@pytest.mark.asyncio
async def test_cache_lifespan_initialization_failure(monkeypatch):
    """Test cache lifespan handles initialization failure."""
    from unittest.mock import MagicMock

    app = MagicMock()

    # Mock refresh to fail
    async def mock_refresh_fail():
        raise Exception("API connection failed")

    monkeypatch.setattr(volcengine_product_cache, "refresh_products", mock_refresh_fail)

    # Should raise exception during initialization
    with pytest.raises(Exception, match="API connection failed"):
        async with cache_lifespan(app):
            pass


@pytest.mark.asyncio
async def test_graceful_shutdown(monkeypatch):
    """Test graceful shutdown stops all cache tasks."""
    stop_call_count = [0]

    async def mock_stop():
        stop_call_count[0] += 1

    monkeypatch.setattr(volcengine_product_cache, "stop_refresh_task", mock_stop)
    monkeypatch.setattr(volcengine_metric_cache, "stop_refresh_task", mock_stop)

    await graceful_shutdown()

    assert stop_call_count[0] == 2


@pytest.mark.asyncio
async def test_product_cache_schedule_refresh_with_stop_event():
    """Test product cache scheduled refresh respects stop event."""
    cache = VolcengineProductCache(refresh_interval_seconds=1)

    # Start scheduled refresh
    task = asyncio.create_task(cache.schedule_cache_refresh())

    # Give it time to start
    await asyncio.sleep(0.1)

    # Signal stop
    cache._stop_event.set()

    # Wait for task to complete
    try:
        await asyncio.wait_for(task, timeout=2)
    except asyncio.TimeoutError:
        task.cancel()
        pytest.fail("Task did not stop gracefully")


@pytest.mark.asyncio
async def test_metric_cache_schedule_refresh_with_stop_event():
    """Test metric cache scheduled refresh respects stop event."""
    cache = VolcengineMetricCache(refresh_interval_seconds=1)

    # Start scheduled refresh
    task = asyncio.create_task(cache.schedule_cache_refresh())

    # Give it time to start
    await asyncio.sleep(0.1)

    # Signal stop
    cache._stop_event.set()

    # Wait for task to complete
    try:
        await asyncio.wait_for(task, timeout=2)
    except asyncio.TimeoutError:
        task.cancel()
        pytest.fail("Task did not stop gracefully")


@pytest.mark.asyncio
async def test_product_cache_multiple_start_calls():
    """Test multiple start calls don't create duplicate tasks."""
    cache = VolcengineProductCache(refresh_interval_seconds=10)

    cache.start_refresh_task()
    first_task = cache._refresh_task

    cache.start_refresh_task()
    second_task = cache._refresh_task

    # Should be the same task
    assert first_task == second_task

    await cache.stop_refresh_task()


@pytest.mark.asyncio
async def test_metric_cache_get_metrics_by_namespace():
    """Test getting metrics by namespace."""
    cache = VolcengineMetricCache(refresh_interval_seconds=10)

    from veaiops.cache.volcengine_metric import MetricDimension, VolcengineMetricDetail

    # Manually add metrics
    cache.all_metrics = [
        VolcengineMetricDetail(
            metric_name="CpuUtil",
            metric_tips="CPU",
            description="CPU util",
            description_cn="CPU使用率",
            description_en="CPU util",
            namespace="VCM_ECS",
            sub_namespace="Instance",
            unit="%",
            statistics="avg",
            point_interval=60,
            point_delay=120,
            group_by_interval=60,
            original_point_delay=60,
            type_alert_enable=True,
            type_consume_enable=True,
            dimensions=[MetricDimension(dimension_name="InstanceId", description="Instance", required=True)],
            un_support_sub_ns_resource=False,
            report_method="Periodic",
            query_not_fill_zero=False,
        )
    ]
    cache._rebuild_indices()

    assert "VCM_ECS" in cache.metrics
    assert len(cache.metrics["VCM_ECS"]) == 1
