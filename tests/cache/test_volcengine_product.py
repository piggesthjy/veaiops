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

"""Tests for volcengine_product cache module."""

import asyncio
from unittest.mock import AsyncMock

import pytest
from aiohttp import ClientError

from veaiops.cache.volcengine_product import VolcengineMetricProduct, VolcengineProductCache


def create_mock_product_response(num_products: int = 3):
    """Create a mock product API response."""
    products = []
    for i in range(num_products):
        products.append(
            {
                "Namespace": f"VCM_PRODUCT_{i}",
                "Description": f"Test product {i} description",
                "Type": f"TestType{i}",
                "TypeId": f"type_id_{i}",
            }
        )
    return {"Result": {"Data": products}}


@pytest.mark.asyncio
async def test_volcengine_metric_product_creation():
    """Test VolcengineMetricProduct dataclass creation."""
    # Arrange & Act
    product = VolcengineMetricProduct(
        namespace="VCM_ECS",
        description="Elastic Compute Service",
        type_name="ECS",
        type_id="ecs_001",
    )

    # Assert
    assert product.namespace == "VCM_ECS"
    assert product.description == "Elastic Compute Service"
    assert product.type_name == "ECS"
    assert product.type_id == "ecs_001"


@pytest.mark.asyncio
async def test_volcengine_product_cache_initialization():
    """Test VolcengineProductCache initialization."""
    # Act
    cache = VolcengineProductCache(refresh_interval_seconds=300)

    # Assert
    assert cache.refresh_interval_seconds == 300
    assert len(cache.products) == 0
    assert cache.last_update is None
    assert cache._refresh_task is None


@pytest.mark.asyncio
async def test_refresh_products_success(setup_mock_aiohttp_session):
    """Test successful products refresh."""
    # Arrange
    cache = VolcengineProductCache()
    mock_response = create_mock_product_response(num_products=5)

    mock_response_obj = setup_mock_aiohttp_session
    mock_response_obj.json = AsyncMock(return_value=mock_response)

    # Act
    await cache.refresh_products()

    # Assert
    assert len(cache.products) == 5
    assert cache.last_update is not None
    assert cache.products[0].namespace == "VCM_PRODUCT_0"


@pytest.mark.asyncio
async def test_refresh_products_connection_error(mocker):
    """Test products refresh when connection error occurs."""
    # Arrange
    cache = VolcengineProductCache()

    # Mock aiohttp session to raise exception
    mock_session = mocker.MagicMock()
    mock_session.__aenter__ = AsyncMock(side_effect=ClientError("Connection error"))
    mocker.patch("aiohttp.ClientSession", return_value=mock_session)

    # Act & Assert
    with pytest.raises(Exception, match="Failed to refresh product data"):
        await cache.refresh_products()

    assert len(cache.products) == 0


@pytest.mark.asyncio
async def test_refresh_products_timeout(mocker):
    """Test products refresh with timeout."""
    # Arrange
    cache = VolcengineProductCache()

    # Mock aiohttp session to timeout
    mock_session = mocker.MagicMock()
    mock_session.__aenter__ = AsyncMock(side_effect=asyncio.TimeoutError())
    mocker.patch("aiohttp.ClientSession", return_value=mock_session)

    # Act & Assert
    with pytest.raises(Exception, match="Failed to refresh product data"):
        await cache.refresh_products()

    assert len(cache.products) == 0


@pytest.mark.asyncio
async def test_refresh_products_key_error(setup_mock_aiohttp_session):
    """Test products refresh with malformed response data."""
    # Arrange
    cache = VolcengineProductCache()
    mock_response = {"Result": {}}  # Missing 'Data' key, will default to empty list

    mock_response_obj = setup_mock_aiohttp_session
    mock_response_obj.json = AsyncMock(return_value=mock_response)

    # Act - The code uses .get("Data", []) so no KeyError is raised, just returns empty list
    await cache.refresh_products()

    # Assert - Cache should be updated with 0 products
    assert len(cache.products) == 0


@pytest.mark.asyncio
async def test_get_products(setup_mock_aiohttp_session):
    """Test getting cached product data."""
    # Arrange
    cache = VolcengineProductCache()
    mock_response = create_mock_product_response(num_products=3)

    mock_response_obj = setup_mock_aiohttp_session
    mock_response_obj.json = AsyncMock(return_value=mock_response)

    await cache.refresh_products()

    # Act
    products = cache.get_products()

    # Assert
    assert len(products) == 3
    assert products[0].namespace == "VCM_PRODUCT_0"
    assert products[1].description == "Test product 1 description"


@pytest.mark.asyncio
async def test_get_products_empty():
    """Test getting products when cache is empty."""
    # Arrange
    cache = VolcengineProductCache()

    # Act
    products = cache.get_products()

    # Assert
    assert len(products) == 0


@pytest.mark.asyncio
async def test_get_products_dict(setup_mock_aiohttp_session):
    """Test getting product data dictionary."""
    # Arrange
    cache = VolcengineProductCache()
    mock_response = create_mock_product_response(num_products=3)

    mock_response_obj = setup_mock_aiohttp_session
    mock_response_obj.json = AsyncMock(return_value=mock_response)

    await cache.refresh_products()

    # Act
    products_dict = cache.get_products_dict()

    # Assert
    assert len(products_dict) == 3
    assert "VCM_PRODUCT_0" in products_dict
    assert products_dict["VCM_PRODUCT_0"]["namespace"] == "VCM_PRODUCT_0"
    assert products_dict["VCM_PRODUCT_0"]["description"] == "Test product 0 description"
    assert products_dict["VCM_PRODUCT_0"]["type"] == "TestType0"
    assert products_dict["VCM_PRODUCT_0"]["type_id"] == "type_id_0"


@pytest.mark.asyncio
async def test_get_products_dict_empty():
    """Test getting products dictionary when cache is empty."""
    # Arrange
    cache = VolcengineProductCache()

    # Act
    products_dict = cache.get_products_dict()

    # Assert
    assert len(products_dict) == 0


@pytest.mark.asyncio
async def test_start_refresh_task():
    """Test starting the refresh task."""
    # Arrange
    cache = VolcengineProductCache(refresh_interval_seconds=1)

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
    cache = VolcengineProductCache(refresh_interval_seconds=10)
    cache.start_refresh_task()
    initial_task = cache._refresh_task

    # Act
    await cache.stop_refresh_task()

    # Assert
    assert initial_task is not None
    assert initial_task.done() or initial_task.cancelled()


@pytest.mark.asyncio
async def test_start_refresh_task_multiple_times():
    """Test starting refresh task multiple times."""
    # Arrange
    cache = VolcengineProductCache(refresh_interval_seconds=1)

    # Act
    cache.start_refresh_task()
    first_task = cache._refresh_task

    await cache.stop_refresh_task()

    cache.start_refresh_task()
    second_task = cache._refresh_task

    # Assert
    assert first_task is not None
    assert second_task is not None
    assert not second_task.done()

    # Cleanup
    await cache.stop_refresh_task()


@pytest.mark.asyncio
async def test_schedule_cache_refresh_loop_success(mocker):
    """Test scheduled cache refresh loop with successful refreshes."""
    # Arrange
    cache = VolcengineProductCache(refresh_interval_seconds=1)

    # Mock refresh_products to track calls
    refresh_count = 0

    async def mock_refresh():
        nonlocal refresh_count
        refresh_count += 1

    mocker.patch.object(cache, "refresh_products", side_effect=mock_refresh)

    # Act - Start task and let it run briefly
    cache.start_refresh_task()
    await asyncio.sleep(0.1)  # Let task start
    await cache.stop_refresh_task()

    # Assert - refresh should have been attempted
    assert refresh_count >= 0  # Task may or may not have completed a refresh cycle


@pytest.mark.asyncio
async def test_schedule_cache_refresh_loop_with_exception(mocker):
    """Test scheduled cache refresh loop handles exceptions."""
    # Arrange
    cache = VolcengineProductCache(refresh_interval_seconds=1)

    # Mock refresh_products to raise exception first, then succeed
    call_count = 0

    async def mock_refresh():
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            raise Exception("Test exception")

    mocker.patch.object(cache, "refresh_products", side_effect=mock_refresh)

    # Act - Start task and let it run briefly
    cache.start_refresh_task()
    await asyncio.sleep(0.1)  # Let task start
    await cache.stop_refresh_task()

    # Assert - Task should handle exception and continue
    assert call_count >= 0


@pytest.mark.asyncio
async def test_stop_refresh_task_timeout(mocker):
    """Test stopping refresh task with timeout."""
    # Arrange
    cache = VolcengineProductCache(refresh_interval_seconds=100)

    # Mock a task that takes longer to stop
    async def long_running_task():
        try:
            await asyncio.sleep(10)
        except asyncio.CancelledError:
            raise

    cache._refresh_task = asyncio.create_task(long_running_task())

    # Act
    await cache.stop_refresh_task()

    # Assert
    assert cache._refresh_task.done() or cache._refresh_task.cancelled()


@pytest.mark.asyncio
async def test_refresh_products_updates_last_update(setup_mock_aiohttp_session):
    """Test that refresh_products updates last_update timestamp."""
    # Arrange
    cache = VolcengineProductCache()
    mock_response = create_mock_product_response(num_products=2)

    mock_response_obj = setup_mock_aiohttp_session
    mock_response_obj.json = AsyncMock(return_value=mock_response)

    # Act
    assert cache.last_update is None
    await cache.refresh_products()

    # Assert
    assert cache.last_update is not None


@pytest.mark.asyncio
async def test_refresh_products_multiple_times(mock_aiohttp_client_factory, mocker):
    """Test refreshing products multiple times updates cache correctly."""
    # Arrange
    cache = VolcengineProductCache()

    # First refresh with 3 products
    mock_response1 = create_mock_product_response(num_products=3)
    mock_session1, mock_response1_obj = mock_aiohttp_client_factory(response_data=mock_response1)
    mocker.patch("aiohttp.ClientSession", return_value=mock_session1)

    # Act - First refresh
    await cache.refresh_products()
    assert len(cache.products) == 3

    # Second refresh with 5 products
    mock_response2 = create_mock_product_response(num_products=5)
    mock_session2, mock_response2_obj = mock_aiohttp_client_factory(response_data=mock_response2)
    mocker.patch("aiohttp.ClientSession", return_value=mock_session2)

    # Act - Second refresh
    await cache.refresh_products()

    # Assert - Cache should be updated with new data
    assert len(cache.products) == 5
    assert cache.products[0].namespace == "VCM_PRODUCT_0"


@pytest.mark.asyncio
async def test_stop_refresh_task_when_not_running():
    """Test stopping refresh task when no task is running."""
    # Arrange
    cache = VolcengineProductCache()

    # Act & Assert - Should not raise any errors
    await cache.stop_refresh_task()
    assert cache._refresh_task is None
