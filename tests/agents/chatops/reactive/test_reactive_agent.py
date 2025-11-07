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

from datetime import datetime
from unittest.mock import patch

import pytest
from veadk.memory import ShortTermMemory

from veaiops.agents.chatops.reactive.reactive_agent import REACTIVE_AGENT_NAME, init_reactive_agent


@pytest.mark.asyncio
async def test_init_reactive_agent_basic(test_bot, test_messages, dummy_ltm_backend):
    """Test basic initialization of reactive agent."""
    # Arrange
    description = "Test reactive agent description"
    instruction = "Test instruction for reactive agent"
    test_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_reactive_init",
        content="测试问题",
        msg_time=datetime(2025, 1, 15, 10, 0, 0),
    )

    # Mock memory initialization to avoid external dependencies
    async def mock_init_ltm(bot):
        return dummy_ltm_backend

    async def mock_init_stm(app_name, user_id, session_id, state):
        return ShortTermMemory(backend="local")

    with patch("veaiops.agents.chatops.reactive.reactive_agent.init_ltm", side_effect=mock_init_ltm):
        # Act
        agent = await init_reactive_agent(
            bot=test_bot, description=description, instruction=instruction, msg=test_message
        )

        # Assert
        assert agent is not None
        assert agent.name == REACTIVE_AGENT_NAME
        assert agent.description == description
        assert agent.instruction == instruction


@pytest.mark.asyncio
async def test_reactive_agent_has_tools(test_bot, test_messages, dummy_ltm_backend):
    """Test that reactive agent has necessary tools configured."""
    # Arrange
    description = "Test description"
    instruction = "Test instruction"
    test_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_reactive_tools",
        content="测试问题",
        msg_time=datetime(2025, 1, 15, 10, 0, 0),
    )

    # Mock memory initialization to avoid external dependencies
    async def mock_init_ltm(bot):
        return dummy_ltm_backend

    async def mock_init_stm(app_name, user_id, session_id, state):
        return ShortTermMemory(backend="local")

    with patch("veaiops.agents.chatops.reactive.reactive_agent.init_ltm", side_effect=mock_init_ltm):
        with patch("veaiops.agents.chatops.reactive.reactive_agent.init_stm", side_effect=mock_init_stm):
            # Act
            agent = await init_reactive_agent(
                bot=test_bot, description=description, instruction=instruction, msg=test_message
            )

            # Assert - verify agent has tools configured (web_search, get_utc_time, etc.)
            assert agent.tools is not None
            assert len(agent.tools) > 0


@pytest.mark.asyncio
async def test_reactive_agent_model_config(test_bot, test_messages, dummy_ltm_backend):
    """Test that reactive agent correctly uses bot's model configuration."""
    # Arrange
    description = "Test description"
    instruction = "Test instruction"
    test_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_reactive_model",
        content="测试问题",
        msg_time=datetime(2025, 1, 15, 10, 0, 0),
    )

    # Mock memory initialization to avoid external dependencies
    async def mock_init_ltm(bot):
        return dummy_ltm_backend

    async def mock_init_stm(app_name, user_id, session_id, state):
        return ShortTermMemory(backend="local")

    with patch("veaiops.agents.chatops.reactive.reactive_agent.init_ltm", side_effect=mock_init_ltm):
        with patch("veaiops.agents.chatops.reactive.reactive_agent.init_stm", side_effect=mock_init_stm):
            # Act
            agent = await init_reactive_agent(
                bot=test_bot, description=description, instruction=instruction, msg=test_message
            )

            # Assert - verify model configuration is passed correctly
            assert agent.model_name == test_bot.agent_cfg.name
            assert agent.model_provider == test_bot.agent_cfg.provider


@pytest.mark.asyncio
async def test_reactive_agent_with_message_context(test_bot, test_messages, dummy_ltm_backend):
    """Test reactive agent initialization with message context."""
    # Arrange - create multiple messages for context
    chat_id = "test_chat_reactive_context"
    await test_messages(
        bot_id=test_bot.bot_id,
        chat_id=chat_id,
        content="第一条消息",
        msg_time=datetime(2025, 1, 15, 9, 0, 0),
    )
    msg = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id=chat_id,
        content="第二条消息",
        msg_time=datetime(2025, 1, 15, 10, 0, 0),
    )

    description = "Test description"
    instruction = "Test instruction"

    # Mock memory initialization to avoid external dependencies
    async def mock_init_ltm(bot):
        return dummy_ltm_backend

    async def mock_init_stm(app_name, user_id, session_id, state):
        return ShortTermMemory(backend="local")

    with patch("veaiops.agents.chatops.reactive.reactive_agent.init_ltm", side_effect=mock_init_ltm):
        with patch("veaiops.agents.chatops.reactive.reactive_agent.init_stm", side_effect=mock_init_stm):
            # Act
            agent = await init_reactive_agent(bot=test_bot, description=description, instruction=instruction, msg=msg)

            # Assert
            assert agent is not None
            assert agent.name == REACTIVE_AGENT_NAME
