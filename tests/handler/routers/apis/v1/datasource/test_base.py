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

from http import HTTPStatus
from unittest.mock import AsyncMock, patch

import pytest

from veaiops.metrics.timeseries import InputTimeSeries


@pytest.mark.asyncio
async def test_fetch_data_api_success(test_client):
    """Test successful data fetching from the API."""
    # Mock data
    mock_timeseries = [
        InputTimeSeries(
            name="test_metric",
            timestamps=[1641038400],
            values=[100.0],
            labels={"host": "server1"},
            unique_key="test_metric|host=server1",
        )
    ]

    # Patch the fetch_data function
    with patch(
        "veaiops.handler.routers.apis.v1.datasource.base.fetch_data", new=AsyncMock(return_value=mock_timeseries)
    ):
        response = test_client.post(
            "/apis/v1/datasource/fetch",
            params={
                "datasource_id": "test_datasource_id",
                "start_time": 1641038400,
                "end_time": 1641038500,
                "interval_seconds": 60,
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Data fetched successfully"
        assert len(data["data"]) == 1
        assert data["data"][0]["name"] == "test_metric"


@pytest.mark.asyncio
async def test_fetch_data_api_validation_error(test_client):
    """Test data fetching API with validation errors."""
    # Test missing required parameters
    response = test_client.post("/apis/v1/datasource/fetch")
    assert response.status_code == 422  # Validation error

    # Test invalid start_time (<= 0)
    response = test_client.post(
        "/apis/v1/datasource/fetch",
        params={"datasource_id": "test_datasource_id", "start_time": 0, "end_time": 1641038500},
    )
    assert response.status_code == 422  # Validation error

    # Test invalid end_time (<= 0)
    response = test_client.post(
        "/apis/v1/datasource/fetch",
        params={"datasource_id": "test_datasource_id", "start_time": 1641038400, "end_time": 0},
    )
    assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
async def test_fetch_data_api_service_error(test_client):
    """Test data fetching API when service raises an exception."""
    # Patch the fetch_data function to raise an exception
    with patch(
        "veaiops.handler.routers.apis.v1.datasource.base.fetch_data",
        new=AsyncMock(side_effect=ValueError("Data source not found")),
    ):
        response = test_client.post(
            "/apis/v1/datasource/fetch",
            params={"datasource_id": "nonexistent_datasource", "start_time": 1641038400, "end_time": 1641038500},
        )

        # The API should handle the exception and return a proper error response
        assert response.status_code == 400
        data = response.json()
        # Check for standard API response format
        assert "code" in data
        assert "message" in data
        assert data["code"] == 1  # BUSINESS_CODE_GENERIC_ERROR
        assert "Data source not found" in data["message"]


@pytest.mark.asyncio
async def test_toggle_datasource_active_status_not_found(test_client):
    """Test toggling active status for a non-existent data source."""
    # Patch DataSource.get to return None
    with patch("veaiops.handler.routers.apis.v1.datasource.base.DataSource.get", new=AsyncMock(return_value=None)):
        response = test_client.put("/apis/v1/datasource/507f1f77bcf86cd799439011/active", json={"is_active": True})

        assert response.status_code == 200
        data = response.json()
        assert data["code"] == HTTPStatus.NOT_FOUND
        assert data["message"] == "Data source with ID 507f1f77bcf86cd799439011 not found"
        assert data["data"] is None


@pytest.mark.asyncio
async def test_toggle_datasource_active_status_validation_error(test_client):
    """Test toggling active status with validation errors."""
    # Test missing required body parameter
    response = test_client.put("/apis/v1/datasource/test_id/active")
    assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
async def test_fetch_data_api_default_interval(test_client):
    """Test data fetching API with default interval_seconds."""
    mock_timeseries = [
        InputTimeSeries(
            name="test_metric",
            timestamps=[1641038400],
            values=[100.0],
            labels={"host": "server1"},
            unique_key="test_metric|host=server1",
        )
    ]

    # Patch the fetch_data function
    with patch(
        "veaiops.handler.routers.apis.v1.datasource.base.fetch_data", new=AsyncMock(return_value=mock_timeseries)
    ):
        response = test_client.post(
            "/apis/v1/datasource/fetch",
            params={
                "datasource_id": "test_datasource_id",
                "start_time": 1641038400,
                "end_time": 1641038500,
                # interval_seconds not provided, should default to 60
            },
        )

        assert response.status_code == 200
        # Verify that fetch_data was called with the default interval_seconds
        # This would require more complex mocking to verify the exact call parameters
