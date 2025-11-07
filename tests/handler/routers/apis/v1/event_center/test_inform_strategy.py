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

"""Tests for inform strategy endpoints."""

import pytest_asyncio
from beanie import PydanticObjectId

from veaiops.schema.documents import InformStrategy
from veaiops.schema.types import ChannelType


@pytest_asyncio.fixture
async def test_inform_strategy():
    """Create a test inform strategy."""
    strategy = await InformStrategy(
        name="test_strategy_001",
        description="Test strategy description",
        channel=ChannelType.Lark,
        bot_id="cli_a1b2c3d4e5f6",
        chat_ids=["oc_123456789"],
        is_active=True,
    ).insert()

    yield strategy

    await strategy.delete()


@pytest_asyncio.fixture
async def test_inform_strategies():
    """Create multiple test inform strategies."""
    strategies = []

    # Strategy 1: Lark strategy
    strategy1 = await InformStrategy(
        name="lark_strategy_001",
        description="Lark strategy description",
        channel=ChannelType.Lark,
        bot_id="cli_a1b2c3d4e5f6",
        chat_ids=["oc_111111111", "oc_222222222"],
        is_active=True,
    ).insert()
    strategies.append(strategy1)

    # Strategy 2: DingTalk strategy
    strategy2 = await InformStrategy(
        name="dingtalk_strategy_001",
        description="DingTalk strategy description",
        channel=ChannelType.DingTalk,
        bot_id="dingbot123456",
        chat_ids=["chat_333333333"],
        is_active=True,
    ).insert()
    strategies.append(strategy2)

    # Strategy 3: Inactive strategy
    strategy3 = await InformStrategy(
        name="inactive_strategy_001",
        description="Inactive strategy description",
        channel=ChannelType.Lark,
        bot_id="cli_x1y2z3w4v5u6",
        chat_ids=["oc_444444444"],
        is_active=False,
    ).insert()
    strategies.append(strategy3)

    yield strategies

    for strategy in strategies:
        await strategy.delete()


def test_update_inform_strategy_not_found(test_client):
    """Test updating a non-existent inform strategy"""
    # Arrange
    fake_id = str(PydanticObjectId())
    update_payload = {
        "name": "updated_name",
        "channel": "Lark",
        "bot_id": "cli_test123456",
        "chat_ids": ["oc_test111"],
    }

    # Act
    response = test_client.put(f"/apis/v1/manager/event-center/inform-strategy/{fake_id}", json=update_payload)

    # Assert
    assert response.status_code == 404


def test_toggle_inform_strategy_activate(test_client, test_inform_strategies):
    """Test activating an inactive inform strategy"""
    # Arrange - get the inactive strategy (index 2)
    inactive_strategy = test_inform_strategies[2]
    strategy_id = str(inactive_strategy.id)
    toggle_payload = {"active": True}

    # Act
    response = test_client.put(
        f"/apis/v1/manager/event-center/inform-strategy/{strategy_id}/toggle", json=toggle_payload
    )

    # Assert
    assert response.status_code == 200


def test_toggle_inform_strategy_deactivate(test_client, test_inform_strategy):
    """Test deactivating an active inform strategy"""
    # Arrange
    strategy_id = str(test_inform_strategy.id)
    toggle_payload = {"active": False}

    # Act
    response = test_client.put(
        f"/apis/v1/manager/event-center/inform-strategy/{strategy_id}/toggle", json=toggle_payload
    )

    # Assert
    assert response.status_code == 200


def test_toggle_inform_strategy_not_found(test_client):
    """Test toggling a non-existent inform strategy"""
    # Arrange
    fake_id = str(PydanticObjectId())
    toggle_payload = {"active": True}

    # Act
    response = test_client.put(f"/apis/v1/manager/event-center/inform-strategy/{fake_id}/toggle", json=toggle_payload)

    # Assert
    assert response.status_code == 404


def test_delete_inform_strategy_success(test_client, test_inform_strategy):
    """Test deleting an inform strategy successfully"""
    # Arrange
    strategy_id = str(test_inform_strategy.id)

    # Act
    response = test_client.delete(f"/apis/v1/manager/event-center/inform-strategy/{strategy_id}")

    # Assert
    assert response.status_code == 200

    # Verify the strategy is deleted
    get_response = test_client.get(f"/apis/v1/manager/event-center/inform-strategy/{strategy_id}")
    assert get_response.status_code == 404


def test_delete_inform_strategy_not_found(test_client):
    """Test deleting a non-existent inform strategy"""
    # Arrange
    fake_id = str(PydanticObjectId())

    # Act
    response = test_client.delete(f"/apis/v1/manager/event-center/inform-strategy/{fake_id}")

    # Assert
    assert response.status_code == 404
