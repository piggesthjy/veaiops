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

from contextlib import asynccontextmanager
from typing import AsyncGenerator

import pytest
from fastapi import APIRouter, FastAPI
from fastapi.responses import JSONResponse
from fastapi.testclient import TestClient
from starlette.middleware import Middleware
from starlette.middleware.cors import CORSMiddleware

from veaiops.utils.app import combine_lifespans, create_fastapi_app, health_router


@pytest.fixture
def test_router():
    """Create a test router."""
    router = APIRouter()

    @router.get("/test")
    def test_endpoint():
        return {"message": "test"}

    return router


@pytest.mark.asyncio
async def test_healthz_endpoint():
    """Test the healthz endpoint."""
    app = FastAPI()
    app.include_router(health_router)

    with TestClient(app) as client:
        response = client.get("/healthz")
        assert response.status_code == 200
        assert response.text == "ok"
        assert response.headers["content-type"] == "text/plain; charset=utf-8"


@pytest.mark.asyncio
async def test_combine_lifespans_single():
    """Test combining a single lifespan function."""
    startup_called = []
    shutdown_called = []

    @asynccontextmanager
    async def lifespan1(app: FastAPI) -> AsyncGenerator[None, None]:
        startup_called.append("lifespan1")
        yield
        shutdown_called.append("lifespan1")

    combined = combine_lifespans(lifespan1)

    app = FastAPI()
    async with combined(app):
        assert startup_called == ["lifespan1"]
        assert shutdown_called == []

    assert shutdown_called == ["lifespan1"]


@pytest.mark.asyncio
async def test_combine_lifespans_multiple():
    """Test combining multiple lifespan functions."""
    startup_order = []
    shutdown_order = []

    @asynccontextmanager
    async def lifespan1(app: FastAPI) -> AsyncGenerator[None, None]:
        startup_order.append("lifespan1")
        yield
        shutdown_order.append("lifespan1")

    @asynccontextmanager
    async def lifespan2(app: FastAPI) -> AsyncGenerator[None, None]:
        startup_order.append("lifespan2")
        yield
        shutdown_order.append("lifespan2")

    @asynccontextmanager
    async def lifespan3(app: FastAPI) -> AsyncGenerator[None, None]:
        startup_order.append("lifespan3")
        yield
        shutdown_order.append("lifespan3")

    combined = combine_lifespans(lifespan1, lifespan2, lifespan3)

    app = FastAPI()
    async with combined(app):
        assert startup_order == ["lifespan1", "lifespan2", "lifespan3"]
        assert shutdown_order == []

    # Shutdown order should be reversed
    assert shutdown_order == ["lifespan3", "lifespan2", "lifespan1"]


def test_create_fastapi_app_minimal():
    """Test creating a FastAPI app with minimal configuration."""
    app = create_fastapi_app(title="Test App")

    assert isinstance(app, FastAPI)
    assert app.title == "Test App"

    # Test healthz endpoint is included
    with TestClient(app) as client:
        response = client.get("/healthz")
        assert response.status_code == 200


def test_create_fastapi_app_with_routers(test_router):
    """Test creating a FastAPI app with custom routers."""
    app = create_fastapi_app(title="Test App", routers=[test_router])

    with TestClient(app) as client:
        response = client.get("/test")
        assert response.status_code == 200
        assert response.json() == {"message": "test"}


def test_create_fastapi_app_with_middlewares():
    """Test creating a FastAPI app with middlewares."""
    middlewares = [
        Middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_methods=["*"],
            allow_headers=["*"],
        )
    ]

    app = create_fastapi_app(title="Test App", middlewares=middlewares)

    with TestClient(app) as client:
        response = client.options("/healthz", headers={"Origin": "http://example.com"})
        assert "access-control-allow-origin" in response.headers


def test_create_fastapi_app_with_exception_handlers():
    """Test creating a FastAPI app with custom exception handlers."""

    class CustomException(Exception):
        pass

    def custom_handler(request, exc):
        return JSONResponse(content={"error": "custom"}, status_code=400)

    app = create_fastapi_app(
        title="Test App",
        exception_handlers={CustomException: custom_handler},
    )

    @app.get("/error")
    def error_endpoint():
        raise CustomException()

    with TestClient(app) as client:
        response = client.get("/error")
        assert response.json() == {"error": "custom"}
        assert response.status_code == 400


@pytest.mark.asyncio
async def test_create_fastapi_app_with_lifespans():
    """Test creating a FastAPI app with lifespan functions."""
    startup_called = []

    @asynccontextmanager
    async def lifespan1(app: FastAPI) -> AsyncGenerator[None, None]:
        startup_called.append("lifespan1")
        yield

    @asynccontextmanager
    async def lifespan2(app: FastAPI) -> AsyncGenerator[None, None]:
        startup_called.append("lifespan2")
        yield

    app = create_fastapi_app(
        title="Test App",
        lifespans=[lifespan1, lifespan2],
    )

    # Trigger lifespan by creating a test client
    with TestClient(app) as client:
        # Lifespan should be called during startup
        assert "lifespan1" in startup_called
        assert "lifespan2" in startup_called
        response = client.get("/healthz")
        assert response.status_code == 200


def test_create_fastapi_app_with_all_options(test_router):
    """Test creating a FastAPI app with all configuration options."""

    @asynccontextmanager
    async def test_lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
        yield

    class CustomException(Exception):
        pass

    def custom_handler(request, exc):
        return JSONResponse(content={"error": "custom"}, status_code=400)

    middlewares = [
        Middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_methods=["*"],
        )
    ]

    app = create_fastapi_app(
        title="Test App",
        lifespans=[test_lifespan],
        middlewares=middlewares,
        routers=[test_router],
        exception_handlers={CustomException: custom_handler},
    )

    assert isinstance(app, FastAPI)
    assert app.title == "Test App"

    with TestClient(app) as client:
        # Test healthz endpoint
        response = client.get("/healthz")
        assert response.status_code == 200

        # Test custom router
        response = client.get("/test")
        assert response.status_code == 200
