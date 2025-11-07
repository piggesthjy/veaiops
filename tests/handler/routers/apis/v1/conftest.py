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

"""Shared fixtures for v1 API router tests.

Design principles (following tests/conftest.py pattern):
- Global mocks as autouse fixtures (mock_verify_sign)
- Universal test fixtures (test_app, test_client)
- Domain-specific mocks in dedicated modules (e.g., mock_bot_creation_dependencies in system_config tests)
- Avoid accumulating too many fixtures - keep only what's truly universal
"""

import pytest
from fastapi.middleware.cors import CORSMiddleware
from fastapi.testclient import TestClient
from starlette.middleware import Middleware
from starlette_context import plugins
from starlette_context.middleware import RawContextMiddleware

from tests.handler.routers.apis.v1.test_utils import MockChannelBase
from veaiops.channel import REGISTRY
from veaiops.handler.routers.apis.v1 import verify, webcallbacks, webhooks
from veaiops.handler.routers.apis.v1.backend import backend_router
from veaiops.handler.routers.apis.v1.webhooks import hook_router
from veaiops.handler.services.user import get_current_user
from veaiops.lifespan import cache_lifespan, db_lifespan, otel_lifespan
from veaiops.schema.documents.meta.user import User
from veaiops.schema.types import ChannelType
from veaiops.settings import O11ySettings, get_settings
from veaiops.utils.app import create_fastapi_app

# ============================================================================
# Global Auto-use Fixtures (apply to all v1 API tests)
# ============================================================================


@pytest.fixture(autouse=True)
def mock_verify_sign(monkeypatch: pytest.MonkeyPatch):
    """Mock verify_sign to bypass authentication for all tests.

    This is auto-used to ensure all tests bypass authentication.
    """

    async def bypass_verify_sign(x_secret=None):
        return None

    monkeypatch.setattr(verify, "verify_sign", bypass_verify_sign)
    monkeypatch.setattr(webcallbacks, "verify_sign", bypass_verify_sign)
    monkeypatch.setattr(webhooks, "verify_sign", bypass_verify_sign)


# ============================================================================
# Universal Test Fixtures
# ============================================================================


@pytest.fixture
def mock_channel_class(monkeypatch: pytest.MonkeyPatch):
    """Mock channel registry with a test channel class."""
    test_channel = type("TestChannel", (MockChannelBase,), {})
    monkeypatch.setitem(REGISTRY, ChannelType.Lark, test_channel)


@pytest.fixture
def test_app():
    """Create a unified FastAPI test app with full middleware and lifespan configuration.

    This single test app fixture includes:
    - All middleware (CORS, Context, OpenTelemetry if enabled)
    - All lifespans (otel, cache, DB)
    - All routers (backend_router with /apis/v1 prefix)
    - Authentication middleware is excluded for easier testing

    This provides a complete application environment that closely mirrors
    production while being test-friendly. Can be used for all test scenarios.
    """

    o11y_settings = get_settings(O11ySettings)

    middlewares = [
        Middleware(
            RawContextMiddleware,  # type: ignore
            plugins=(
                plugins.RequestIdPlugin(validate=False),
                plugins.CorrelationIdPlugin(validate=False),
            ),
        ),
        Middleware(
            CORSMiddleware,  # type: ignore
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        ),
        # Note: AuthMiddleware is intentionally omitted for testing
    ]

    if o11y_settings.enabled:
        from opentelemetry.instrumentation.asgi import OpenTelemetryMiddleware

        middlewares.insert(2, Middleware(OpenTelemetryMiddleware))  # type: ignore

    # Include all lifespans for complete application setup
    lifespans = [otel_lifespan, cache_lifespan, db_lifespan]

    fastapi_app = create_fastapi_app(
        title="VeAIOps-Backend-Test",
        lifespans=lifespans,
        middlewares=middlewares,
        routers=[backend_router, hook_router],
    )

    # Override verify_sign dependency to bypass authentication for all tests
    async def bypass_verify_sign(x_secret=None):
        return None

    fastapi_app.dependency_overrides[verify.verify_sign] = bypass_verify_sign

    # Override get_current_user to return a test user for all tests
    from bson import ObjectId
    from pydantic import SecretStr

    test_user = User(
        username="testuser",
        email="test@example.com",
        password=SecretStr("testpassword"),
        is_supervisor=False,
    )
    test_user.id = ObjectId("507f1f77bcf86cd799439011")

    async def bypass_get_current_user(token: str | None = None):
        return test_user

    fastapi_app.dependency_overrides[get_current_user] = bypass_get_current_user

    return fastapi_app


@pytest.fixture
def test_client(test_app):
    """Create a test client for the FastAPI app.

    Uses the full test app with all middleware for realistic testing.
    """
    return TestClient(test_app)
