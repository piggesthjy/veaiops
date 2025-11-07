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

"""Tests for agent template endpoints."""

import pytest
import pytest_asyncio
from beanie import PydanticObjectId

from veaiops.schema.documents import AgentTemplate
from veaiops.schema.types import AgentType, ChannelType


@pytest_asyncio.fixture
async def test_agent_template():
    """Create a test agent template."""
    template = await AgentTemplate(
        agent_type=AgentType.CHATOPS_REACTIVE_REPLY,
        channel=ChannelType.Lark,
        template_id="test_template_123",
        is_active=True,
    ).insert()

    yield template

    await template.delete()


@pytest_asyncio.fixture
async def test_agent_templates():
    """Create multiple test agent templates."""
    templates = []

    # Template 1: Reactive reply for Lark
    template1 = await AgentTemplate(
        agent_type=AgentType.CHATOPS_REACTIVE_REPLY,
        channel=ChannelType.Lark,
        template_id="template_001",
        is_active=True,
    ).insert()
    templates.append(template1)

    # Template 2: Interest agent for Lark
    template2 = await AgentTemplate(
        agent_type=AgentType.CHATOPS_INTEREST,
        channel=ChannelType.Lark,
        template_id="template_002",
        is_active=True,
    ).insert()
    templates.append(template2)

    # Template 3: Proactive reply for Lark
    template3 = await AgentTemplate(
        agent_type=AgentType.CHATOPS_PROACTIVE_REPLY,
        channel=ChannelType.Lark,
        template_id="template_003",
        is_active=False,
    ).insert()
    templates.append(template3)

    yield templates

    # Cleanup
    for template in templates:
        await template.delete()


def test_create_agent_template_success(test_client):
    """Test creating agent templates successfully"""
    # Arrange
    payload = {
        "agents": ["chatops_reactive_reply_agent", "chatops_interest_agent"],
        "channel": "Lark",
        "template_id": "new_template_456",
    }

    # Act
    response = test_client.post("/apis/v1/manager/event-center/agent_template/", json=payload)

    # Assert
    assert response.status_code == 201
    response_data = response.json()
    assert "data" in response_data
    assert len(response_data["data"]) == 2
    assert response_data["data"][0]["agent_type"] == "chatops_reactive_reply_agent"
    assert response_data["data"][0]["channel"] == "Lark"
    assert response_data["data"][0]["template_id"] == "new_template_456"


def test_create_agent_template_multiple_agents(test_client):
    """Test creating agent templates with multiple agent types"""
    # Arrange
    payload = {
        "agents": ["chatops_reactive_reply_agent", "chatops_proactive_reply_agent", "chatops_interest_agent"],
        "channel": "Lark",
        "template_id": "multi_agent_template",
    }

    # Act
    response = test_client.post("/apis/v1/manager/event-center/agent_template/", json=payload)

    # Assert
    assert response.status_code == 201
    response_data = response.json()
    assert len(response_data["data"]) == 3
    agent_types = [item["agent_type"] for item in response_data["data"]]
    assert "chatops_reactive_reply_agent" in agent_types
    assert "chatops_proactive_reply_agent" in agent_types
    assert "chatops_interest_agent" in agent_types


def test_create_agent_template_empty_agents(test_client):
    """Test creating agent template with empty agents list"""
    # Arrange
    payload = {"agents": [], "channel": "Lark", "template_id": "empty_template"}

    # Act
    response = test_client.post("/apis/v1/manager/event-center/agent_template/", json=payload)

    # Assert
    assert response.status_code == 201
    response_data = response.json()
    assert "data" in response_data
    assert len(response_data["data"]) == 0


@pytest.mark.asyncio
async def test_get_agent_template_success(test_client, test_agent_template):
    """Test getting an agent template by ID successfully"""
    # Act
    response = test_client.get(f"/apis/v1/manager/event-center/agent_template/{test_agent_template.id}")

    # Assert
    assert response.status_code == 200
    response_data = response.json()
    assert "data" in response_data
    assert response_data["data"]["agent_type"] == "chatops_reactive_reply_agent"
    assert response_data["data"]["channel"] == "Lark"
    assert response_data["data"]["template_id"] == "test_template_123"


def test_get_agent_template_not_found(test_client):
    """Test getting a non-existent agent template"""
    # Arrange
    fake_id = str(PydanticObjectId())

    # Act
    response = test_client.get(f"/apis/v1/manager/event-center/agent_template/{fake_id}")

    # Assert
    assert response.status_code == 404
    response_data = response.json()
    assert "detail" in response_data


def test_get_agent_templates_all(test_client):
    """Test getting all agent templates without filters"""
    # Act
    response = test_client.get("/apis/v1/manager/event-center/agent_template/")

    # Assert
    assert response.status_code == 200
    response_data = response.json()
    assert "data" in response_data
    assert "total" in response_data
    assert "skip" in response_data
    assert "limit" in response_data
    assert isinstance(response_data["data"], list)


@pytest.mark.asyncio
async def test_get_agent_templates_with_agent_filter(test_client, test_agent_templates):
    """Test getting agent templates filtered by agent type"""
    # Act
    response = test_client.get("/apis/v1/manager/event-center/agent_template/?agents=chatops_reactive_reply_agent")

    # Assert
    assert response.status_code == 200
    response_data = response.json()
    assert "data" in response_data
    # Should get at least the created template
    filtered_data = [item for item in response_data["data"] if item["agent_type"] == "chatops_reactive_reply_agent"]
    assert len(filtered_data) > 0


@pytest.mark.asyncio
async def test_get_agent_templates_with_channel_filter(test_client, test_agent_templates):
    """Test getting agent templates filtered by channel"""
    # Act
    response = test_client.get("/apis/v1/manager/event-center/agent_template/?channels=Lark")

    # Assert
    assert response.status_code == 200
    response_data = response.json()
    assert "data" in response_data
    # Should get templates with Lark channel
    for item in response_data["data"]:
        assert item["channel"] == "Lark"


@pytest.mark.asyncio
async def test_get_agent_templates_with_template_id_filter(test_client, test_agent_templates):
    """Test getting agent templates filtered by template_id"""
    # Act
    response = test_client.get("/apis/v1/manager/event-center/agent_template/?template_id=template_0")

    # Assert
    assert response.status_code == 200
    response_data = response.json()
    assert "data" in response_data
    # Should get templates with template_0
    for item in response_data["data"]:
        if item["template_id"] == "template_0":
            assert item["template_id"] == "template_0"


@pytest.mark.asyncio
async def test_get_agent_templates_show_all_false(test_client, test_agent_templates):
    """Test getting only active agent templates"""
    # Act
    response = test_client.get("/apis/v1/manager/event-center/agent_template/?show_all=false")

    # Assert
    assert response.status_code == 200
    response_data = response.json()
    assert "data" in response_data
    # All returned items should be active
    for item in response_data["data"]:
        assert item["is_active"] is True


@pytest.mark.asyncio
async def test_get_agent_templates_show_all_true(test_client, test_agent_templates):
    """Test getting all agent templates including inactive ones"""
    # Act
    response = test_client.get("/apis/v1/manager/event-center/agent_template/?show_all=true")

    # Assert
    assert response.status_code == 200
    response_data = response.json()
    assert "data" in response_data
    # Should get both active and inactive templates
    assert len(response_data["data"]) >= 2


@pytest.mark.asyncio
async def test_get_agent_templates_with_pagination(test_client, test_agent_templates):
    """Test getting agent templates with pagination"""
    # Act
    response = test_client.get("/apis/v1/manager/event-center/agent_template/?skip=0&limit=1")

    # Assert
    assert response.status_code == 200
    response_data = response.json()
    assert "data" in response_data
    assert response_data["skip"] == 0
    assert response_data["limit"] == 1
    # Should return at most 1 item
    assert len(response_data["data"]) <= 1


@pytest.mark.asyncio
async def test_update_agent_template_success(test_client, test_agent_template):
    """Test updating an agent template successfully"""
    # Arrange
    payload = {"template_id": "updated_template_789"}

    # Act
    response = test_client.put(f"/apis/v1/manager/event-center/agent_template/{test_agent_template.id}", json=payload)

    # Assert
    assert response.status_code == 200
    response_data = response.json()
    assert "data" in response_data
    assert response_data["data"]["template_id"] == "updated_template_789"
    # Other fields should remain unchanged
    assert response_data["data"]["agent_type"] == "chatops_reactive_reply_agent"


def test_update_agent_template_not_found(test_client):
    """Test updating a non-existent agent template"""
    # Arrange
    fake_id = str(PydanticObjectId())
    payload = {"template_id": "updated_template"}

    # Act
    response = test_client.put(f"/apis/v1/manager/event-center/agent_template/{fake_id}", json=payload)

    # Assert
    assert response.status_code == 404
    response_data = response.json()
    assert "detail" in response_data


@pytest.mark.asyncio
async def test_update_agent_template_partial(test_client, test_agent_template):
    """Test partial update of agent template"""
    # Arrange - only update template_id
    payload = {"template_id": "partial_update_template"}

    # Act
    response = test_client.put(f"/apis/v1/manager/event-center/agent_template/{test_agent_template.id}", json=payload)

    # Assert
    assert response.status_code == 200
    response_data = response.json()
    assert response_data["data"]["template_id"] == "partial_update_template"
    # Other fields unchanged
    assert response_data["data"]["agent_type"] == "chatops_reactive_reply_agent"
    assert response_data["data"]["channel"] == "Lark"


@pytest.mark.asyncio
async def test_toggle_agent_template_activate(test_client, test_agent_template):
    """Test activating an agent template"""
    # Arrange
    # First deactivate it
    await test_agent_template.set({AgentTemplate.is_active: False})

    payload = {"active": True}

    # Act
    response = test_client.put(
        f"/apis/v1/manager/event-center/agent_template/{test_agent_template.id}/toggle", json=payload
    )

    # Assert
    assert response.status_code == 200
    # Verify it's activated
    updated_template = await AgentTemplate.get(test_agent_template.id)
    assert updated_template is not None
    assert updated_template.is_active is True


@pytest.mark.asyncio
async def test_toggle_agent_template_deactivate(test_client, test_agent_template):
    """Test deactivating an agent template"""
    # Arrange
    payload = {"active": False}

    # Act
    response = test_client.put(
        f"/apis/v1/manager/event-center/agent_template/{test_agent_template.id}/toggle", json=payload
    )

    # Assert
    assert response.status_code == 200
    # Verify it's deactivated
    updated_template = await AgentTemplate.get(test_agent_template.id)
    assert updated_template is not None
    assert updated_template.is_active is False


def test_toggle_agent_template_not_found(test_client):
    """Test toggling a non-existent agent template"""
    # Arrange
    fake_id = str(PydanticObjectId())
    payload = {"active": True}

    # Act
    response = test_client.put(f"/apis/v1/manager/event-center/agent_template/{fake_id}/toggle", json=payload)

    # Assert
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_agent_template_success(test_client, test_agent_template):
    """Test deleting an agent template successfully"""
    # Act
    response = test_client.delete(f"/apis/v1/manager/event-center/agent_template/{test_agent_template.id}")

    # Assert
    assert response.status_code == 200
    # Verify it's deleted
    deleted_template = await AgentTemplate.get(test_agent_template.id)
    assert deleted_template is None


def test_delete_agent_template_not_found(test_client):
    """Test deleting a non-existent agent template"""
    # Arrange
    fake_id = str(PydanticObjectId())

    # Act
    response = test_client.delete(f"/apis/v1/manager/event-center/agent_template/{fake_id}")

    # Assert
    assert response.status_code == 404


def test_create_then_get_agent_template(test_client):
    """Test creating and then fetching an agent template"""
    # Arrange & Act - Create
    payload = {
        "agents": ["chatops_reactive_reply_agent"],
        "channel": "Lark",
        "template_id": "lifecycle_template",
    }
    create_response = test_client.post("/apis/v1/manager/event-center/agent_template/", json=payload)

    # Assert creation
    assert create_response.status_code == 201
    response_data = create_response.json()["data"]
    assert len(response_data) == 1
    assert response_data[0]["agent_type"] == "chatops_reactive_reply_agent"
    assert response_data[0]["channel"] == "Lark"
    assert response_data[0]["template_id"] == "lifecycle_template"


@pytest.mark.asyncio
async def test_get_agent_templates_multiple_filters(test_client, test_agent_templates):
    """Test getting agent templates with multiple filters"""
    # Act
    response = test_client.get(
        "/apis/v1/manager/event-center/agent_template/?agents=chatops_reactive_reply_agent&channels=Lark&show_all=true"
    )

    # Assert
    assert response.status_code == 200
    response_data = response.json()
    assert "data" in response_data
    # All returned items should match filters
    for item in response_data["data"]:
        if item["agent_type"] == "chatops_reactive_reply_agent":
            assert item["channel"] == "Lark"
