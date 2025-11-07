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

"""Shared fixtures for handler/services/user tests."""

import pytest_asyncio

from veaiops.schema.documents.meta.user import User
from veaiops.utils.crypto import EncryptedSecretStr


@pytest_asyncio.fixture
async def test_supervisor():
    """Create and insert a supervisor user into the database for tests."""
    supervisor = await User(
        username="test_supervisor",
        email="supervisor@example.com",
        password=EncryptedSecretStr("supervisor_password"),
        is_supervisor=True,
    ).insert()

    yield supervisor

    # Cleanup - delete supervisor after test
    await supervisor.delete()


@pytest_asyncio.fixture
async def test_regular_user():
    """Create and insert a regular user into the database for tests."""
    user = await User(
        username="test_regular_user",
        email="regular@example.com",
        password=EncryptedSecretStr("user_password"),
        is_supervisor=False,
    ).insert()

    yield user

    # Cleanup - delete user after test
    await user.delete()
