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

"""Tests for webhook endpoint."""

from fastapi.responses import JSONResponse

from tests.handler.routers.apis.v1.test_utils import MockChannelBase
from veaiops.channel import REGISTRY
from veaiops.schema.types import ChannelType

# Note: mock_channel_class and mock_verify_sign fixtures are now available
# from tests/handler/routers/apis/v1/conftest.py


def test_payload_webhook_success(test_client, mock_channel_class):
    """Test successful webhook payload handling."""
    # Arrange
    payload = {"challenge": "test_challenge_123", "type": "url_verification"}

    # Act
    response = test_client.post("/apis/v1/hook/Lark", json=payload)

    # Assert
    assert response.status_code == 200
    assert response.json()["challenge"] == "test_challenge_123"


def test_payload_webhook_unknown_provider(test_client):
    """Test webhook with unknown provider."""
    # Arrange
    payload = {"data": "test"}

    # Act
    response = test_client.post("/apis/v1/hook/UnknownChannel", json=payload)

    # Assert
    # FastAPI will return 422 for invalid enum values
    assert response.status_code == 422
    detail = response.json()["detail"]
    assert any("enum" in str(item).lower() or "type" in str(item).lower() for item in detail)


def test_payload_webhook_provider_not_in_registry(test_client, monkeypatch):
    """Test webhook with valid provider not in registry."""
    # Arrange
    # Clear registry to simulate provider not found
    original_registry = REGISTRY.copy()
    REGISTRY.clear()

    payload = {"data": "test"}

    try:
        # Act
        response = test_client.post("/apis/v1/hook/Lark", json=payload)

        # Assert
        assert response.status_code == 404
        response_data = response.json()
        # Response is wrapped in detail with APIResponse structure
        assert "detail" in response_data
        detail = response_data["detail"]
        assert "message" in detail
        assert "unknown provider" in detail["message"]
    finally:
        # Restore registry
        REGISTRY.clear()
        REGISTRY.update(original_registry)


def test_payload_webhook_invalid_json(test_client, mock_channel_class):
    """Test webhook with invalid JSON payload."""
    # Arrange - send invalid JSON
    headers = {"Content-Type": "application/json"}

    # Act
    response = test_client.post("/apis/v1/hook/Lark", content=b"invalid json{{{", headers=headers)

    # Assert
    assert response.status_code == 400
    response_data = response.json()
    # Response is wrapped in detail with APIResponse structure
    assert "detail" in response_data
    detail = response_data["detail"]
    assert "message" in detail
    assert "Invalid json payload" in detail["message"]


def test_payload_webhook_empty_payload(test_client, mock_channel_class):
    """Test webhook with empty payload."""
    # Arrange
    payload = {}

    # Act
    response = test_client.post("/apis/v1/hook/Lark", json=payload)

    # Assert
    assert response.status_code == 200
    # Challenge will be from the get with default
    assert "challenge" in response.json()


def test_payload_webhook_complex_payload(test_client, mock_channel_class):
    """Test webhook with complex payload structure."""
    # Arrange
    payload = {
        "challenge": "complex_challenge",
        "type": "event_callback",
        "event": {
            "type": "message",
            "user": "test_user",
            "text": "Hello",
            "ts": "1234567890.123456",
        },
    }

    # Act
    response = test_client.post("/apis/v1/hook/Lark", json=payload)

    # Assert
    assert response.status_code == 200
    assert response.json()["challenge"] == "complex_challenge"


def test_payload_webhook_adapter_instantiation(test_client, mock_channel_class):
    """Test that adapter is properly instantiated from registry."""
    # Arrange
    instantiation_count = []

    class CountingMockChannel(MockChannelBase):
        channel = ChannelType.Lark

        def __init__(self):
            super().__init__()
            instantiation_count.append(1)

        async def payload_response(self, payload: dict):
            return JSONResponse(content={"status": "ok"}, status_code=200)

    # Store original and register counting mock
    original_registry = REGISTRY.copy()
    REGISTRY[ChannelType.Lark] = CountingMockChannel

    try:
        payload = {"test": "data"}

        # Act
        response = test_client.post("/apis/v1/hook/Lark", json=payload)

        # Assert
        assert response.status_code == 200
        assert len(instantiation_count) == 1  # Adapter was instantiated once
    finally:
        # Restore registry
        REGISTRY.clear()
        REGISTRY.update(original_registry)
