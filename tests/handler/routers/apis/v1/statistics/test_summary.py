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

"""Tests for summary endpoint in statistics module."""

import pytest

from veaiops.handler.routers.apis.v1.statistics.summary import get_statistics
from veaiops.schema.models import APIResponse, SystemStatistics


@pytest.mark.asyncio
async def test_get_statistics_success(test_user, test_bot, test_chat_for_stats):
    """Test get_statistics endpoint returns valid SystemStatistics object."""
    # Act
    response = await get_statistics()

    # Assert
    assert isinstance(response, APIResponse)
    stats = response.data

    assert isinstance(stats, SystemStatistics)
    assert stats.active_users >= 1
    assert stats.active_bots >= 1


@pytest.mark.asyncio
async def test_get_statistics_response_structure(test_user, test_bot):
    """Test that get_statistics response has all required fields."""
    # Act
    response = await get_statistics()

    # Assert - check response structure
    stats = response.data

    # Verify all SystemStatistics fields are present
    assert hasattr(stats, "active_bots")
    assert hasattr(stats, "active_chats")
    assert hasattr(stats, "active_inform_strategies")
    assert hasattr(stats, "active_subscribes")
    assert hasattr(stats, "active_users")
    assert hasattr(stats, "active_products")
    assert hasattr(stats, "active_projects")
    assert hasattr(stats, "active_customers")
    assert hasattr(stats, "active_intelligent_threshold_tasks")
    assert hasattr(stats, "active_intelligent_threshold_autoupdate_tasks")
    assert hasattr(stats, "latest_1d_intelligent_threshold_success_num")
    assert hasattr(stats, "latest_1d_intelligent_threshold_failed_num")
    assert hasattr(stats, "latest_7d_intelligent_threshold_success_num")
    assert hasattr(stats, "latest_7d_intelligent_threshold_failed_num")
    assert hasattr(stats, "latest_30d_intelligent_threshold_success_num")
    assert hasattr(stats, "latest_30d_intelligent_threshold_failed_num")
    assert hasattr(stats, "latest_24h_events")
    assert hasattr(stats, "last_1d_events")
    assert hasattr(stats, "last_7d_events")
    assert hasattr(stats, "last_30d_events")
    assert hasattr(stats, "latest_24h_messages")
    assert hasattr(stats, "last_1d_messages")
    assert hasattr(stats, "last_7d_messages")
    assert hasattr(stats, "last_30d_messages")


@pytest.mark.asyncio
async def test_get_statistics_with_products(test_user, test_bot, test_product):
    """Test get_statistics counts active products."""
    # Act
    response = await get_statistics()

    # Assert
    stats = response.data

    assert stats.active_products >= 1


@pytest.mark.asyncio
async def test_get_statistics_with_projects(test_user, test_bot, test_project):
    """Test get_statistics counts active projects."""
    # Act
    response = await get_statistics()

    # Assert
    stats = response.data

    assert stats.active_projects >= 1


@pytest.mark.asyncio
async def test_get_statistics_with_customers(test_user, test_bot, test_customer):
    """Test get_statistics counts active customers."""
    # Act
    response = await get_statistics()

    # Assert
    stats = response.data

    assert stats.active_customers >= 1


@pytest.mark.asyncio
async def test_get_statistics_with_intelligent_threshold_tasks(
    test_user, test_bot, test_intelligent_threshold_task_for_stats
):
    """Test get_statistics counts active intelligent threshold tasks."""
    # Act
    response = await get_statistics()

    # Assert
    stats = response.data

    assert stats.active_intelligent_threshold_tasks >= 1


@pytest.mark.asyncio
async def test_get_statistics_with_autoupdate_tasks(test_user, test_bot, test_intelligent_threshold_task_autoupdate):
    """Test get_statistics counts intelligent threshold autoupdate tasks."""
    # Act
    response = await get_statistics()

    # Assert
    stats = response.data

    assert stats.active_intelligent_threshold_autoupdate_tasks >= 1


@pytest.mark.asyncio
async def test_get_statistics_with_messages(test_user, test_bot, test_message_for_stats):
    """Test get_statistics counts messages within time windows."""
    # Act
    response = await get_statistics()

    # Assert
    stats = response.data

    # The message was created today, so it should be counted in 24h, 1d, 7d, 30d
    assert stats.latest_24h_messages >= 1
    assert stats.last_1d_messages >= 1
    assert stats.last_7d_messages >= 1
    assert stats.last_30d_messages >= 1


@pytest.mark.asyncio
async def test_get_statistics_with_dispatched_events(test_user, test_bot, test_event_dispatched):
    """Test get_statistics counts dispatched events within time windows."""
    # Act
    response = await get_statistics()

    # Assert
    stats = response.data

    # The event was created today, so it should be counted in 24h, 1d, 7d, 30d
    assert stats.latest_24h_events >= 1
    assert stats.last_1d_events >= 1
    assert stats.last_7d_events >= 1
    assert stats.last_30d_events >= 1


@pytest.mark.asyncio
async def test_get_statistics_all_fields_are_integers(test_user, test_bot):
    """Test that all statistics fields are integers."""
    # Act
    response = await get_statistics()

    # Assert
    stats = response.data

    assert isinstance(stats.active_bots, int)
    assert isinstance(stats.active_chats, int)
    assert isinstance(stats.active_inform_strategies, int)
    assert isinstance(stats.active_subscribes, int)
    assert isinstance(stats.active_users, int)
    assert isinstance(stats.active_products, int)
    assert isinstance(stats.active_projects, int)
    assert isinstance(stats.active_customers, int)
    assert isinstance(stats.active_intelligent_threshold_tasks, int)
    assert isinstance(stats.active_intelligent_threshold_autoupdate_tasks, int)
    assert isinstance(stats.latest_1d_intelligent_threshold_success_num, int)
    assert isinstance(stats.latest_1d_intelligent_threshold_failed_num, int)
    assert isinstance(stats.latest_7d_intelligent_threshold_success_num, int)
    assert isinstance(stats.latest_7d_intelligent_threshold_failed_num, int)
    assert isinstance(stats.latest_30d_intelligent_threshold_success_num, int)
    assert isinstance(stats.latest_30d_intelligent_threshold_failed_num, int)
    assert isinstance(stats.latest_24h_events, int)
    assert isinstance(stats.last_1d_events, int)
    assert isinstance(stats.last_7d_events, int)
    assert isinstance(stats.last_30d_events, int)
    assert isinstance(stats.latest_24h_messages, int)
    assert isinstance(stats.last_1d_messages, int)
    assert isinstance(stats.last_7d_messages, int)
    assert isinstance(stats.last_30d_messages, int)


@pytest.mark.asyncio
async def test_get_statistics_all_counts_non_negative(test_user, test_bot):
    """Test that all statistics counts are non-negative."""
    # Act
    response = await get_statistics()

    # Assert
    stats = response.data

    assert stats.active_bots >= 0
    assert stats.active_chats >= 0
    assert stats.active_inform_strategies >= 0
    assert stats.active_subscribes >= 0
    assert stats.active_users >= 0
    assert stats.active_products >= 0
    assert stats.active_projects >= 0
    assert stats.active_customers >= 0
    assert stats.active_intelligent_threshold_tasks >= 0
    assert stats.active_intelligent_threshold_autoupdate_tasks >= 0
    assert stats.latest_1d_intelligent_threshold_success_num >= 0
    assert stats.latest_1d_intelligent_threshold_failed_num >= 0
    assert stats.latest_7d_intelligent_threshold_success_num >= 0
    assert stats.latest_7d_intelligent_threshold_failed_num >= 0
    assert stats.latest_30d_intelligent_threshold_success_num >= 0
    assert stats.latest_30d_intelligent_threshold_failed_num >= 0
    assert stats.latest_24h_events >= 0
    assert stats.last_1d_events >= 0
    assert stats.last_7d_events >= 0
    assert stats.last_30d_events >= 0
    assert stats.latest_24h_messages >= 0
    assert stats.last_1d_messages >= 0
    assert stats.last_7d_messages >= 0
    assert stats.last_30d_messages >= 0


@pytest.mark.asyncio
async def test_get_statistics_time_window_consistency(test_user, test_bot, test_message_for_stats):
    """Test that statistics respect time window consistency (24h <= 1d <= 7d <= 30d)."""
    # Act
    response = await get_statistics()

    # Assert
    stats = response.data

    # Message statistics should follow time window consistency
    assert stats.latest_24h_messages <= stats.last_1d_messages
    assert stats.last_1d_messages <= stats.last_7d_messages
    assert stats.last_7d_messages <= stats.last_30d_messages


@pytest.mark.asyncio
async def test_get_statistics_empty_database(test_user):
    """Test get_statistics with minimal data in database."""
    # Act - just call with minimal setup (test_user is the only doc)
    response = await get_statistics()

    # Assert
    stats = response.data

    assert isinstance(stats, SystemStatistics)
    assert stats.active_users >= 1
    # All other counts should be >= 0
    assert all(
        isinstance(getattr(stats, field), int) and getattr(stats, field) >= 0
        for field in [
            "active_bots",
            "active_chats",
            "active_inform_strategies",
            "active_subscribes",
            "active_products",
            "active_projects",
            "active_customers",
            "active_intelligent_threshold_tasks",
            "active_intelligent_threshold_autoupdate_tasks",
            "latest_1d_intelligent_threshold_success_num",
            "latest_1d_intelligent_threshold_failed_num",
            "latest_7d_intelligent_threshold_success_num",
            "latest_7d_intelligent_threshold_failed_num",
            "latest_30d_intelligent_threshold_success_num",
            "latest_30d_intelligent_threshold_failed_num",
            "latest_24h_events",
            "last_1d_events",
            "last_7d_events",
            "last_30d_events",
            "latest_24h_messages",
            "last_1d_messages",
            "last_7d_messages",
            "last_30d_messages",
        ]
    )
