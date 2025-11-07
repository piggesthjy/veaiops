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

from veaiops.handler.errors import UnauthorizedError
from veaiops.handler.middlewares.auth import authenticate_user, create_access_token, verify_token
from veaiops.handler.routers.apis.v1.auth import (
    LoginRequest,
    TokenResponse,
    login_for_access_token,
    refresh_access_token,
)


@pytest.mark.asyncio
async def test_login_invalid_password(test_user):
    """Test login with invalid password."""
    # Arrange
    login_request = LoginRequest(username="testuser", password="wrongpassword")

    # Act & Assert
    with pytest.raises(UnauthorizedError) as exc_info:
        await login_for_access_token(login_request)

    error = exc_info.value
    assert "Invalid username or password" in str(error)


@pytest.mark.asyncio
async def test_login_nonexistent_user():
    """Test login with nonexistent username."""
    # Arrange
    login_request = LoginRequest(username="nonexistent", password="anypassword")

    # Act & Assert
    with pytest.raises(UnauthorizedError) as exc_info:
        await login_for_access_token(login_request)

    error = exc_info.value
    assert "Invalid username or password" in str(error)


@pytest.mark.asyncio
async def test_login_inactive_user():
    """Test login with inactive user."""
    # Arrange
    from veaiops.schema.documents import User
    from veaiops.utils.crypto import EncryptedSecretStr

    inactive_user = await User(
        username="inactive",
        email="inactive@example.com",
        password=EncryptedSecretStr("password123"),
        is_active=False,
    ).insert()

    login_request = LoginRequest(username="inactive", password="password123")

    # Act & Assert
    with pytest.raises(UnauthorizedError) as exc_info:
        await login_for_access_token(login_request)

    error = exc_info.value
    assert "Invalid username or password" in str(error)

    # Cleanup
    await inactive_user.delete()


@pytest.mark.asyncio
async def test_authenticate_user_invalid():
    """Test authenticate_user function with invalid credentials."""
    # Act
    user = await authenticate_user("testuser", "wrongpassword")

    # Assert
    assert user is None


@pytest.mark.asyncio
async def test_create_and_verify_token(test_user):
    """Test token creation and verification."""
    # Act - Create token
    token = create_access_token(data={"sub": test_user.username})

    # Assert - Token is created
    assert token is not None
    assert len(token) > 0

    # Act - Verify token
    user_info = await verify_token(token)

    # Assert - Verification succeeds
    assert user_info is not None
    assert user_info.username == test_user.username


@pytest.mark.asyncio
async def test_verify_invalid_token():
    """Test verification of invalid token."""
    # Act
    user_info = await verify_token("invalid.token.string")

    # Assert
    assert user_info is None


@pytest.mark.asyncio
async def test_refresh_token_success(test_user):
    """Test successful token refresh."""
    # Arrange
    token = create_access_token(data={"sub": test_user.username})
    authorization_header = f"Bearer {token}"

    # Act
    response = await refresh_access_token(authorization=authorization_header)

    # Assert
    assert response.message == "Token refreshed successfully"
    assert response.data is not None
    assert response.data.username == test_user.username
    assert response.data.access_token is not None
    # Token should be valid and decode to the correct user
    verified_user = await verify_token(response.data.access_token)
    assert verified_user is not None
    assert verified_user.username == test_user.username


@pytest.mark.asyncio
async def test_refresh_token_no_header():
    """Test token refresh without authorization header."""
    # Act & Assert
    with pytest.raises(UnauthorizedError) as exc_info:
        await refresh_access_token(authorization=None)

    assert "Authorization header is required" in str(exc_info.value)


@pytest.mark.asyncio
async def test_refresh_token_invalid_scheme():
    """Test token refresh with invalid authorization scheme."""
    # Act & Assert
    with pytest.raises(UnauthorizedError) as exc_info:
        await refresh_access_token(authorization="Basic sometoken")

    assert "Invalid authorization scheme" in str(exc_info.value)


@pytest.mark.asyncio
async def test_refresh_token_malformed_header():
    """Test token refresh with malformed header."""
    # Act & Assert
    with pytest.raises(UnauthorizedError) as exc_info:
        await refresh_access_token(authorization="InvalidHeaderFormat")

    assert "Invalid authorization header format" in str(exc_info.value)


@pytest.mark.asyncio
async def test_refresh_token_invalid_token():
    """Test token refresh with invalid token."""
    # Act & Assert
    with pytest.raises(UnauthorizedError) as exc_info:
        await refresh_access_token(authorization="Bearer invalid.token.string")

    assert "Invalid token" in str(exc_info.value)


@pytest.mark.asyncio
async def test_login_response_structure():
    """Test that login response has correct structure."""
    # Arrange
    response_data = TokenResponse(username="testuser", access_token="sample_token")

    # Assert
    assert response_data.username == "testuser"
    assert response_data.access_token == "sample_token"


@pytest.mark.asyncio
async def test_login_request_validation():
    """Test LoginRequest model validation."""
    # Act
    login_req = LoginRequest(username="user", password="pass")

    # Assert
    assert login_req.username == "user"
    assert login_req.password == "pass"
