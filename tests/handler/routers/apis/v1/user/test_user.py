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

"""Tests for user management handlers."""

import pytest
from beanie import PydanticObjectId

from veaiops.handler.errors.errors import AlreadyExistsError, ForbiddenError, RecordNotFoundError
from veaiops.handler.routers.apis.v1.user.user import (
    create_user,
    delete_user,
    get_user,
    list_users,
    update_password,
    update_user,
)
from veaiops.schema.documents.meta.user import User
from veaiops.schema.models.config.user import CreateUserPayload, UpdatePasswordPayload
from veaiops.utils.crypto import EncryptedSecretStr, SecretStr, decrypt_secret_value

# Note: Fixtures (test_user, test_supervisor, test_users) are now defined in conftest.py


# ==================== POST / create_user Tests ====================


@pytest.mark.asyncio
async def test_create_user_success(test_supervisor: User):
    """Test creating a new user successfully."""
    # Arrange
    payload = CreateUserPayload(  # type: ignore[call-arg]
        username="new_user",
        email="new_user@example.com",
        password=SecretStr("new_password"),
        is_supervisor=False,
    )

    # Act
    response = await create_user(user_data=payload, current_user=test_supervisor)

    # Assert
    assert response.message == "User created successfully"
    assert response.data is not None
    assert response.data.username == "new_user"
    assert response.data.email == "new_user@example.com"
    assert response.data.is_supervisor is False

    # Cleanup
    await response.data.delete()


@pytest.mark.asyncio
async def test_create_user_duplicate(test_supervisor: User, test_user: User):
    """Test creating a user with duplicate username fails."""
    # Arrange
    payload = CreateUserPayload(  # type: ignore[call-arg]
        username=test_user.username,
        email="different@example.com",
        password=SecretStr("another_password"),
        is_supervisor=False,
    )

    # Act & Assert
    with pytest.raises(AlreadyExistsError) as exc_info:
        await create_user(user_data=payload, current_user=test_supervisor)

    assert "already exists" in str(exc_info.value)


@pytest.mark.asyncio
async def test_create_supervisor_user(test_supervisor: User):
    """Test creating a supervisor user."""
    # Arrange
    payload = CreateUserPayload(  # type: ignore[call-arg]
        username="new_supervisor",
        email="new_sup@example.com",
        password=SecretStr("sup_password"),
        is_supervisor=True,
    )

    # Act
    response = await create_user(user_data=payload, current_user=test_supervisor)

    # Assert
    assert response.data is not None
    assert response.data.is_supervisor is True

    # Cleanup
    await response.data.delete()


# ==================== GET /{user_id} get_user Tests ====================


@pytest.mark.asyncio
async def test_get_user_success(test_user: User):
    """Test retrieving a user by ID successfully."""
    # Arrange
    assert test_user.id is not None

    # Act
    response = await get_user(user_id=str(test_user.id))

    # Assert
    assert response.message == "User retrieved successfully"
    assert response.data is not None
    assert response.data.username == test_user.username
    assert response.data.email == test_user.email


@pytest.mark.asyncio
async def test_get_user_not_found():
    """Test retrieving a non-existent user returns error."""
    # Arrange
    fake_id = str(PydanticObjectId())

    # Act & Assert
    with pytest.raises(RecordNotFoundError) as exc_info:
        await get_user(user_id=fake_id)

    assert "not found" in str(exc_info.value)


# ==================== GET / list_users Tests ====================


@pytest.mark.asyncio
async def test_list_users_no_filter(test_users):
    """Test listing all users without filters."""
    # Arrange
    from unittest.mock import MagicMock

    request = MagicMock()

    # Act
    response = await list_users(request=request, skip=0, limit=100, username=None)

    # Assert
    assert response.message == "Users retrieved successfully"
    assert response.data is not None
    assert len(response.data) >= 3
    assert response.total >= 3


@pytest.mark.asyncio
async def test_list_users_with_pagination(test_users):
    """Test listing users with pagination."""
    # Arrange
    from unittest.mock import MagicMock

    request = MagicMock()

    # Act
    response = await list_users(request=request, skip=0, limit=2, username=None)

    # Assert
    assert response.data is not None
    assert len(response.data) == 2
    assert response.limit == 2
    assert response.skip == 0


@pytest.mark.asyncio
async def test_list_users_with_username_filter(test_users):
    """Test listing users with username filter."""
    # Arrange
    from unittest.mock import MagicMock

    request = MagicMock()

    # Act
    response = await list_users(request=request, skip=0, limit=100, username="user_1")

    # Assert
    assert response.message == "Users retrieved successfully"
    assert response.data is not None
    assert len(response.data) >= 1
    # Verify the username matches the filter (case-insensitive regex)
    for user in response.data:
        assert "user_1" in user.username.lower() or "user_1" == user.username


@pytest.mark.asyncio
async def test_list_users_fuzzy_search(test_users):
    """Test listing users with fuzzy username search."""
    # Arrange
    from unittest.mock import MagicMock

    request = MagicMock()

    # Act - search for partial username
    response = await list_users(request=request, skip=0, limit=100, username="user")

    # Assert
    assert response.message == "Users retrieved successfully"
    assert response.data is not None
    assert len(response.data) >= 3
    # All results should contain "user" in username
    for user in response.data:
        assert "user" in user.username.lower()


# ==================== PUT /{user_id} update_user Tests ====================


@pytest.mark.asyncio
async def test_update_user_success(test_user: User):
    """Test updating user fields successfully."""
    # Arrange
    assert test_user.id is not None
    # Only is_active and is_supervisor are allowed by validate_update_fields
    update_data = {"is_supervisor": True, "is_active": False}

    # Act
    response = await update_user(user_id=str(test_user.id), user_update=update_data)

    # Assert
    assert response.message == "User updated successfully"

    # Verify update
    updated_user = await User.get(test_user.id)
    assert updated_user is not None
    assert updated_user.is_supervisor is True
    assert updated_user.is_active is False


@pytest.mark.asyncio
async def test_update_user_not_found():
    """Test updating a non-existent user."""
    # Arrange
    fake_id = str(PydanticObjectId())
    update_data = {"email": "new@example.com"}

    # Act & Assert
    with pytest.raises(RecordNotFoundError) as exc_info:
        await update_user(user_id=fake_id, user_update=update_data)

    assert "not found" in str(exc_info.value)


@pytest.mark.asyncio
async def test_update_user_password_not_allowed(test_user: User):
    """Test that password field cannot be updated through update_user."""
    # Arrange
    assert test_user.id is not None
    update_data = {"password": "new_password", "email": "new@example.com"}

    # Act & Assert
    with pytest.raises(RecordNotFoundError) as exc_info:
        await update_user(user_id=str(test_user.id), user_update=update_data)

    assert "Password cannot be updated" in str(exc_info.value)


# ==================== PUT /{user_id}/password update_password Tests ====================


@pytest.mark.asyncio
async def test_update_password_success(test_user: User):
    """Test updating user password with correct old password."""
    # Arrange
    assert test_user.id is not None
    old_password = "test_password"
    new_password = "new_test_password"

    payload = UpdatePasswordPayload(  # type: ignore[call-arg]
        old_password=SecretStr(old_password), new_password=SecretStr(new_password)
    )

    # Act
    response = await update_password(user_id=str(test_user.id), password_data=payload)

    # Assert
    assert response.message == "Password updated successfully"

    # Verify password was changed
    updated_user = await User.get(test_user.id)
    assert updated_user is not None
    assert decrypt_secret_value(updated_user.password) == new_password


@pytest.mark.asyncio
async def test_update_password_incorrect_old_password(test_user: User):
    """Test updating password with incorrect old password fails."""
    # Arrange
    assert test_user.id is not None
    payload = UpdatePasswordPayload(  # type: ignore[call-arg]
        old_password=SecretStr("wrong_password"), new_password=SecretStr("new_password")
    )

    # Act & Assert
    with pytest.raises(ForbiddenError) as exc_info:
        await update_password(user_id=str(test_user.id), password_data=payload)

    assert "Incorrect old password" in str(exc_info.value)


@pytest.mark.asyncio
async def test_update_password_user_not_found():
    """Test updating password for non-existent user."""
    # Arrange
    fake_id = str(PydanticObjectId())
    payload = UpdatePasswordPayload(  # type: ignore[call-arg]
        old_password=SecretStr("old_password"), new_password=SecretStr("new_password")
    )

    # Act & Assert
    with pytest.raises(RecordNotFoundError) as exc_info:
        await update_password(user_id=fake_id, password_data=payload)

    assert "not found" in str(exc_info.value)


# ==================== DELETE /{user_id} delete_user Tests ====================


@pytest.mark.asyncio
async def test_delete_user_success(test_supervisor: User):
    """Test deleting a user successfully."""
    # Arrange - Create a temporary user to delete
    temp_user = User(
        username="temp_user_to_delete",
        email="temp@example.com",
        password=EncryptedSecretStr("temp_password"),
        is_supervisor=False,
        created_user=test_supervisor.username,
        updated_user=test_supervisor.username,
    )
    await temp_user.insert()
    assert temp_user.id is not None

    # Act
    response = await delete_user(user_id=str(temp_user.id))

    # Assert
    assert response.message == "User deleted successfully"

    # Verify deletion
    deleted_user = await User.get(temp_user.id)
    assert deleted_user is None


@pytest.mark.asyncio
async def test_delete_user_not_found():
    """Test deleting a non-existent user."""
    # Arrange
    fake_id = str(PydanticObjectId())

    # Act & Assert
    with pytest.raises(RecordNotFoundError) as exc_info:
        await delete_user(user_id=fake_id)

    assert "not found" in str(exc_info.value)
