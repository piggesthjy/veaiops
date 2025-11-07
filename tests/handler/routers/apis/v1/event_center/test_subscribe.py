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

"""Tests for subscribe endpoints."""

from datetime import datetime, timezone

import pytest_asyncio
from beanie import PydanticObjectId

from veaiops.schema.documents import Subscribe
from veaiops.schema.types import AgentType, EventLevel


@pytest_asyncio.fixture
async def test_subscribe():
    """Create a test subscribe."""
    subscribe = await Subscribe(
        name="test_subscribe_001",
        agent_type=AgentType.CHATOPS_INTEREST,
        start_time=datetime(2025, 1, 1, 0, 0, 0, tzinfo=timezone.utc),
        end_time=datetime(2025, 12, 31, 23, 59, 59, tzinfo=timezone.utc),
        event_level=[EventLevel.P0, EventLevel.P1],
        enable_webhook=False,
        is_active=True,
    ).insert()

    yield subscribe

    await subscribe.delete()


@pytest_asyncio.fixture
async def test_subscribes():
    """Create multiple test subscribes."""
    subscribes = []

    # Subscribe 1: CHATOPS_INTEREST with P0, P1
    subscribe1 = await Subscribe(
        name="chatops_interest_subscribe",
        agent_type=AgentType.CHATOPS_INTEREST,
        start_time=datetime(2025, 1, 1, 0, 0, 0, tzinfo=timezone.utc),
        end_time=datetime(2025, 12, 31, 23, 59, 59, tzinfo=timezone.utc),
        event_level=[EventLevel.P0, EventLevel.P1],
        enable_webhook=False,
        is_active=True,
    ).insert()
    subscribes.append(subscribe1)

    # Subscribe 2: CHATOPS_REACTIVE_REPLY with P2
    subscribe2 = await Subscribe(
        name="chatops_reactive_subscribe",
        agent_type=AgentType.CHATOPS_REACTIVE_REPLY,
        start_time=datetime(2025, 1, 1, 0, 0, 0, tzinfo=timezone.utc),
        end_time=datetime(2025, 6, 30, 23, 59, 59, tzinfo=timezone.utc),
        event_level=[EventLevel.P2],
        enable_webhook=True,
        webhook_endpoint="https://example.com/webhook",
        is_active=True,
    ).insert()
    subscribes.append(subscribe2)

    # Subscribe 3: Inactive subscribe
    subscribe3 = await Subscribe(
        name="inactive_subscribe",
        agent_type=AgentType.CHATOPS_PROACTIVE_REPLY,
        start_time=datetime(2025, 1, 1, 0, 0, 0, tzinfo=timezone.utc),
        end_time=datetime(2025, 12, 31, 23, 59, 59, tzinfo=timezone.utc),
        event_level=[EventLevel.P0],
        enable_webhook=False,
        is_active=False,
    ).insert()
    subscribes.append(subscribe3)

    yield subscribes

    for subscribe in subscribes:
        await subscribe.delete()


def test_create_subscribe_success(test_client):
    """Test creating a subscribe successfully"""
    # Arrange
    payload = {
        "name": "new_subscribe_001",
        "agent_type": "chatops_interest_agent",
        "start_time": "2025-01-01T00:00:00Z",
        "end_time": "2025-12-31T23:59:59Z",
        "event_level": ["P0", "P1"],
        "enable_webhook": False,
    }

    # Act
    response = test_client.post("/apis/v1/manager/event-center/subscribe/", json=payload)

    # Assert
    assert response.status_code == 201
    response_data = response.json()
    assert "data" in response_data
    assert response_data["data"]["name"] == payload["name"]
    assert response_data["data"]["agent_type"] == payload["agent_type"]


def test_get_subscribe_success(test_client, test_subscribe):
    """Test getting a subscribe by id successfully"""
    # Arrange
    subscribe_id = str(test_subscribe.id)

    # Act
    response = test_client.get(f"/apis/v1/manager/event-center/subscribe/{subscribe_id}")

    # Assert
    assert response.status_code == 200
    response_data = response.json()
    assert response_data["data"]["name"] == test_subscribe.name


def test_get_subscribes_all(test_client, test_subscribes):
    """Test getting all subscribes"""
    # Act
    response = test_client.get("/apis/v1/manager/event-center/subscribe/")

    # Assert
    assert response.status_code == 200
    response_data = response.json()
    assert isinstance(response_data["data"], list)
    # Should only return active subscribes (2 active out of 3)
    assert len(response_data["data"]) >= 2
    assert response_data["total"] >= 2


def test_get_subscribes_with_name_filter(test_client, test_subscribes):
    """Test getting subscribes filtered by name"""
    # Act - search for "chatops" in name
    response = test_client.get("/apis/v1/manager/event-center/subscribe/?name=chatops")

    # Assert
    assert response.status_code == 200
    response_data = response.json()
    assert len(response_data["data"]) >= 1
    # All returned subscribes should have "chatops" in name
    for subscribe in response_data["data"]:
        assert "chatops" in subscribe["name"].lower()


def test_get_subscribes_with_agents_filter(test_client, test_subscribes):
    """Test getting subscribes filtered by agents"""
    # Act
    response = test_client.get("/apis/v1/manager/event-center/subscribe/?agents=chatops_interest_agent")

    # Assert
    assert response.status_code == 200
    response_data = response.json()
    assert len(response_data["data"]) >= 1
    # All returned subscribes should be chatops_interest_agent
    for subscribe in response_data["data"]:
        assert subscribe["agent_type"] == "chatops_interest_agent"


def test_get_subscribes_with_enable_webhook_filter(test_client, test_subscribes):
    """Test getting subscribes filtered by enable_webhook"""
    # Act
    response = test_client.get("/apis/v1/manager/event-center/subscribe/?enable_webhook=true")

    # Assert
    assert response.status_code == 200
    response_data = response.json()
    assert len(response_data["data"]) >= 1
    # All returned subscribes should have enable_webhook=True
    for subscribe in response_data["data"]:
        assert subscribe["enable_webhook"] is True


def test_get_subscribes_show_all_true(test_client, test_subscribes):
    """Test getting subscribes with show_all=true (include inactive)"""
    # Act
    response = test_client.get("/apis/v1/manager/event-center/subscribe/?show_all=true")

    # Assert
    assert response.status_code == 200
    response_data = response.json()
    # Should return all subscribes (including inactive)
    assert len(response_data["data"]) >= 3


def test_get_subscribes_with_pagination(test_client, test_subscribes):
    """Test getting subscribes with pagination"""
    # Act
    response = test_client.get("/apis/v1/manager/event-center/subscribe/?skip=0&limit=10")

    # Assert
    assert response.status_code == 200
    response_data = response.json()
    assert "total" in response_data
    assert "skip" in response_data
    assert "limit" in response_data
    assert response_data["skip"] == 0
    assert response_data["limit"] == 10


def test_update_subscribe_success(test_client, test_subscribe):
    """Test updating a subscribe successfully"""
    # Arrange
    subscribe_id = str(test_subscribe.id)
    update_payload = {
        "name": "updated_subscribe_name",
        "agent_type": "chatops_reactive_reply_agent",
        "start_time": "2025-01-01T00:00:00Z",
        "end_time": "2025-12-31T23:59:59Z",
        "event_level": ["P0", "P1", "P2"],
        "enable_webhook": True,
        "webhook_endpoint": "https://example.com/new-webhook",
    }

    # Act
    response = test_client.put(f"/apis/v1/manager/event-center/subscribe/{subscribe_id}", json=update_payload)

    # Assert
    assert response.status_code == 200
    response_data = response.json()
    assert response_data["data"]["name"] == update_payload["name"]
    assert response_data["data"]["enable_webhook"] == update_payload["enable_webhook"]


def test_update_subscribe_partial(test_client, test_subscribe):
    """Test partially updating a subscribe"""
    # Arrange
    subscribe_id = str(test_subscribe.id)
    original_agent_type = test_subscribe.agent_type
    # Include required fields for update
    partial_update = {
        "name": test_subscribe.name,
        "agent_type": original_agent_type.value,
        "start_time": test_subscribe.start_time.isoformat(),
        "end_time": test_subscribe.end_time.isoformat(),
        "event_level": [level.value for level in test_subscribe.event_level],
        "enable_webhook": True,
        "webhook_endpoint": "https://example.com/updated",
    }

    # Act
    response = test_client.put(f"/apis/v1/manager/event-center/subscribe/{subscribe_id}", json=partial_update)

    # Assert
    assert response.status_code == 200
    response_data = response.json()
    assert response_data["data"]["enable_webhook"] == partial_update["enable_webhook"]
    assert response_data["data"]["webhook_endpoint"] == partial_update["webhook_endpoint"]
    # agent_type should remain unchanged
    assert response_data["data"]["agent_type"] == original_agent_type.value


def test_update_subscribe_not_found(test_client):
    """Test updating a non-existent subscribe"""
    # Arrange
    fake_id = str(PydanticObjectId())
    update_payload = {
        "name": "updated_name",
        "agent_type": "chatops_interest_agent",
        "start_time": "2025-01-01T00:00:00Z",
        "end_time": "2025-12-31T23:59:59Z",
        "event_level": ["P0"],
    }

    # Act
    response = test_client.put(f"/apis/v1/manager/event-center/subscribe/{fake_id}", json=update_payload)

    # Assert
    assert response.status_code == 404


def test_toggle_subscribe_activate(test_client, test_subscribes):
    """Test activating an inactive subscribe"""
    # Arrange - get the inactive subscribe (index 2)
    inactive_subscribe = test_subscribes[2]
    subscribe_id = str(inactive_subscribe.id)
    toggle_payload = {"active": True}

    # Act
    response = test_client.put(f"/apis/v1/manager/event-center/subscribe/{subscribe_id}/toggle", json=toggle_payload)

    # Assert
    assert response.status_code == 200


def test_toggle_subscribe_deactivate(test_client, test_subscribe):
    """Test deactivating an active subscribe"""
    # Arrange
    subscribe_id = str(test_subscribe.id)
    toggle_payload = {"active": False}

    # Act
    response = test_client.put(f"/apis/v1/manager/event-center/subscribe/{subscribe_id}/toggle", json=toggle_payload)

    # Assert
    assert response.status_code == 200


def test_toggle_subscribe_not_found(test_client):
    """Test toggling a non-existent subscribe"""
    # Arrange
    fake_id = str(PydanticObjectId())
    toggle_payload = {"active": True}

    # Act
    response = test_client.put(f"/apis/v1/manager/event-center/subscribe/{fake_id}/toggle", json=toggle_payload)

    # Assert
    assert response.status_code == 404


def test_delete_subscribe_success(test_client, test_subscribe):
    """Test deleting a subscribe successfully"""
    # Arrange
    subscribe_id = str(test_subscribe.id)

    # Act
    response = test_client.delete(f"/apis/v1/manager/event-center/subscribe/{subscribe_id}")

    # Assert
    assert response.status_code == 200

    # Verify the subscribe is deleted
    get_response = test_client.get(f"/apis/v1/manager/event-center/subscribe/{subscribe_id}")
    assert get_response.status_code == 404


def test_delete_subscribe_not_found(test_client):
    """Test deleting a non-existent subscribe"""
    # Arrange
    fake_id = str(PydanticObjectId())

    # Act
    response = test_client.delete(f"/apis/v1/manager/event-center/subscribe/{fake_id}")

    # Assert
    assert response.status_code == 404


def test_create_then_get_subscribe(test_client):
    """Test creating a subscribe and then retrieving it"""
    # Arrange - create
    create_payload = {
        "name": "create_then_get_subscribe",
        "agent_type": "chatops_proactive_reply_agent",
        "start_time": "2025-01-01T00:00:00+00:00",
        "end_time": "2025-12-31T23:59:59+00:00",
        "event_level": ["P1"],
        "enable_webhook": False,
    }

    # Act - create
    create_response = test_client.post("/apis/v1/manager/event-center/subscribe/", json=create_payload)
    assert create_response.status_code == 201
    created_subscribe = create_response.json()["data"]
    # Use _id instead of uid
    subscribe_id = created_subscribe["_id"]

    # Act - get
    get_response = test_client.get(f"/apis/v1/manager/event-center/subscribe/{subscribe_id}")

    # Assert
    assert get_response.status_code == 200
    retrieved_subscribe = get_response.json()["data"]
    assert retrieved_subscribe["name"] == create_payload["name"]
    assert retrieved_subscribe["agent_type"] == create_payload["agent_type"]


def test_get_subscribes_multiple_filters(test_client, test_subscribes):
    """Test getting subscribes with multiple filters combined"""
    # Act - filter by agent_type and show_all
    response = test_client.get("/apis/v1/manager/event-center/subscribe/?agents=chatops_interest_agent&show_all=true")

    # Assert
    assert response.status_code == 200
    response_data = response.json()
    # Should return chatops_interest_agent subscribes (both active and inactive)
    for subscribe in response_data["data"]:
        assert subscribe["agent_type"] == "chatops_interest_agent"
