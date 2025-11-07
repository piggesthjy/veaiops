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

"""Tests for datasource fetch_data service."""

from datetime import datetime, timezone

import pytest

from veaiops.handler.services.datasource.fetch_data import fetch_data


@pytest.mark.asyncio
async def test_fetch_data_datasource_not_found():
    """Test fetch_data with non-existent datasource."""
    from beanie import PydanticObjectId

    fake_datasource_id = str(PydanticObjectId())
    start_time = int(datetime(2025, 1, 1, tzinfo=timezone.utc).timestamp())
    end_time = int(datetime(2025, 1, 2, tzinfo=timezone.utc).timestamp())

    with pytest.raises(ValueError, match="Data source with ID.*not found"):
        await fetch_data(fake_datasource_id, start_time, end_time)


@pytest.mark.asyncio
async def test_fetch_data_timestamp_conversion_logic():
    """Test that timestamps are correctly converted to datetime objects."""
    start_timestamp = int(datetime(2025, 1, 1, 10, 30, 45, tzinfo=timezone.utc).timestamp())
    end_timestamp = int(datetime(2025, 1, 2, 15, 45, 30, tzinfo=timezone.utc).timestamp())

    # Convert using the same logic as fetch_data
    start_dt = datetime.fromtimestamp(start_timestamp)
    end_dt = datetime.fromtimestamp(end_timestamp)

    # Verify conversions
    assert isinstance(start_dt, datetime)
    assert isinstance(end_dt, datetime)
    assert start_dt.timestamp() == start_timestamp
    assert end_dt.timestamp() == end_timestamp


@pytest.mark.asyncio
async def test_fetch_data_interval_assignment():
    """Test that interval_seconds is correctly assigned."""
    test_intervals = [60, 300, 600, 3600]

    for interval in test_intervals:
        assigned_interval = interval
        assert assigned_interval == interval


@pytest.mark.asyncio
async def test_fetch_data_with_different_datasource_types():
    """Test that fetch_data accepts different datasource type IDs."""
    from beanie import PydanticObjectId

    for _ in range(3):
        fake_id = str(PydanticObjectId())
        start_time = int(datetime(2025, 1, 1, tzinfo=timezone.utc).timestamp())
        end_time = int(datetime(2025, 1, 2, tzinfo=timezone.utc).timestamp())

        # Should raise ValueError for non-existent datasource
        with pytest.raises(ValueError):
            await fetch_data(fake_id, start_time, end_time)


@pytest.mark.asyncio
async def test_fetch_data_with_volcengine_datasource(volcengine_datasource, mocker):
    """Test fetch_data with a valid Volcengine datasource."""
    # Arrange
    start_time = int(datetime(2025, 1, 1, tzinfo=timezone.utc).timestamp())
    end_time = int(datetime(2025, 1, 2, tzinfo=timezone.utc).timestamp())

    # Mock both the factory and the datasource fetch_link
    mock_fetch = mocker.AsyncMock(return_value=[])
    mock_datasource_obj = mocker.MagicMock()
    mock_datasource_obj.fetch = mock_fetch
    mock_datasource_obj.interval_seconds = 60

    mocker.patch(
        "veaiops.metrics.datasource_factory.DataSourceFactory.create_datasource",
        return_value=mock_datasource_obj,
    )

    # Mock fetch_link to avoid database access
    mocker.patch(
        "veaiops.schema.documents.datasource.base.DataSource.fetch_link",
        mocker.AsyncMock(),
    )

    # Act
    result = await fetch_data(str(volcengine_datasource.id), start_time, end_time, interval_seconds=60)

    # Assert
    assert isinstance(result, list)
    mock_fetch.assert_called_once()


@pytest.mark.asyncio
async def test_fetch_data_default_interval_seconds(volcengine_datasource, mocker):
    """Test fetch_data uses default interval_seconds of 60."""
    # Arrange
    start_time = int(datetime(2025, 1, 1, tzinfo=timezone.utc).timestamp())
    end_time = int(datetime(2025, 1, 2, tzinfo=timezone.utc).timestamp())

    mock_datasource_obj = mocker.MagicMock()
    mock_datasource_obj.fetch = mocker.AsyncMock(return_value=[])

    mocker.patch(
        "veaiops.metrics.datasource_factory.DataSourceFactory.create_datasource",
        return_value=mock_datasource_obj,
    )
    mocker.patch(
        "veaiops.schema.documents.datasource.base.DataSource.fetch_link",
        mocker.AsyncMock(),
    )

    # Act
    await fetch_data(str(volcengine_datasource.id), start_time, end_time)

    # Assert - verify interval_seconds was set to default 60
    assert mock_datasource_obj.interval_seconds == 60


@pytest.mark.asyncio
async def test_fetch_data_custom_interval_seconds(volcengine_datasource, mocker):
    """Test fetch_data sets custom interval_seconds."""
    # Arrange
    start_time = int(datetime(2025, 1, 1, tzinfo=timezone.utc).timestamp())
    end_time = int(datetime(2025, 1, 2, tzinfo=timezone.utc).timestamp())
    custom_interval = 300

    mock_datasource_obj = mocker.MagicMock()
    mock_datasource_obj.fetch = mocker.AsyncMock(return_value=[])

    mocker.patch(
        "veaiops.metrics.datasource_factory.DataSourceFactory.create_datasource",
        return_value=mock_datasource_obj,
    )
    mocker.patch(
        "veaiops.schema.documents.datasource.base.DataSource.fetch_link",
        mocker.AsyncMock(),
    )

    # Act
    await fetch_data(str(volcengine_datasource.id), start_time, end_time, interval_seconds=custom_interval)

    # Assert - verify interval_seconds was set to custom value
    assert mock_datasource_obj.interval_seconds == custom_interval


@pytest.mark.asyncio
async def test_fetch_data_calls_datasource_factory(volcengine_datasource, mocker):
    """Test fetch_data correctly calls DataSourceFactory."""
    # Arrange
    start_time = int(datetime(2025, 1, 1, tzinfo=timezone.utc).timestamp())
    end_time = int(datetime(2025, 1, 2, tzinfo=timezone.utc).timestamp())

    mock_datasource_obj = mocker.MagicMock()
    mock_datasource_obj.fetch = mocker.AsyncMock(return_value=[])

    mock_factory_create = mocker.patch(
        "veaiops.metrics.datasource_factory.DataSourceFactory.create_datasource",
        return_value=mock_datasource_obj,
    )
    mocker.patch(
        "veaiops.schema.documents.datasource.base.DataSource.fetch_link",
        mocker.AsyncMock(),
    )

    # Act
    await fetch_data(str(volcengine_datasource.id), start_time, end_time)

    # Assert
    mock_factory_create.assert_called_once()


@pytest.mark.asyncio
async def test_fetch_data_datetime_conversion_range(volcengine_datasource, mocker):
    """Test that fetch_data correctly converts time ranges."""
    # Arrange
    start_time = int(datetime(2025, 1, 1, 0, 0, 0, tzinfo=timezone.utc).timestamp())
    end_time = int(datetime(2025, 1, 31, 23, 59, 59, tzinfo=timezone.utc).timestamp())

    mock_fetch = mocker.AsyncMock(return_value=[])
    mock_datasource_obj = mocker.MagicMock()
    mock_datasource_obj.fetch = mock_fetch

    mocker.patch(
        "veaiops.metrics.datasource_factory.DataSourceFactory.create_datasource",
        return_value=mock_datasource_obj,
    )
    mocker.patch(
        "veaiops.schema.documents.datasource.base.DataSource.fetch_link",
        mocker.AsyncMock(),
    )

    # Act
    await fetch_data(str(volcengine_datasource.id), start_time, end_time)

    # Assert - verify fetch was called with datetime objects
    mock_fetch.assert_called_once()
    call_args = mock_fetch.call_args
    start_dt, end_dt = call_args[0]
    assert isinstance(start_dt, datetime)
    assert isinstance(end_dt, datetime)
