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

"""Simplified tests for initial main module."""

from typing import List

import pytest
from mongomock_motor import AsyncMongoMockClient

from veaiops.cmd.initial.default_metric_templates import DEFAULT_METRIC_TEMPLATES
from veaiops.cmd.initial.main import init_admin_user, init_metric_templates
from veaiops.schema.documents import Bot, User, VeKB
from veaiops.schema.documents.template.metric import MetricTemplate
from veaiops.schema.types import MetricType
from veaiops.utils.crypto import EncryptedSecretStr


class _MockMongoClientWithClose:
    """Wrapper around AsyncMongoMockClient that provides async close()."""

    def __init__(self, uri):
        self._client = AsyncMongoMockClient(uri)

    def __getattr__(self, name):
        return getattr(self._client, name)

    async def close(self):
        """Mock async close method."""
        pass


@pytest.mark.asyncio
async def test_metric_template_structure_and_crud():
    """Test metric template data structure, creation, and duplicate handling."""
    # Verify default templates structure
    assert len(DEFAULT_METRIC_TEMPLATES) > 0
    for template in DEFAULT_METRIC_TEMPLATES:
        assert "name" in template and "metric_type" in template
        assert "min_step" in template and "max_value" in template

    # Test creating a metric template
    template = await MetricTemplate(
        name="测试模板",
        metric_type=MetricType.Count,
        min_step=1,
        max_value=1000,
        min_value=0,
        min_violation=0,
        min_violation_ratio=0,
        normal_range_start=0,
        normal_range_end=100,
        missing_value="0",
        failure_interval_expectation=300,
        display_unit="个",
        linear_scale=1,
        max_time_gap=600,
        min_ts_length=2880,
    ).insert()

    assert template.id is not None
    assert template.name == "测试模板"

    # Test duplicate check
    existing = await MetricTemplate.find_one({"name": "测试模板", "metric_type": MetricType.Count})
    assert existing is not None

    # Cleanup
    await template.delete()


@pytest.mark.asyncio
async def test_init_metric_templates_execution(monkeypatch, test_metric_template):
    """Test init_metric_templates function execution and skip existing."""
    monkeypatch.setattr("veaiops.cmd.initial.main.AsyncMongoClient", _MockMongoClientWithClose)

    initial_count = await MetricTemplate.find({}).count()
    await init_metric_templates()

    # Should have imported templates
    final_count = await MetricTemplate.find({}).count()
    assert final_count >= initial_count


@pytest.mark.asyncio
async def test_admin_user_creation_and_password():
    """Test admin user creation, password encryption, and field validation."""
    # Create admin user with encrypted password
    password = "test_password_123"
    user = await User(
        username="test_admin",
        email="test_admin@example.com",
        password=EncryptedSecretStr(password),
        is_supervisor=True,
        is_active=True,
    ).insert()

    # Verify fields
    assert user.username == "test_admin"
    assert user.email == "test_admin@example.com"
    assert user.is_supervisor is True
    assert user.is_active is True
    assert hasattr(user.password, "get_secret_value")

    # Test duplicate check
    existing = await User.find_one({"username": "test_admin"})
    assert existing is not None

    # Cleanup
    await user.delete()


@pytest.mark.asyncio
async def test_init_admin_user_execution_and_validation(monkeypatch):
    """Test init_admin_user function with various scenarios."""
    test_username = "test_init_admin"

    # Test with valid credentials
    monkeypatch.setenv("INIT_ADMIN_USERNAME", test_username)
    monkeypatch.setenv("INIT_ADMIN_EMAIL", "init_admin@example.com")
    monkeypatch.setenv("INIT_ADMIN_PASSWORD", "secure_password")
    monkeypatch.setattr("veaiops.cmd.initial.main.AsyncMongoClient", _MockMongoClientWithClose)

    await User.find({"username": test_username}).delete()
    await init_admin_user()

    user = await User.find_one({"username": test_username})
    assert user is not None
    assert user.is_supervisor is True

    # Cleanup
    await user.delete()

    # Test missing password
    monkeypatch.delenv("INIT_ADMIN_PASSWORD", raising=False)
    with pytest.raises(ValueError, match="INIT_ADMIN_PASSWORD not set"):
        await init_admin_user()


@pytest.mark.asyncio
async def test_bot_creation_and_secret_encryption(monkeypatch):
    """Test bot creation, secret encryption, and skipping logic."""
    from veaiops.schema.types import ChannelType

    # Create bot with encrypted secret
    bot = await Bot(
        channel=ChannelType.Lark,
        bot_id="test_bot_123",
        secret=EncryptedSecretStr("bot_secret"),
    ).insert()

    assert bot.bot_id == "test_bot_123"
    assert hasattr(bot.secret, "get_secret_value")

    # Test duplicate check
    existing = await Bot.find_one({"bot_id": "test_bot_123"})
    assert existing is not None

    # Cleanup
    await bot.delete()


@pytest.mark.asyncio
async def test_init_all_function_integration(monkeypatch):
    """Test init_all executes all initialization functions."""
    from veaiops.cmd.initial.main import init_all
    from veaiops.schema.types import ChannelType

    # Setup environment
    test_username = "test_init_all"
    test_bot_id = "test_init_all_bot"

    monkeypatch.setenv("INIT_ADMIN_USERNAME", test_username)
    monkeypatch.setenv("INIT_ADMIN_EMAIL", "init_all@example.com")
    monkeypatch.setenv("INIT_ADMIN_PASSWORD", "test_password")

    class MockBotSettings:
        id = test_bot_id
        secret_value = "test_secret"

        @property
        def channel(self):
            return ChannelType.Lark

        @property
        def secret(self):
            return EncryptedSecretStr(self.secret_value)

    class MockVolcEngineSettings:
        @property
        def ak(self):
            return EncryptedSecretStr("mockAk")

        @property
        def sk(self):
            return EncryptedSecretStr("mockSk")

        tos_endpoint: str = ""
        tos_region: str = ""
        extra_kb_collections: List[str] = ["mockCollection", "mockCollection", ""]

    class MockAgentSettings:
        provider: str = "openai"  # e.g., openai, azure, volcengine, etc.
        name: str = "mockModel"
        embedding_name: str = "mockEmbeddingModel"

        @property
        def api_key(self):
            return EncryptedSecretStr("mock_api_key")

        api_base: str = "https://ark.cn-beijing.volces.com/api/v3"  # e.g., for Azure or custom endpoints

    def mock_get_settings(settings_cls):
        from veaiops.settings import AgentSettings, BotSettings, MongoSettings, VolcEngineSettings

        if settings_cls == BotSettings:
            return MockBotSettings()
        if settings_cls == MongoSettings:
            return MongoSettings()
        if settings_cls == VolcEngineSettings:
            return MockVolcEngineSettings()
        if settings_cls == AgentSettings:
            return MockAgentSettings()
        return settings_cls()

    async def mock_set_default_bot(bot: Bot):
        pass

    async def mock_reload_bot_group_chat(bot_id: str, channel: ChannelType):
        pass

    monkeypatch.setattr("veaiops.cmd.initial.main.get_settings", mock_get_settings)
    monkeypatch.setattr("veaiops.cmd.initial.main.AsyncMongoClient", _MockMongoClientWithClose)
    monkeypatch.setattr("veaiops.cmd.initial.main.set_default_bot", mock_set_default_bot)
    monkeypatch.setattr("veaiops.cmd.initial.main.reload_bot_group_chat", mock_reload_bot_group_chat)

    # Cleanup before test
    await User.find({"username": test_username}).delete()
    await Bot.find({"bot_id": test_bot_id}).delete()
    await VeKB.find({"bot_id": test_bot_id}).delete()
    await MetricTemplate.find_all().delete()

    # Execute init_all
    await init_all()

    # Verify all components initialized
    templates = await MetricTemplate.find_all().to_list()
    assert len(templates) > 0

    user = await User.find_one({"username": test_username})
    assert user is not None and user.is_supervisor is True

    bot = await Bot.find_one({"bot_id": test_bot_id})
    assert bot is not None

    vekbs = await VeKB.find({"bot_id": test_bot_id}).to_list()
    assert vekbs is not None and len(vekbs) == 1

    # Cleanup after test
    await User.find({"username": test_username}).delete()
    await Bot.find({"bot_id": test_bot_id}).delete()
    await VeKB.find({"bot_id": test_bot_id}).delete()
    await MetricTemplate.find_all().delete()


def test_main_function_callable():
    """Test that main function exists and is callable."""
    from veaiops.cmd.initial.main import init_all, main

    assert callable(init_all)
    assert callable(main)
