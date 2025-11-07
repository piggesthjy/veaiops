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

"""Tests for event endpoints."""

from beanie import PydanticObjectId


def test_get_event_not_found(test_client):
    """Test getting a non-existent event"""
    # Arrange
    fake_id = str(PydanticObjectId())

    # Act
    response = test_client.get(f"/apis/v1/manager/event-center/event/{fake_id}")

    # Assert
    assert response.status_code == 404


def test_get_events_all(test_client):
    """Test getting all events"""
    # Act
    response = test_client.get("/apis/v1/manager/event-center/event/")

    # Assert
    assert response.status_code == 200
    response_data = response.json()
    assert "data" in response_data
    assert isinstance(response_data["data"], list)


def test_get_events_with_agent_type_filter(test_client):
    """Test getting events filtered by agent_type"""
    # Act
    response = test_client.get("/apis/v1/manager/event-center/event/?agent_type=chatops_interest_agent")

    # Assert
    assert response.status_code == 200
    response_data = response.json()
    assert "data" in response_data


def test_get_events_with_status_filter(test_client):
    """Test getting events filtered by status"""
    # Act
    response = test_client.get("/apis/v1/manager/event-center/event/?status=0")

    # Assert
    assert response.status_code == 200
    response_data = response.json()
    assert "data" in response_data


def test_get_events_with_level_filter(test_client):
    """Test getting events filtered by level"""
    # Act
    response = test_client.get("/apis/v1/manager/event-center/event/?level=P2")

    # Assert
    assert response.status_code == 200
    response_data = response.json()
    assert "data" in response_data


def test_get_events_with_region_filter(test_client):
    """Test getting events filtered by region"""
    # Act
    response = test_client.get("/apis/v1/manager/event-center/event/?region=us-east-1")

    # Assert
    assert response.status_code == 200
    response_data = response.json()
    assert "data" in response_data


def test_get_events_with_pagination(test_client):
    """Test getting events with pagination"""
    # Act
    response = test_client.get("/apis/v1/manager/event-center/event/?skip=0&limit=10")

    # Assert
    assert response.status_code == 200
    response_data = response.json()
    assert "data" in response_data
    assert "total" in response_data


def test_get_events_with_multiple_filters(test_client):
    """Test getting events with multiple filters"""
    # Act
    response = test_client.get(
        "/apis/v1/manager/event-center/event/?agent_type=chatops_interest_agent&status=0&level=P2"
    )

    # Assert
    assert response.status_code == 200
    response_data = response.json()
    assert "data" in response_data
