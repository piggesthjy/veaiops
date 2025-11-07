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

"""Tests for user authentication."""

import pytest

from veaiops.handler.middlewares.auth import authenticate_user
from veaiops.schema.documents.meta import User


@pytest.mark.asyncio
async def test_authenticate_user_success(test_users):
    """Test successful user authentication with correct credentials."""
    # Arrange - create a test user
    await test_users(username="test_user", password="correct_password")

    # Act - authenticate with correct password
    result = await authenticate_user("test_user", "correct_password")

    # Assert - authentication succeeds
    assert result is not None
    assert result.username == "test_user"
    assert result.email == "test_user@example.com"


@pytest.mark.asyncio
async def test_authenticate_user_not_found():
    """Test authentication when user does not exist in database."""
    # Act - try to authenticate non-existent user
    result = await authenticate_user("nonexistent_user", "password")

    # Assert - authentication fails
    assert result is None


@pytest.mark.asyncio
async def test_authenticate_user_wrong_password(test_users):
    """Test authentication fails with incorrect password."""
    # Arrange - create a test user
    await test_users(username="test_user", password="correct_password")

    # Act - authenticate with wrong password
    result = await authenticate_user("test_user", "wrong_password")

    # Assert - authentication fails
    assert result is None


@pytest.mark.asyncio
async def test_authenticate_user_empty_username(test_users):
    """Test authentication with empty username returns None."""
    # Arrange - create a test user
    await test_users(username="test_user", password="password")

    # Act - try to authenticate with empty username
    result = await authenticate_user("", "password")

    # Assert - authentication fails
    assert result is None


@pytest.mark.asyncio
async def test_authenticate_user_empty_password(test_users):
    """Test authentication with empty password returns None."""
    # Arrange - create a test user
    await test_users(username="test_user", password="correct_password")

    # Act - try to authenticate with empty password
    result = await authenticate_user("test_user", "")

    # Assert - authentication fails
    assert result is None


@pytest.mark.asyncio
async def test_authenticate_user_case_sensitive_username(test_users):
    """Test that username authentication is case-sensitive."""
    # Arrange - create a test user with lowercase username
    await test_users(username="testuser", password="password123")

    # Act - try to authenticate with different case
    result_upper = await authenticate_user("TestUser", "password123")
    result_correct = await authenticate_user("testuser", "password123")

    # Assert - case must match exactly
    assert result_upper is None
    assert result_correct is not None
    assert result_correct.username == "testuser"


@pytest.mark.asyncio
async def test_authenticate_multiple_users(test_users):
    """Test authentication works correctly with multiple users in database."""
    # Arrange - create multiple test users
    await test_users(username="user1", password="password1")
    await test_users(username="user2", password="password2")
    await test_users(username="user3", password="password3")

    # Act - authenticate each user
    result1 = await authenticate_user("user1", "password1")
    result2 = await authenticate_user("user2", "password2")
    result3 = await authenticate_user("user3", "password3")

    # Assert - each user authenticates correctly
    assert result1 is not None
    assert result1.username == "user1"
    assert result2 is not None
    assert result2.username == "user2"
    assert result3 is not None
    assert result3.username == "user3"


@pytest.mark.asyncio
async def test_authenticate_user_with_custom_email(test_users):
    """Test authentication with user that has custom email."""
    # Arrange - create user with custom email
    await test_users(username="custom_user", password="password", email="custom@company.com")

    # Act - authenticate the user
    result = await authenticate_user("custom_user", "password")

    # Assert - authentication succeeds and email is preserved
    assert result is not None
    assert result.username == "custom_user"
    assert result.email == "custom@company.com"


@pytest.mark.asyncio
async def test_authenticate_user_returns_correct_user_object(test_users):
    """Test that authenticate_user returns the complete User document."""
    # Arrange - create a test user
    created_user = await test_users(username="test_user", password="password123")

    # Act - authenticate the user
    authenticated_user = await authenticate_user("test_user", "password123")

    # Assert - returned user has same ID and attributes as created user
    assert authenticated_user is not None
    assert authenticated_user.id == created_user.id
    assert authenticated_user.username == created_user.username
    assert authenticated_user.email == created_user.email


@pytest.mark.asyncio
async def test_authenticate_user_database_isolation(test_users):
    """Test that users are properly isolated in database queries."""
    # Arrange - create users with similar passwords
    await test_users(username="user_a", password="shared_password")
    await test_users(username="user_b", password="shared_password")

    # Act - authenticate each user
    result_a = await authenticate_user("user_a", "shared_password")
    result_b = await authenticate_user("user_b", "shared_password")

    # Assert - each gets their own user document
    assert result_a is not None
    assert result_b is not None
    assert result_a.username == "user_a"
    assert result_b.username == "user_b"
    assert result_a.id != result_b.id


@pytest.mark.asyncio
async def test_authenticate_user_verifies_user_exists_in_database(test_users):
    """Test that authentication verifies user exists in database."""
    # Arrange - create a user
    created_user = await test_users(username="db_user", password="password123")

    # Act - verify user can be found in database
    db_user = await User.find_one(User.username == "db_user")

    # Assert - user exists in database with correct attributes
    assert db_user is not None
    assert db_user.id == created_user.id
    assert db_user.username == "db_user"

    # Act - authenticate the user
    authenticated_user = await authenticate_user("db_user", "password123")

    # Assert - authentication returns same user from database
    assert authenticated_user is not None
    assert authenticated_user.id == db_user.id
