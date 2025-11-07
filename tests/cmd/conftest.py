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

"""Shared fixtures and utilities for cmd tests."""

import pytest
import pytest_asyncio

from veaiops.schema.documents import MetricTemplate, User
from veaiops.schema.types import MetricType
from veaiops.utils.crypto import EncryptedSecretStr

# Note: Common fixtures (mock_api_calls, test_bot, test_chat, test_messages)
# are now defined in the root tests/conftest.py and automatically available


@pytest.fixture(autouse=True)
def mock_reload_bot_group_chat(monkeypatch):
    """Mock reload_bot_group_chat to avoid external dependencies."""

    async def mock_reload(*args, **kwargs):
        return None

    monkeypatch.setattr("veaiops.utils.bot.reload_bot_group_chat", mock_reload)


# Note: test_user fixture is available from the root tests/conftest.py
# This conftest contains only cmd-module-specific fixtures


@pytest_asyncio.fixture
async def test_admin_user():
    """Create and insert an admin user into the database for tests."""
    admin = await User(
        username="admin_test_cmd",
        email="admin_cmd@example.com",
        password=EncryptedSecretStr("admin_password_123"),
        is_supervisor=True,
        is_active=True,
    ).insert()

    yield admin

    await admin.delete()


@pytest_asyncio.fixture
async def test_metric_template():
    """Create and insert a metric template into the database for tests."""
    template = await MetricTemplate(
        name="Test Template",
        metric_type=MetricType.ResourceUtilizationRate100,
        min_step=0.1,
        max_value=100.0,
        min_value=0.0,
        min_violation=0,
        min_violation_ratio=0,
        normal_range_start=0.0,
        normal_range_end=70.0,
        missing_value="0",
        failure_interval_expectation=300,
        display_unit="%",
        linear_scale=1,
        max_time_gap=600,
        min_ts_length=2880,
    ).insert()

    yield template

    await template.delete()
