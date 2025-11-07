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

"""Tests for backend main application."""

from fastapi.testclient import TestClient

from veaiops.cmd.backend.main import app, get_app


def test_get_app_creation():
    """Test that get_app function creates FastAPI app successfully."""

    app = get_app()
    assert app.title == "VeAIOps-Backend"
    assert len(app.router.routes) > 0


def test_docs_endpoint_accessible():
    """Test that the /docs endpoint is accessible."""

    client = TestClient(app)
    response = client.get("/docs")
    assert response.status_code == 200


def test_openapi_endpoint_accessible():
    """Test that the /openapi.json endpoint is accessible."""

    client = TestClient(app)
    response = client.get("/openapi.json")
    assert response.status_code == 200
    assert "openapi" in response.json()


def test_cors_middleware_allows_all_origins():
    """Test that CORS middleware is configured to allow all origins."""

    client = TestClient(app)
    response = client.get("/docs", headers={"Origin": "http://localhost:3000"})
    assert response.status_code == 200
    assert "access-control-allow-origin" in response.headers


def test_middleware_stack_complete():
    """Test that middleware stack is properly configured."""

    middleware_classes = [getattr(m.cls, "__name__", "") for m in app.user_middleware]

    # Should have at least core middlewares
    assert "RawContextMiddleware" in middleware_classes
    assert "CORSMiddleware" in middleware_classes
    assert "AuthMiddleware" in middleware_classes
    # OpenTelemetryMiddleware may or may not be present depending on settings


def test_protected_paths_in_auth_middleware():
    """Test that protected paths are configured in AuthMiddleware."""

    # Find AuthMiddleware configuration
    auth_middleware = None
    for middleware in app.user_middleware:
        if getattr(middleware.cls, "__name__", "") == "AuthMiddleware":
            auth_middleware = middleware
            break

    assert auth_middleware is not None

    # Check that protected paths are configured
    protected_paths = auth_middleware.kwargs.get("protected_paths", [])
    assert isinstance(protected_paths, list)
    assert "/apis/v1/manager" in protected_paths
    assert "/apis/v1/datasource" in protected_paths
    assert "/apis/v1/intelligent-threshold" in protected_paths


def test_whitelist_paths_in_auth_middleware():
    """Test that whitelist paths are configured in AuthMiddleware."""

    # Find AuthMiddleware configuration
    auth_middleware = None
    for middleware in app.user_middleware:
        if getattr(middleware.cls, "__name__", "") == "AuthMiddleware":
            auth_middleware = middleware
            break

    assert auth_middleware is not None

    # Check that whitelist paths are configured
    whitelist_paths = auth_middleware.kwargs.get("whitelist_paths", [])
    assert isinstance(whitelist_paths, list)
    assert "/apis/v1/manager/event-center/event/chatops" in whitelist_paths
    assert "/apis/v1/manager/event-center/event/intelligent_threshold" in whitelist_paths
