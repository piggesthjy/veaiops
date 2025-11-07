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


import pytest
import pytest_asyncio
from beanie import PydanticObjectId
from pydantic import SecretStr

from veaiops.handler.errors import RecordNotFoundError
from veaiops.handler.routers.apis.v1.system_config.bot import (
    delete_bot_by_id,
    get_all_bots,
    get_bot_by_id,
    update_bot_by_id,
)
from veaiops.schema.documents import Bot, BotAttribute, Interest, User
from veaiops.schema.models.config.bot import (
    AgentCfgPayload,
    UpdateBotPayload,
    VolcCfgPayload,
)
from veaiops.schema.types import (
    AttributeKey,
    ChannelType,
    EventLevel,
    InterestActionType,
    InterestInspectType,
    NetworkType,
    TOSRegion,
)
from veaiops.utils.crypto import EncryptedSecretStr


@pytest_asyncio.fixture
async def test_bots(test_user: User):
    """Fixture to create multiple test bots."""
    bots = []
    for i in range(1, 4):
        bot = Bot(
            bot_id=f"test_bot_{i:03d}",
            name=f"Test Bot {i}",
            channel=ChannelType.Lark,
            open_id=f"ou_{i}",
            secret=EncryptedSecretStr(f"test_secret_{i}"),
            created_user=test_user.username,
            updated_user=test_user.username,
        )
        await bot.insert()
        bots.append(bot)
    yield bots
    for bot in bots:
        await Bot.find(Bot.bot_id == bot.bot_id).delete()


@pytest.mark.asyncio
async def test_get_bots(test_bots):
    """Test getting all bots with pagination and filters."""
    # Test without filters
    response = await get_all_bots(skip=0, limit=100)
    assert response.data is not None
    assert len(response.data) >= 3

    # Test with pagination
    response = await get_all_bots(skip=1, limit=2)
    assert response.data is not None
    assert len(response.data) <= 2

    # Test with channel filter
    response = await get_all_bots(skip=0, limit=100, channel=ChannelType.Lark)
    assert response.data is not None
    for bot in response.data:
        assert bot.channel == ChannelType.Lark


@pytest.mark.asyncio
async def test_get_bot_by_id(test_bot: Bot):
    """Test successfully getting a bot and error handling for non-existent bot."""
    # Test success case
    assert test_bot.id is not None
    response = await get_bot_by_id(uid=test_bot.id)
    assert response.data is not None
    assert response.data.id == test_bot.id

    # Test not found case
    fake_id = PydanticObjectId()
    with pytest.raises(RecordNotFoundError) as exc_info:
        await get_bot_by_id(uid=fake_id)
    assert "not found" in str(exc_info.value)


@pytest.mark.asyncio
async def test_update_bot(test_user: User, test_bot: Bot, monkeypatch):
    """Test updating bot with various configurations."""
    assert test_bot.id is not None

    # Mock check_bot_configuration for all update operations
    async def mock_check_bot_configuration(*args, **kwargs):
        return None

    monkeypatch.setattr(
        "veaiops.handler.routers.apis.v1.system_config.bot.check_bot_configuration",
        mock_check_bot_configuration,
    )

    # Mock config checks
    async def mock_config_check(*args, **kwargs):
        return None

    monkeypatch.setattr("veaiops.schema.base.config.AgentCfg.do_check", mock_config_check)
    monkeypatch.setattr("veaiops.schema.base.config.VolcCfg.do_check", mock_config_check)

    # Test updating secret
    payload = UpdateBotPayload(secret=SecretStr("new_secret_value"))  # type: ignore[call-arg]
    response = await update_bot_by_id(uid=test_bot.id, payload=payload, current_user=test_user)
    assert response.data is True

    # Test updating agent and volc configurations together
    payload_cfg = UpdateBotPayload(  # type: ignore[call-arg]
        agent_cfg=AgentCfgPayload(
            name="gpt-4-turbo",
            embedding_name="text-embedding-3-large",
            api_key=SecretStr("new_api_key"),
        ),
        volc_cfg=VolcCfgPayload(
            ak=SecretStr("new_ak"),
            sk=SecretStr("new_sk"),
            tos_region=TOSRegion.CN_Shanghai,
            network_type=NetworkType.Public,
            extra_kb_collections=["new_collection"],
        ),
    )

    response = await update_bot_by_id(uid=test_bot.id, payload=payload_cfg, current_user=test_user)
    assert response.data is True

    # Verify both updates
    updated_bot = await Bot.get(test_bot.id)
    assert updated_bot is not None
    assert updated_bot.agent_cfg.name == "gpt-4-turbo"
    assert updated_bot.volc_cfg.tos_region == TOSRegion.CN_Shanghai


@pytest.mark.asyncio
async def test_update_and_delete_bot_errors(test_user: User):
    """Test update and delete operations on non-existent bot."""
    fake_id = PydanticObjectId()
    payload = UpdateBotPayload(secret=SecretStr("new_secret"))  # type: ignore[call-arg]

    # Test update error
    with pytest.raises(RecordNotFoundError) as exc_info:
        await update_bot_by_id(uid=fake_id, payload=payload, current_user=test_user)
    assert "not found" in str(exc_info.value)

    # Test delete error
    with pytest.raises(RecordNotFoundError) as exc_info:
        await delete_bot_by_id(uid=fake_id)
    assert "not found" in str(exc_info.value)


@pytest.mark.asyncio
async def test_delete_bot_by_id(test_bot: Bot):
    """Test successfully deleting a bot with related data and error handling."""
    # Use the existing test_bot fixture
    # Create related BotAttribute
    temp_attr = BotAttribute(
        channel=test_bot.channel,
        bot_id=test_bot.bot_id,
        name=AttributeKey.Customer,
        value="temp_customer",
        created_user=test_bot.created_user,
        updated_user=test_bot.updated_user,
    )
    await temp_attr.insert()

    # Create related Interest
    temp_interest = Interest(
        channel=test_bot.channel,
        bot_id=test_bot.bot_id,
        name="test_interest",
        description="Test Interest",
        action_category=InterestActionType.Filter,
        inspect_category=InterestInspectType.Semantic,
        level=EventLevel.P0,
        created_user=test_bot.created_user,
        updated_user=test_bot.updated_user,
    )
    await temp_interest.insert()

    # Delete bot
    assert test_bot.id is not None
    response = await delete_bot_by_id(uid=test_bot.id)

    # Verify deletion and cascade delete
    assert response.data is True
    assert "deleted successfully" in response.message

    deleted_bot = await Bot.get(test_bot.id)
    assert deleted_bot is None

    # Verify related data deleted (cascade delete)
    remaining_attrs = await BotAttribute.find({"channel": test_bot.channel, "bot_id": test_bot.bot_id}).to_list()
    assert len(remaining_attrs) == 0

    remaining_interests = await Interest.find({"channel": test_bot.channel, "bot_id": test_bot.bot_id}).to_list()
    assert len(remaining_interests) == 0
