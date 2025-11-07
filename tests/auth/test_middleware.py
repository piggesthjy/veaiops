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

import pytest
from starlette.applications import Starlette
from starlette.responses import Response

from veaiops.handler.errors import UnauthorizedError
from veaiops.handler.middlewares.auth import AuthMiddleware

# Note: test_user fixture is now defined in conftest.py


def test_middleware_init():
    """Test middleware initialization."""
    app = Starlette()
    middleware = AuthMiddleware(app, protected_paths=["/api", "/admin"])
    assert middleware.app == app
    assert middleware.protected_paths == ["/api", "/admin"]


def test_middleware_init_no_protected_paths():
    """Test middleware initialization without protected paths."""
    app = Starlette()
    middleware = AuthMiddleware(app)
    assert middleware.app == app
    assert middleware.protected_paths is None


def test_is_protected_path_protected():
    """Test _is_protected_path with protected path."""
    app = Starlette()
    middleware = AuthMiddleware(app, protected_paths=["/api/v1/protected", "/admin"])
    assert middleware._is_protected_path("/api/v1/protected/test") is True
    assert middleware._is_protected_path("/admin/users") is True


def test_is_protected_path_not_protected():
    """Test _is_protected_path with non-protected path."""
    app = Starlette()
    middleware = AuthMiddleware(app, protected_paths=["/api/v1/protected", "/admin"])
    assert middleware._is_protected_path("/public/health") is False
    assert middleware._is_protected_path("/") is False


def test_is_protected_path_no_protected_paths():
    """Test _is_protected_path when no protected paths are set."""
    app = Starlette()
    middleware = AuthMiddleware(app)
    assert middleware._is_protected_path("/any/path") is False


def test_extract_token_valid_bearer(mocker):
    """Test _extract_token with valid Bearer token."""
    app = Starlette()
    middleware = AuthMiddleware(app, protected_paths=["/api/v1/protected", "/admin"])

    request = mocker.MagicMock()
    request.headers = {"Authorization": "Bearer valid_token_123"}

    token = middleware._extract_token(request)
    assert token == "valid_token_123"


def test_extract_token_no_authorization_header(mocker):
    """Test _extract_token with no Authorization header."""
    app = Starlette()
    middleware = AuthMiddleware(app, protected_paths=["/api/v1/protected", "/admin"])

    request = mocker.MagicMock()
    request.headers = {}

    token = middleware._extract_token(request)
    assert token is None


def test_extract_token_invalid_format(mocker):
    """Test _extract_token with invalid Authorization format."""
    app = Starlette()
    middleware = AuthMiddleware(app, protected_paths=["/api/v1/protected", "/admin"])

    request = mocker.MagicMock()
    request.headers = {"Authorization": "invalid_format"}

    token = middleware._extract_token(request)
    assert token is None


def test_extract_token_not_bearer(mocker):
    """Test _extract_token with non-Bearer token."""
    app = Starlette()
    middleware = AuthMiddleware(app, protected_paths=["/api/v1/protected", "/admin"])

    request = mocker.MagicMock()
    request.headers = {"Authorization": "Basic dXNlcjpwYXNz"}

    token = middleware._extract_token(request)
    assert token is None


def test_extract_token_case_insensitive_bearer(mocker):
    """Test _extract_token with case variations of Bearer."""
    app = Starlette()
    middleware = AuthMiddleware(app, protected_paths=["/api/v1/protected", "/admin"])

    request = mocker.MagicMock()
    request.headers = {"Authorization": "bearer valid_token_123"}

    token = middleware._extract_token(request)
    assert token == "valid_token_123"

    request.headers = {"Authorization": "BEARER valid_token_123"}
    token = middleware._extract_token(request)
    assert token == "valid_token_123"


@pytest.mark.asyncio
async def test_authenticate_user_valid_token(mocker, test_user):
    """Test _authenticate_user with valid token."""
    app = Starlette()
    middleware = AuthMiddleware(app, protected_paths=["/api/v1/protected", "/admin"])

    # Mock JWT decode
    mock_payload = {"sub": test_user.username, "exp": 1234567890}
    mocker.patch("veaiops.handler.middlewares.auth.jwt.decode", return_value=mock_payload)

    result = await middleware._authenticate_user("valid_token")

    assert result is not None
    assert result.username == test_user.username


@pytest.mark.asyncio
async def test_authenticate_user_invalid_token(mocker):
    """Test _authenticate_user with invalid token."""
    app = Starlette()
    middleware = AuthMiddleware(app, protected_paths=["/api/v1/protected", "/admin"])

    # Mock JWT decode to raise JWTError
    from jose import JWTError

    mocker.patch("veaiops.handler.middlewares.auth.jwt.decode", side_effect=JWTError())

    result = await middleware._authenticate_user("invalid_token")
    assert result is None


@pytest.mark.asyncio
async def test_authenticate_user_no_username_in_payload(mocker):
    """Test _authenticate_user with no username in payload."""
    app = Starlette()
    middleware = AuthMiddleware(app, protected_paths=["/api/v1/protected", "/admin"])

    # Mock JWT decode with payload missing 'sub'
    mock_payload = {"exp": 1234567890}
    mocker.patch("veaiops.handler.middlewares.auth.jwt.decode", return_value=mock_payload)

    result = await middleware._authenticate_user("token_without_sub")
    assert result is None


@pytest.mark.asyncio
async def test_dispatch_unprotected_path(mocker):
    """Test dispatch with unprotected path."""
    app = Starlette()
    middleware = AuthMiddleware(app, protected_paths=["/api/v1/protected", "/admin"])

    request = mocker.MagicMock()
    request.url.path = "/public/health"

    call_next = mocker.AsyncMock(return_value=Response("OK"))

    response = await middleware.dispatch(request, call_next)

    assert isinstance(response, Response)
    call_next.assert_called_once_with(request)


@pytest.mark.asyncio
async def test_dispatch_no_token(mocker):
    """Test dispatch with protected path but no token."""
    app = Starlette()
    middleware = AuthMiddleware(app, protected_paths=["/api/v1/protected", "/admin"])

    request = mocker.MagicMock()
    request.url.path = "/api/v1/protected/test"
    request.headers = {}

    call_next = mocker.AsyncMock()

    with pytest.raises(UnauthorizedError):
        await middleware.dispatch(request, call_next)

    call_next.assert_not_called()


@pytest.mark.asyncio
async def test_dispatch_invalid_token(mocker):
    """Test dispatch with protected path and invalid token."""
    app = Starlette()
    middleware = AuthMiddleware(app, protected_paths=["/api/v1/protected", "/admin"])

    request = mocker.MagicMock()
    request.url.path = "/api/v1/protected/test"
    request.headers = {"Authorization": "Bearer invalid_token"}

    # Mock _authenticate_user to return None
    mocker.patch.object(middleware, "_authenticate_user", new=mocker.AsyncMock(return_value=None))

    call_next = mocker.AsyncMock()

    with pytest.raises(UnauthorizedError) as exc_info:
        await middleware.dispatch(request, call_next)

    assert exc_info.value.detail["message"] == "Invalid Token"
    call_next.assert_not_called()


@pytest.mark.asyncio
async def test_dispatch_valid_token(mocker):
    """Test dispatch with protected path and valid token."""
    app = Starlette()
    middleware = AuthMiddleware(app, protected_paths=["/api/v1/protected", "/admin"])

    request = mocker.MagicMock()
    request.url.path = "/api/v1/protected/test"
    request.headers = {"Authorization": "Bearer valid_token"}
    request.state = mocker.MagicMock()

    # Mock _authenticate_user to return user info
    user_info = {"username": "test_user", "is_supervisor": True}
    mocker.patch.object(middleware, "_authenticate_user", return_value=user_info)

    call_next = mocker.AsyncMock(return_value=Response("Success"))

    response = await middleware.dispatch(request, call_next)

    assert isinstance(response, Response)
    assert request.state.user == user_info
    call_next.assert_called_once_with(request)
