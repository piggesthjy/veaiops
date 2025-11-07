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

"""Handler-specific test fixtures.

Note: Common fixtures (test_user) are now defined in the root tests/conftest.py
and automatically available. This conftest contains only handler-specific fixtures.
"""

from datetime import datetime, timezone
from unittest.mock import MagicMock

import pytest
import pytest_asyncio
from fastapi import Request
from pydantic import SecretStr

from veaiops.schema.documents import (
    Connect,
    InformStrategy,
    IntelligentThresholdTask,
    Subscribe,
    User,
)
from veaiops.schema.types import AgentType, DataSourceType, EventLevel


@pytest_asyncio.fixture
async def test_admin_user():
    """Create a test admin user."""
    from veaiops.utils.crypto import EncryptedSecretStr

    user = await User(
        username="admin",
        email="admin@example.com",
        password=EncryptedSecretStr("adminpass123"),
        is_active=True,
        is_supervisor=True,
    ).insert()

    yield user

    await user.delete()


@pytest_asyncio.fixture
async def test_connect():
    """Create a test connection for datasource tests."""
    connect = await Connect(
        name="Test Connect",
        type=DataSourceType.Aliyun,
        zabbix_api_url=None,
        zabbix_api_user=None,
        zabbix_api_password=None,
        aliyun_access_key_id="test_access_key",
        aliyun_access_key_secret=SecretStr("test_secret"),
        volcengine_access_key_id=None,
        volcengine_access_key_secret=None,
        is_active=True,
    ).insert()

    yield connect

    await connect.delete()


@pytest_asyncio.fixture
async def test_inform_strategy(test_bot, test_chat):
    """Create a test inform strategy."""
    strategy = await InformStrategy(
        name="Test Strategy",
        description="Test strategy description",
        channel=test_bot.channel,
        bot_id=test_bot.bot_id,
        chat_ids=[test_chat.chat_id],
        is_active=True,
    ).insert()

    yield strategy

    await strategy.delete()


@pytest_asyncio.fixture
async def test_subscribe():
    """Create a test subscribe."""
    start_time = datetime.now(timezone.utc)
    end_time = datetime(2025, 12, 31, tzinfo=timezone.utc)

    subscribe = await Subscribe(
        name="Test Subscribe",
        agent_type=AgentType.INTELLIGENT_THRESHOLD,
        start_time=start_time,
        end_time=end_time,
        event_level=[EventLevel.P0, EventLevel.P1],
        is_active=True,
    ).insert()

    yield subscribe

    await subscribe.delete()


@pytest_asyncio.fixture
async def test_intelligent_threshold_task(test_connect):
    """Create a test intelligent threshold task."""
    from beanie import PydanticObjectId

    task = await IntelligentThresholdTask(
        task_name="Test Task",
        datasource_id=test_connect.id if test_connect.id else PydanticObjectId(),
        datasource_type=DataSourceType.Aliyun,
        auto_update=False,
        projects=["test_project"],
        is_active=True,
    ).insert()

    yield task

    await task.delete()


@pytest.fixture
def mock_create_access_token(monkeypatch):
    """Mock create_access_token for testing."""

    def _mock_token(data, expires_delta=None):
        return f"mock_token_{data.get('sub', 'unknown')}"

    monkeypatch.setattr("veaiops.handler.middlewares.auth.create_access_token", _mock_token)
    return _mock_token


@pytest.fixture
def mock_request():
    """Create a mock Request object for testing."""
    return MagicMock(spec=Request)
