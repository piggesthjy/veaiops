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

"""Tests for HTTP client with context propagation."""

import httpx
import pytest

from veaiops.utils.client import AsyncClientWithCtx


@pytest.mark.asyncio
async def test_async_client_with_ctx_build_request_without_context():
    """Test build_request when context doesn't exist."""
    async with AsyncClientWithCtx() as client:
        request = client.build_request("GET", "https://example.com")

        # Should build request without adding context headers
        assert request.method == "GET"
        assert "X-Request-ID" not in request.headers
        assert "X-Correlation-ID" not in request.headers


@pytest.mark.asyncio
async def test_async_client_with_ctx_as_context_manager():
    """Test that AsyncClientWithCtx works as a context manager."""
    async with AsyncClientWithCtx() as client:
        # Should be able to use the client
        assert isinstance(client, AsyncClientWithCtx)
        assert isinstance(client, httpx.AsyncClient)

        # Test __aenter__ and __aexit__ paths
        assert client is not None


@pytest.mark.asyncio
async def test_async_client_with_ctx_build_request_basic():
    """Test basic build_request functionality."""
    async with AsyncClientWithCtx() as client:
        # Test GET request
        request = client.build_request("GET", "https://api.example.com/data")
        assert request.method == "GET"
        assert str(request.url).startswith("https://api.example.com/data")

        # Test POST request
        request2 = client.build_request("POST", "https://api.example.com/submit", json={"key": "value"})
        assert request2.method == "POST"


@pytest.mark.asyncio
async def test_async_client_with_ctx_with_request_id(mocker):
    """Test build_request with X-Request-ID in context."""
    request_id = "test-request-id-12345"

    # Mock starlette_context
    mock_context = mocker.patch("veaiops.utils.client.context")
    mock_context.exists.return_value = True
    mock_context.data = {"X-Request-ID": request_id}

    async with AsyncClientWithCtx() as client:
        request = client.build_request("GET", "https://example.com")

        # Should include X-Request-ID header
        assert request.headers["X-Request-ID"] == request_id


@pytest.mark.asyncio
async def test_async_client_with_ctx_with_correlation_id(mocker):
    """Test build_request with X-Correlation-ID in context."""
    correlation_id = "test-correlation-id-67890"

    # Mock starlette_context
    mock_context = mocker.patch("veaiops.utils.client.context")
    mock_context.exists.return_value = True
    mock_context.data = {"X-Correlation-ID": correlation_id}

    async with AsyncClientWithCtx() as client:
        request = client.build_request("GET", "https://example.com")

        # Should include X-Correlation-ID header
        assert request.headers["X-Correlation-ID"] == correlation_id


@pytest.mark.asyncio
async def test_async_client_with_ctx_with_both_headers(mocker):
    """Test build_request with both X-Request-ID and X-Correlation-ID."""
    request_id = "test-request-id-12345"
    correlation_id = "test-correlation-id-67890"

    # Mock starlette_context
    mock_context = mocker.patch("veaiops.utils.client.context")
    mock_context.exists.return_value = True
    mock_context.data = {
        "X-Request-ID": request_id,
        "X-Correlation-ID": correlation_id,
    }

    async with AsyncClientWithCtx() as client:
        request = client.build_request("GET", "https://example.com")

        # Should include both headers
        assert request.headers["X-Request-ID"] == request_id
        assert request.headers["X-Correlation-ID"] == correlation_id


@pytest.mark.asyncio
async def test_async_client_with_ctx_preserves_existing_headers(mocker):
    """Test that existing headers in request are preserved."""
    request_id = "context-request-id"

    # Mock starlette_context
    mock_context = mocker.patch("veaiops.utils.client.context")
    mock_context.exists.return_value = True
    mock_context.data = {"X-Request-ID": request_id}

    async with AsyncClientWithCtx() as client:
        # Build request with pre-existing X-Request-ID header
        request = client.build_request(
            "GET",
            "https://example.com",
            headers={"X-Request-ID": "existing-request-id", "Authorization": "Bearer token123"},
        )

        # Should NOT override existing X-Request-ID header
        assert request.headers["X-Request-ID"] == "existing-request-id"
        # Should preserve other headers
        assert request.headers["Authorization"] == "Bearer token123"


@pytest.mark.asyncio
async def test_async_client_with_ctx_with_none_values(mocker):
    """Test build_request when context has None values."""
    # Mock starlette_context with None values
    mock_context = mocker.patch("veaiops.utils.client.context")
    mock_context.exists.return_value = True
    mock_context.data = {
        "X-Request-ID": None,
        "X-Correlation-ID": None,
    }

    async with AsyncClientWithCtx() as client:
        request = client.build_request("GET", "https://example.com")

        # Should not add headers with None values
        assert "X-Request-ID" not in request.headers
        assert "X-Correlation-ID" not in request.headers


@pytest.mark.asyncio
async def test_async_client_with_ctx_with_empty_context(mocker):
    """Test build_request when context exists but is empty."""
    # Mock starlette_context with empty data
    mock_context = mocker.patch("veaiops.utils.client.context")
    mock_context.exists.return_value = True
    mock_context.data = {}

    async with AsyncClientWithCtx() as client:
        request = client.build_request("GET", "https://example.com")

        # Should not add any headers
        assert "X-Request-ID" not in request.headers
        assert "X-Correlation-ID" not in request.headers


@pytest.mark.asyncio
async def test_async_client_with_ctx_different_http_methods(mocker):
    """Test build_request with different HTTP methods."""
    request_id = "test-request-id"

    # Mock starlette_context
    mock_context = mocker.patch("veaiops.utils.client.context")
    mock_context.exists.return_value = True
    mock_context.data = {"X-Request-ID": request_id}

    async with AsyncClientWithCtx() as client:
        # Test various HTTP methods
        for method in ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"]:
            request = client.build_request(method, "https://example.com")
            assert request.method == method
            assert request.headers["X-Request-ID"] == request_id


@pytest.mark.asyncio
async def test_async_client_with_ctx_with_query_params(mocker):
    """Test build_request with query parameters."""
    request_id = "test-request-id"

    # Mock starlette_context
    mock_context = mocker.patch("veaiops.utils.client.context")
    mock_context.exists.return_value = True
    mock_context.data = {"X-Request-ID": request_id}

    async with AsyncClientWithCtx() as client:
        request = client.build_request("GET", "https://api.example.com/search", params={"q": "test", "limit": 10})

        # Should include context header and preserve query params
        assert request.headers["X-Request-ID"] == request_id
        assert "q=test" in str(request.url)
        assert "limit=10" in str(request.url)


@pytest.mark.asyncio
async def test_async_client_with_ctx_with_json_body(mocker):
    """Test build_request with JSON body."""
    request_id = "test-request-id"

    # Mock starlette_context
    mock_context = mocker.patch("veaiops.utils.client.context")
    mock_context.exists.return_value = True
    mock_context.data = {"X-Request-ID": request_id}

    async with AsyncClientWithCtx() as client:
        request = client.build_request("POST", "https://api.example.com", json={"name": "test", "value": 123})

        # Should include context header
        assert request.headers["X-Request-ID"] == request_id
        # Should have JSON content type
        assert "application/json" in request.headers.get("Content-Type", "")


@pytest.mark.asyncio
async def test_async_client_with_ctx_context_manager_with_exception():
    """Test that context manager handles exceptions properly."""
    try:
        async with AsyncClientWithCtx() as client:
            assert client is not None
            # Simulate an exception
            raise ValueError("Test exception")
    except ValueError:
        # Exception should be propagated, but client should be cleaned up
        pass
    # Test should complete without hanging


@pytest.mark.asyncio
async def test_async_client_with_ctx_multiple_requests(mocker):
    """Test multiple requests with same client instance."""
    request_id = "test-request-id"

    # Mock starlette_context
    mock_context = mocker.patch("veaiops.utils.client.context")
    mock_context.exists.return_value = True
    mock_context.data = {"X-Request-ID": request_id}

    async with AsyncClientWithCtx() as client:
        # Build multiple requests
        request1 = client.build_request("GET", "https://api1.example.com")
        request2 = client.build_request("POST", "https://api2.example.com")
        request3 = client.build_request("PUT", "https://api3.example.com")

        # All should have the context header
        assert request1.headers["X-Request-ID"] == request_id
        assert request2.headers["X-Request-ID"] == request_id
        assert request3.headers["X-Request-ID"] == request_id
