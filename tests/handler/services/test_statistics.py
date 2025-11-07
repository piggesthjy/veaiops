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

from veaiops.handler.services.statistics import get_item_count
from veaiops.schema.documents import Connect, User


@pytest.mark.asyncio
async def test_get_item_count_no_conditions(test_user):
    """Test counting items without date filter."""
    # Act
    count = await get_item_count(User, None, None, [])

    # Assert
    assert count >= 1  # At least the test_user


@pytest.mark.asyncio
async def test_get_item_count_with_start_date(test_user):
    """Test counting items with start date filter."""
    # Arrange
    start = datetime.now(timezone.utc) - timedelta(hours=1)

    # Act
    count = await get_item_count(User, start, None, [])

    # Assert
    assert count >= 1  # test_user was created within the last hour


@pytest.mark.asyncio
async def test_get_item_count_with_end_date(test_user):
    """Test counting items with end date filter."""
    # Arrange
    end = datetime.now(timezone.utc) + timedelta(hours=1)

    # Act
    count = await get_item_count(User, None, end, [])

    # Assert
    assert count >= 1  # test_user created before end time


@pytest.mark.asyncio
async def test_get_item_count_with_date_range(test_user):
    """Test counting items within a date range."""
    # Arrange
    start = datetime.now(timezone.utc) - timedelta(hours=1)
    end = datetime.now(timezone.utc) + timedelta(hours=1)

    # Act
    count = await get_item_count(User, start, end, [])

    # Assert
    assert count >= 1  # test_user within range


@pytest.mark.asyncio
async def test_get_item_count_outside_date_range(test_user):
    """Test counting when items are outside date range."""
    # Arrange - date range in the future
    start = datetime.now(timezone.utc) + timedelta(days=1)
    end = datetime.now(timezone.utc) + timedelta(days=2)

    # Act
    count = await get_item_count(User, start, end, [])

    # Assert
    assert count == 0  # No users in future date range


@pytest.mark.asyncio
async def test_get_item_count_with_additional_conditions(test_user):
    """Test counting with additional query conditions."""
    # Arrange
    from veaiops.schema.documents import User as UserDoc

    conditions = [UserDoc.username == test_user.username]

    # Act
    count = await get_item_count(User, None, None, conditions)

    # Assert
    assert count == 1  # Exactly one user with this username


@pytest.mark.asyncio
async def test_get_item_count_no_matches_with_conditions():
    """Test counting with conditions that match nothing."""
    # Arrange
    from veaiops.schema.documents import User as UserDoc

    conditions = [UserDoc.username == "nonexistent_user_12345"]

    # Act
    count = await get_item_count(User, None, None, conditions)

    # Assert
    assert count == 0


@pytest.mark.asyncio
async def test_get_item_count_multiple_users(test_user, test_admin_user):
    """Test counting multiple items."""
    # Act
    count = await get_item_count(User, None, None, [])

    # Assert
    assert count >= 2  # At least test_user and test_admin_user


@pytest.mark.asyncio
async def test_get_item_count_with_connect(test_connect):
    """Test counting Connect documents."""
    # Act
    count = await get_item_count(Connect, None, None, [])

    # Assert
    assert count >= 1


@pytest.mark.asyncio
async def test_get_item_count_start_date_precision():
    """Test that start date filter works precisely."""
    # Arrange - create user
    from pydantic import SecretStr

    user = await User(
        username="tempuser",
        email="temp@example.com",
        password=SecretStr("temppass"),
        is_active=True,
    ).insert()

    # Test with start date just after creation
    start = datetime.now(timezone.utc) + timedelta(seconds=1)

    # Act
    count = await get_item_count(User, start, None, [])

    # Assert - user should not be counted as it was created before start
    assert count == 0

    # Cleanup
    await user.delete()
