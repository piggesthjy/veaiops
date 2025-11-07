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

"""Shared fixtures for auth tests."""

import pytest_asyncio

from veaiops.schema.documents.meta import User
from veaiops.utils.crypto import EncryptedSecretStr


@pytest_asyncio.fixture
async def test_users():
    """Factory fixture to create users with automatic cleanup.

    Usage in tests:
        async def test_example(test_users):
            # Create user with plaintext password
            user1 = await test_users(username="user1", password="password123")

            # Create another user
            user2 = await test_users(username="user2", password="secret456", email="user2@example.com")
            # All users automatically cleaned up after test
    """
    users = []

    async def _create(username: str, password: str, email: str | None = None, **kwargs):
        """Create a user and insert into database.

        Args:
            username: Username
            password: Password (will be stored as plaintext in test)
            email: Email address (defaults to username@example.com)
            **kwargs: Additional user attributes

        Returns:
            User: Created user document
        """
        if email is None:
            email = f"{username}@example.com"

        user = User(username=username, email=email, password=EncryptedSecretStr(password), **kwargs)
        await user.create()
        users.append(user)
        return user

    yield _create

    # Cleanup all created users
    for user in users:
        try:
            await user.delete()
        except Exception:
            pass
