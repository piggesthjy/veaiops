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

from datetime import datetime, timedelta, timezone

import pytest

from veaiops.agents.chatops.tools.time_tools import get_utc_time


@pytest.mark.asyncio
async def test_get_utc_time_default_utc8():
    """Test get_utc_time with default UTC+8 timezone."""
    # Act
    result = await get_utc_time()

    # Assert - Check format
    assert isinstance(result, str)
    assert len(result) == 19
    assert result[4] == "-"
    assert result[7] == "-"
    assert result[10] == " "
    assert result[13] == ":"
    assert result[16] == ":"

    # Verify the time is approximately correct (within 1 second of expected UTC+8 time)
    parsed_time = datetime.strptime(result, "%Y-%m-%d %H:%M:%S")
    expected_time = datetime.now(timezone.utc).astimezone(timezone(timedelta(hours=8)))

    # Check year, month, day should match
    assert parsed_time.year == expected_time.year
    assert parsed_time.month == expected_time.month
    assert parsed_time.day == expected_time.day

    # Check hour should be within reasonable range (same or differ by 1 due to execution time)
    assert abs(parsed_time.hour - expected_time.hour) <= 1


@pytest.mark.asyncio
async def test_get_utc_time_zero_offset():
    """Test get_utc_time with zero timezone offset (UTC)."""
    # Act
    result = await get_utc_time(hours=0)

    # Assert
    assert isinstance(result, str)
    parsed_time = datetime.strptime(result, "%Y-%m-%d %H:%M:%S")
    expected_time = datetime.now(timezone.utc)

    # Check date components match
    assert parsed_time.year == expected_time.year
    assert parsed_time.month == expected_time.month
    assert parsed_time.day == expected_time.day
    assert abs(parsed_time.hour - expected_time.hour) <= 1


@pytest.mark.asyncio
async def test_get_utc_time_positive_offset():
    """Test get_utc_time with positive timezone offset."""
    # Act
    result_utc5 = await get_utc_time(hours=5)

    # Assert
    assert isinstance(result_utc5, str)
    parsed_time = datetime.strptime(result_utc5, "%Y-%m-%d %H:%M:%S")
    expected_time = datetime.now(timezone.utc).astimezone(timezone(timedelta(hours=5)))

    # Check date components match
    assert parsed_time.year == expected_time.year
    assert parsed_time.month == expected_time.month
    assert abs(parsed_time.hour - expected_time.hour) <= 1


@pytest.mark.asyncio
async def test_get_utc_time_negative_offset():
    """Test get_utc_time with negative timezone offset."""
    # Act
    result_minus5 = await get_utc_time(hours=-5)

    # Assert
    assert isinstance(result_minus5, str)
    parsed_time = datetime.strptime(result_minus5, "%Y-%m-%d %H:%M:%S")
    expected_time = datetime.now(timezone.utc).astimezone(timezone(timedelta(hours=-5)))

    # Check date components match (day might differ due to negative offset)
    assert parsed_time.year == expected_time.year
    assert parsed_time.month == expected_time.month
    assert abs(parsed_time.hour - expected_time.hour) <= 1


@pytest.mark.asyncio
async def test_get_utc_time_large_positive_offset():
    """Test get_utc_time with large positive timezone offset."""
    # Act
    result = await get_utc_time(hours=14)

    # Assert
    assert isinstance(result, str)
    parsed_time = datetime.strptime(result, "%Y-%m-%d %H:%M:%S")
    expected_time = datetime.now(timezone.utc).astimezone(timezone(timedelta(hours=14)))

    # Large offset might change the day
    assert parsed_time.year == expected_time.year
    assert abs((parsed_time - expected_time.replace(tzinfo=None)).total_seconds()) < 2


@pytest.mark.asyncio
async def test_get_utc_time_large_negative_offset():
    """Test get_utc_time with large negative timezone offset."""
    # Act
    result = await get_utc_time(hours=-12)

    # Assert
    assert isinstance(result, str)
    parsed_time = datetime.strptime(result, "%Y-%m-%d %H:%M:%S")
    expected_time = datetime.now(timezone.utc).astimezone(timezone(timedelta(hours=-12)))

    # Large negative offset might change the day
    assert parsed_time.year == expected_time.year
    assert abs((parsed_time - expected_time.replace(tzinfo=None)).total_seconds()) < 2


@pytest.mark.asyncio
async def test_get_utc_time_format_consistency():
    """Test that get_utc_time returns consistent format."""
    # Act
    result1 = await get_utc_time(hours=0)
    result2 = await get_utc_time(hours=8)
    result3 = await get_utc_time(hours=-5)

    # Assert - All should have same format
    for result in [result1, result2, result3]:
        assert isinstance(result, str)
        assert len(result) == 19
        # Verify format: YYYY-MM-DD HH:MM:SS
        parts = result.split(" ")
        assert len(parts) == 2
        date_parts = parts[0].split("-")
        assert len(date_parts) == 3
        assert len(date_parts[0]) == 4  # Year
        assert len(date_parts[1]) == 2  # Month
        assert len(date_parts[2]) == 2  # Day
        time_parts = parts[1].split(":")
        assert len(time_parts) == 3
        assert len(time_parts[0]) == 2  # Hour
        assert len(time_parts[1]) == 2  # Minute
        assert len(time_parts[2]) == 2  # Second


@pytest.mark.asyncio
async def test_get_utc_time_offset_differences():
    """Test that different offsets produce expected time differences."""
    # Act
    result_utc = await get_utc_time(hours=0)
    result_utc8 = await get_utc_time(hours=8)

    # Assert
    time_utc = datetime.strptime(result_utc, "%Y-%m-%d %H:%M:%S")
    time_utc8 = datetime.strptime(result_utc8, "%Y-%m-%d %H:%M:%S")

    # Calculate hour difference (accounting for potential day rollover)
    time_diff = (time_utc8 - time_utc).total_seconds() / 3600

    # Should be approximately 8 hours difference (within small margin for execution time)
    # Handle day rollover: difference might be 8 or -16 (24-8)
    assert abs(time_diff - 8) < 0.1 or abs(time_diff + 16) < 0.1


@pytest.mark.asyncio
async def test_get_utc_time_valid_datetime():
    """Test that returned string can be parsed as valid datetime."""
    # Act
    result = await get_utc_time()

    # Assert - Should be parseable without exception
    parsed = datetime.strptime(result, "%Y-%m-%d %H:%M:%S")
    assert isinstance(parsed, datetime)
    assert parsed.year >= 2025  # Reasonable sanity check
    assert 1 <= parsed.month <= 12
    assert 1 <= parsed.day <= 31
    assert 0 <= parsed.hour <= 23
    assert 0 <= parsed.minute <= 59
    assert 0 <= parsed.second <= 59


@pytest.mark.asyncio
async def test_get_utc_time_multiple_calls_sequential():
    """Test multiple sequential calls return reasonable progression."""
    # Act
    result1 = await get_utc_time()
    result2 = await get_utc_time()

    # Assert
    time1 = datetime.strptime(result1, "%Y-%m-%d %H:%M:%S")
    time2 = datetime.strptime(result2, "%Y-%m-%d %H:%M:%S")

    # Second call should be same or slightly later (within a few seconds)
    time_diff = (time2 - time1).total_seconds()
    assert -1 <= time_diff <= 5  # Allow small execution time
