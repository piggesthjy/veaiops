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

from veaiops.agents.chatops.reactive.summary_agent import (
    SUMMARY_AGENT_NAME,
    init_summary_agent,
)


@pytest.mark.asyncio
async def test_init_summary_agent_basic(test_bot):
    """Test basic initialization of summary agent."""
    # Arrange
    description = "Test summary agent description"
    instruction = "Test instruction for summarizing chat history"

    # Act
    agent = await init_summary_agent(bot=test_bot, description=description, instruction=instruction)

    # Assert
    assert agent is not None
    assert agent.name == SUMMARY_AGENT_NAME
    assert agent.description == description
    assert agent.instruction == instruction


@pytest.mark.asyncio
async def test_summary_agent_has_tools(test_bot):
    """Test that summary agent has chat history tool."""
    # Arrange
    description = "Test description"
    instruction = "Test instruction"

    # Act
    agent = await init_summary_agent(bot=test_bot, description=description, instruction=instruction)

    # Assert - verify agent has tools configured
    assert agent.tools is not None
    assert len(agent.tools) > 0


@pytest.mark.asyncio
async def test_summary_agent_model_config(test_bot):
    """Test that summary agent correctly uses bot's model configuration."""
    # Arrange
    description = "Test description"
    instruction = "Test instruction"

    # Act
    agent = await init_summary_agent(bot=test_bot, description=description, instruction=instruction)

    # Assert - verify model configuration is passed correctly
    assert agent.model_name == test_bot.agent_cfg.name
    assert agent.model_provider == test_bot.agent_cfg.provider
