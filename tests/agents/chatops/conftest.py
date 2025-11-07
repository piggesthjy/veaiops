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

import pytest_asyncio
from pytest import fixture
from veadk.memory import LongTermMemory
from veadk.memory.long_term_memory_backends.base_backend import BaseLongTermMemoryBackend

from veaiops.agents.chatops.default.default_interest_agent import set_default_interest_agents
from veaiops.schema.documents import Interest
from veaiops.schema.types import (
    ChannelType,
)

# Note: Common fixtures (mock_api_calls, test_bot, test_chat, test_messages)
# are now defined in the root tests/conftest.py and automatically available


@pytest_asyncio.fixture
async def default_interests(test_bot):
    """Setup default interest agents in database and return them."""
    # Set default interest agents in database
    await set_default_interest_agents(bot_id=test_bot.bot_id, channel=ChannelType.Lark)

    # Query all interests from database - use dict query instead of attribute access
    interests = await Interest.find({"bot_id": test_bot.bot_id, "channel": ChannelType.Lark}).to_list()

    return interests


@fixture
def dummy_ltm_backend():
    """Fixture that provides a minimal DummyBackend for testing LongTermMemory without external calls."""

    class DummyBackend(BaseLongTermMemoryBackend):
        index: str = "test"

        def precheck_index_naming(self):
            return None

        def save_memory(self, user_id: str, event_strings: list[str], **kwargs) -> bool:
            return True

        def search_memory(self, user_id: str, query: str, top_k: int, **kwargs) -> list[str]:
            return []

    return LongTermMemory(backend=DummyBackend(index="test"))


@pytest_asyncio.fixture
async def test_vekb(test_bot):
    """Create and insert a VeKB into the database for tests."""
    from veaiops.schema.documents.chatops.kb import VeKB
    from veaiops.schema.types import KBType

    vekb = await VeKB(
        bot_id=test_bot.bot_id,
        channel=test_bot.channel,
        kb_type=KBType.AutoQA,
        collection_name="test_collection",
        project="test_project",
        bucket_name="test_bucket",
    ).insert()

    yield vekb

    # Cleanup - delete vekb after test
    await vekb.delete()
