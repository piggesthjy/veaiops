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

"""Tests for user service dependencies."""

from unittest.mock import MagicMock

import pytest

from veaiops.handler.errors import ForbiddenError, UnauthorizedError
from veaiops.handler.services.user.user import (
    get_current_supervisor,
    get_current_supervisor_not_self,
    get_current_user,
    get_current_user_password_only,
)


@pytest.mark.asyncio
async def test_get_current_user_authenticated(test_user):
    """Test get_current_user with authenticated user."""
    # Arrange
    request = MagicMock()
    request.state = MagicMock()
    request.state.user = test_user

    # Act
    result = await get_current_user(request)

    # Assert
    assert result == test_user
    assert result.username == "test_user"


@pytest.mark.asyncio
async def test_get_current_user_not_authenticated():
    """Test get_current_user without authentication."""
    # Arrange
    request = MagicMock()
    request.state = MagicMock()
    request.state.user = None

    # Act & Assert
    with pytest.raises(UnauthorizedError) as exc_info:
        await get_current_user(request)

    assert "Not authenticated" in str(exc_info.value.detail)


@pytest.mark.asyncio
async def test_get_current_supervisor_is_supervisor(test_supervisor):
    """Test get_current_supervisor with supervisor user."""
    # Act
    result = await get_current_supervisor(test_supervisor)

    # Assert
    assert result == test_supervisor
    assert result.is_supervisor is True


@pytest.mark.asyncio
async def test_get_current_supervisor_not_supervisor(test_regular_user):
    """Test get_current_supervisor with non-supervisor user."""
    # Act & Assert
    with pytest.raises(ForbiddenError) as exc_info:
        await get_current_supervisor(test_regular_user)

    assert "administrators" in str(exc_info.value.detail).lower()


@pytest.mark.asyncio
async def test_get_current_supervisor_not_self_allowed(test_supervisor, test_user):
    """Test get_current_supervisor_not_self with valid supervisor deleting other user."""
    # Arrange
    request = MagicMock()
    request.path_params = {"user_id": str(test_user.id)}

    # Act
    result = await get_current_supervisor_not_self(request, test_supervisor)

    # Assert
    assert result == test_supervisor
    assert result.is_supervisor is True


@pytest.mark.asyncio
async def test_get_current_supervisor_not_self_forbidden(test_supervisor):
    """Test get_current_supervisor_not_self when trying to delete self."""
    # Arrange
    request = MagicMock()
    request.path_params = {"user_id": str(test_supervisor.id)}

    # Act & Assert
    with pytest.raises(ForbiddenError) as exc_info:
        await get_current_supervisor_not_self(request, test_supervisor)

    assert "cannot delete themselves" in str(exc_info.value.detail).lower()


@pytest.mark.asyncio
async def test_get_current_user_password_only_allowed(test_user):
    """Test get_current_user_password_only when user updates own password."""
    # Arrange
    request = MagicMock()
    request.path_params = {"user_id": str(test_user.id)}

    # Act
    result = await get_current_user_password_only(request, test_user)

    # Assert
    assert result == test_user
    assert result.username == "test_user"


@pytest.mark.asyncio
async def test_get_current_user_password_only_forbidden(test_user, test_regular_user):
    """Test get_current_user_password_only when user tries to update another user's password."""
    # Arrange
    request = MagicMock()
    request.path_params = {"user_id": str(test_regular_user.id)}

    # Act & Assert
    with pytest.raises(ForbiddenError) as exc_info:
        await get_current_user_password_only(request, test_user)

    assert "only update your own password" in str(exc_info.value.detail).lower()
