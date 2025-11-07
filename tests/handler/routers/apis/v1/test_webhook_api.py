#!/usr/bin/env python3
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


from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient

from veaiops.schema.types import ChannelType


def test_payload_webhook_unknown_provider():
    """
    Test that a 422 is returned when the provider is not a valid ChannelType enum value.
    """
    # Create a simple test app with the same route pattern
    app = FastAPI()

    @app.post("/apis/v1/hook/{provider}")
    async def payload_webhook(provider: ChannelType):
        return {"provider": provider.value}

    client = TestClient(app)
    response = client.post("/apis/v1/hook/unknown_provider", json={"data": "test"})
    assert response.status_code == 422
    assert isinstance(response.json()["detail"], list)

    # Verify that the response contains enum error information
    detail = response.json()["detail"]
    assert any("enum" in str(item).lower() for item in detail)


def test_payload_webhook_valid_provider_not_in_registry():
    """
    Test that a valid ChannelType provider that's not in the registry returns 404.
    """
    # Create a test app that simulates registry lookup
    app = FastAPI()
    EMPTY_REGISTRY = {}

    @app.post("/apis/v1/hook/{provider}")
    async def payload_webhook(provider: ChannelType):
        if provider not in EMPTY_REGISTRY:
            raise HTTPException(status_code=404, detail="Provider not found")
        return {"provider": provider.value}

    client = TestClient(app)
    response = client.post("/apis/v1/hook/Lark", json={"test": "data"})
    assert response.status_code == 404
    assert "Provider not found" in response.json()["detail"]
