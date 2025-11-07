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

"""Tests for webcallbacks endpoint."""

from tests.handler.routers.apis.v1.test_utils import MockChannelBase
from veaiops.channel import REGISTRY
from veaiops.schema.types import ChannelType

# Note: mock_channel_class and mock_verify_sign fixtures are now available
# from tests/handler/routers/apis/v1/conftest.py


def test_payload_callback_success(test_client, mock_channel_class):
    """Test successful callback handling."""
    # Arrange
    payload = {"type": "message.receive", "event": {"message": {"content": "Hello"}}}

    # Act
    response = test_client.post("/apis/v1/callback/Lark", json=payload)

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "handled"
    assert data["event_type"] == "message.receive"


def test_payload_callback_unknown_provider(test_client):
    """Test callback with unknown provider (invalid enum)."""
    # Arrange
    payload = {"data": "test"}

    # Act
    response = test_client.post("/apis/v1/callback/UnknownProvider", json=payload)

    # Assert
    # FastAPI will return 422 for invalid enum values
    assert response.status_code == 422
    detail = response.json()["detail"]
    assert any("enum" in str(item).lower() or "type" in str(item).lower() for item in detail)


def test_payload_callback_provider_not_in_registry(test_client, monkeypatch):
    """Test callback with valid provider not in registry."""
    # Arrange
    # Clear registry to simulate provider not found
    original_registry = REGISTRY.copy()
    REGISTRY.clear()

    payload = {"type": "test_event"}

    try:
        # Act
        response = test_client.post("/apis/v1/callback/Lark", json=payload)

        # Assert
        assert response.status_code == 404
        assert "unknown provider" in response.json()["detail"]
    finally:
        # Restore registry
        REGISTRY.clear()
        REGISTRY.update(original_registry)


def test_payload_callback_invalid_json(test_client, mock_channel_class):
    """Test callback with invalid JSON payload."""
    # Arrange - send invalid JSON
    headers = {"Content-Type": "application/json"}

    # Act
    response = test_client.post("/apis/v1/callback/Lark", content=b"invalid json{{{", headers=headers)

    # Assert
    assert response.status_code == 400
    response_data = response.json()
    # Response is wrapped in detail with APIResponse structure
    assert "detail" in response_data
    detail = response_data["detail"]
    assert "message" in detail
    assert "Invalid json payload" in detail["message"]


def test_payload_callback_empty_payload(test_client, mock_channel_class):
    """Test callback with empty payload."""
    # Arrange
    payload = {}

    # Act
    response = test_client.post("/apis/v1/callback/Lark", json=payload)

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "handled"
    assert data["event_type"] == "unknown"  # No 'type' in empty payload


def test_payload_callback_complex_payload(test_client, mock_channel_class):
    """Test callback with complex event payload."""
    # Arrange
    payload = {
        "type": "message.receive",
        "tenant_key": "test_tenant",
        "event": {
            "sender": {
                "sender_id": {"open_id": "ou_123"},
                "sender_type": "user",
            },
            "message": {
                "message_id": "om_123",
                "message_type": "text",
                "content": '{"text":"Hello World"}',
                "create_time": "1234567890",
            },
        },
    }

    # Act
    response = test_client.post("/apis/v1/callback/Lark", json=payload)

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "handled"
    assert data["event_type"] == "message.receive"


def test_payload_callback_adapter_instantiation(test_client, monkeypatch):
    """Test that adapter is properly instantiated from registry."""
    # Arrange
    instantiation_count = []

    class CountingMockChannel(MockChannelBase):
        channel = ChannelType.Lark

        def __init__(self):
            super().__init__()
            instantiation_count.append(1)

        async def callback_handle(self, payload: dict):
            return {"count": len(instantiation_count)}

    # Store original and register counting mock
    original_registry = REGISTRY.copy()
    REGISTRY[ChannelType.Lark] = CountingMockChannel

    try:
        payload = {"type": "test"}

        # Act
        response = test_client.post("/apis/v1/callback/Lark", json=payload)

        # Assert
        assert response.status_code == 200
        assert len(instantiation_count) == 1  # Adapter was instantiated once
        assert response.json()["count"] == 1
    finally:
        # Restore registry
        REGISTRY.clear()
        REGISTRY.update(original_registry)


def test_payload_callback_multiple_requests(test_client, mock_channel_class):
    """Test multiple callback requests."""
    # Arrange
    payloads = [
        {"type": "message.receive"},
        {"type": "message.read"},
        {"type": "app.open"},
    ]

    # Act & Assert
    for payload in payloads:
        response = test_client.post("/apis/v1/callback/Lark", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "handled"
        assert data["event_type"] == payload["type"]


def test_payload_callback_error_in_handler(test_client, monkeypatch):
    """Test callback when handler raises an exception."""

    class ErrorChannel(MockChannelBase):
        channel = ChannelType.Lark

        async def callback_handle(self, payload: dict):
            raise ValueError("Handler error")

    # Store original and register error channel
    original_registry = REGISTRY.copy()
    REGISTRY[ChannelType.Lark] = ErrorChannel

    try:
        payload = {"type": "test"}

        # Act
        response = test_client.post("/apis/v1/callback/Lark", json=payload)

        # Assert
        # An unhandled exception in callback_handle will result in an error response
        # The exact status code depends on error handling configuration
        assert response.status_code in [400, 500]
    finally:
        # Restore registry
        REGISTRY.clear()
        REGISTRY.update(original_registry)
