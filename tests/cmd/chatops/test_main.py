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

"""Tests for chatops main application."""

from fastapi.testclient import TestClient


def test_get_app_creation():
    """Test that get_app function creates FastAPI app successfully."""
    from veaiops.cmd.chatops.main import get_app

    app = get_app()
    assert app.title == "VeAIOps-ChatOps"
    assert len(app.router.routes) > 0


def test_docs_endpoint_accessible():
    """Test that the /docs endpoint is accessible."""
    from veaiops.cmd.chatops.main import app

    client = TestClient(app)
    response = client.get("/docs")
    assert response.status_code == 200


def test_openapi_endpoint_accessible():
    """Test that the /openapi.json endpoint is accessible."""
    from veaiops.cmd.chatops.main import app

    client = TestClient(app)
    response = client.get("/openapi.json")
    assert response.status_code == 200
    assert "openapi" in response.json()


def test_cors_middleware_allows_all_origins():
    """Test that CORS middleware is configured to allow all origins."""
    from veaiops.cmd.chatops.main import app

    client = TestClient(app)
    response = client.get("/docs", headers={"Origin": "http://localhost:3000"})
    assert response.status_code == 200
    assert "access-control-allow-origin" in response.headers


def test_middleware_stack_complete():
    """Test that middleware stack is properly configured."""
    from veaiops.cmd.chatops.main import app

    middleware_classes = [getattr(m.cls, "__name__", "") for m in app.user_middleware]

    # Should have at least RawContextMiddleware and CORSMiddleware
    assert "RawContextMiddleware" in middleware_classes
    assert "CORSMiddleware" in middleware_classes
    # OpenTelemetryMiddleware may or may not be present depending on settings


def test_middlewares_order():
    """Test that middlewares are applied in correct order."""
    from veaiops.cmd.chatops.main import app

    # RawContextMiddleware should be first for request ID handling
    first_middleware_name = getattr(app.user_middleware[0].cls, "__name__", "")
    assert first_middleware_name == "RawContextMiddleware"
