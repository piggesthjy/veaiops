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

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, Request

from veaiops.handler.errors import ForbiddenError
from veaiops.handler.errors.errors import AlreadyExistsError, RecordNotFoundError
from veaiops.handler.services.user import (
    get_current_supervisor,
    get_current_supervisor_not_self,
    get_current_user,
    get_current_user_password_only,
)
from veaiops.schema.documents.meta.user import User
from veaiops.schema.models.base import APIResponse, PaginatedAPIResponse
from veaiops.schema.models.config import CreateUserPayload, UpdatePasswordPayload
from veaiops.utils.crypto import EncryptedSecretStr, decrypt_secret_value

user_manager_router = APIRouter()


@user_manager_router.post("/", response_model=APIResponse[User], dependencies=[Depends(get_current_supervisor)])
async def create_user(
    user_data: CreateUserPayload, current_user: User = Depends(get_current_user)
) -> APIResponse[User]:
    """Create a new user.

    Args:
        user_data (CreateUserPayload): User data to create.
        current_user (User): The current user creating this user.

    Returns:
        APIResponse[User]: Created user.
    """
    # Check if user already exists
    existing_user = await User.find_one({"username": user_data.username})
    if existing_user:
        raise AlreadyExistsError(message="User with this username already exists")

    # Create new user with encrypted password
    user = User(
        username=user_data.username,
        email=user_data.email,
        password=EncryptedSecretStr(user_data.password.get_secret_value()),
        is_supervisor=user_data.is_supervisor,
        created_user=current_user.username,
        updated_user=current_user.username,
    )
    await user.insert()

    return APIResponse(
        message="User created successfully",
        data=user,
    )


@user_manager_router.get("/{user_id}", response_model=APIResponse[User])
async def get_user(user_id: str) -> APIResponse[User]:
    """Get a user by ID.

    Args:
        user_id (str): The ID of the user to retrieve.

    Returns:
        APIResponse[User]: The API response containing the user information.
    """
    user = await User.get(user_id)
    if not user:
        raise RecordNotFoundError(message="User not found")

    return APIResponse(
        message="User retrieved successfully",
        data=user,
    )


@user_manager_router.get("/", response_model=PaginatedAPIResponse[List[User]])
async def list_users(
    request: Request, skip: int = 0, limit: int = 100, username: Optional[str] = None
) -> PaginatedAPIResponse[List[User]]:
    """List all users with optional username fuzzy matching.

    Args:
        request (Request): FastAPI request object.
        skip (int, optional): Skip the first N users. Defaults to 0.
        limit (int, optional): Limit the number of users returned. Defaults to 100.
        username (str, optional): Filter users by username (fuzzy matching). Defaults to None.

    Returns:
        PaginatedResponse[List[User]]: A list of users with pagination information.
    """
    # Build query based on whether username filter is provided
    if username:
        # Use regex for fuzzy matching (case-insensitive)
        query = User.find({"username": {"$regex": username, "$options": "i"}})
    else:
        query = User.find_all()

    # Calculate total count
    total = await query.count()

    users = await query.skip(skip).limit(limit).to_list()

    return PaginatedAPIResponse(
        message="Users retrieved successfully",
        data=users,
        limit=limit,
        skip=skip,
        total=total,
    )


@user_manager_router.put("/{user_id}", response_model=APIResponse, dependencies=[Depends(get_current_supervisor)])
async def update_user(user_id: str, user_update: Dict[str, Any]) -> APIResponse:
    """Update an existing user (excluding password).

    Args:
        user_id (str): User ID to update.
        user_update (Dict[str, Any]): Fields that needs to be updated (password not allowed).

    Returns:
        APIResponse: The API response containing the updated user information.
    """
    user = await User.get(user_id)
    if not user:
        raise RecordNotFoundError(message="User not found")

    # Validate and filter update fields - do not allow password field
    if "password" in user_update:
        raise RecordNotFoundError(message="Password cannot be updated through this endpoint.")

    # Validate and filter update fields using User class method (excluding password)
    validated_data = User.validate_update_fields(user_update)

    # Update user fields
    for key, value in validated_data.items():
        if value is not None:
            setattr(user, key, value)

    user.updated_at = datetime.now(timezone.utc)
    await user.save()

    return APIResponse(message="User updated successfully")


@user_manager_router.put(
    "/{user_id}/password", response_model=APIResponse, dependencies=[Depends(get_current_user_password_only)]
)
async def update_password(user_id: str, password_data: UpdatePasswordPayload) -> APIResponse:
    """Update user password.

    Args:
        user_id (str): User ID to update password for.
        password_data (UpdatePasswordPayload): Old and new password.

    Returns:
        APIResponse: The API response indicating the result of the password update.
    """
    user = await User.get(user_id)
    if not user:
        raise RecordNotFoundError(message="User not found")

    if password_data.old_password.get_secret_value() != decrypt_secret_value(user.password):
        raise ForbiddenError(message="Incorrect old password")

    user.password = EncryptedSecretStr(password_data.new_password.get_secret_value())
    user.updated_at = datetime.now(timezone.utc)
    await user.save()

    return APIResponse(message="Password updated successfully")


@user_manager_router.delete(
    "/{user_id}", response_model=APIResponse, dependencies=[Depends(get_current_supervisor_not_self)]
)
async def delete_user(user_id: str) -> APIResponse:
    """Delete a user.

    Args:
        user_id (str): User ID to delete.

    Returns:
        APIResponse: The API response indicating the result of the deletion.
    """
    user = await User.get(user_id)
    if not user:
        raise RecordNotFoundError(message="User not found")

    await user.delete()

    return APIResponse(message="User deleted successfully")
