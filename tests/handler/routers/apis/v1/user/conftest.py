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

"""Shared fixtures for user management tests.

Note: test_user fixture is available from the root tests/conftest.py
This conftest contains only user-module-specific fixtures.
"""

import pytest_asyncio

from veaiops.schema.documents.meta.user import User
from veaiops.utils.crypto import EncryptedSecretStr

# Note: test_user is inherited from root conftest


@pytest_asyncio.fixture
async def test_supervisor():
    """Fixture to create a supervisor test user for user management tests.

    Creates a user with:
    - username: "supervisor_user"
    - is_supervisor: True
    - created_user: "admin"

    Auto-cleanup after test.
    """
    user = User(
        username="supervisor_user",
        email="supervisor@example.com",
        password=EncryptedSecretStr("supervisor_password"),
        is_supervisor=True,
        created_user="admin",
        updated_user="admin",
    )
    await user.insert()
    yield user
    # Cleanup
    existing_user = await User.find_one(User.username == user.username)
    if existing_user:
        await existing_user.delete()


@pytest_asyncio.fixture
async def test_users(test_supervisor: User):
    """Factory fixture to create multiple test users for user management tests.

    Creates 3 regular users (user_1, user_2, user_3) with:
    - is_supervisor: False
    - created_user: supervisor_user's username

    Usage:
        async def test_something(test_users):
            # test_users is a list of 3 User documents
            assert len(test_users) == 3

    Auto-cleanup after test.
    """
    users = []
    for i in range(1, 4):
        user = User(
            username=f"user_{i}",
            email=f"user{i}@example.com",
            password=EncryptedSecretStr(f"password_{i}"),
            is_supervisor=False,
            created_user=test_supervisor.username,
            updated_user=test_supervisor.username,
        )
        await user.insert()
        users.append(user)

    yield users

    # Cleanup
    for user in users:
        existing_user = await User.find_one(User.username == user.username)
        if existing_user:
            await existing_user.delete()
