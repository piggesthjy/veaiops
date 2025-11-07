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

from veaiops.agents.chatops.proactive.rewrite_agent import (
    REWRITE_AGENT_NAME,
    STATE_REWRITE_RESULT,
    RewriteResult,
    init_rewrite_agent,
)


@pytest.mark.asyncio
async def test_init_rewrite_agent_basic(test_bot):
    """Test basic initialization of rewrite agent."""
    # Arrange
    description = "Test rewrite agent description"
    instruction = "Test instruction for rewriting queries"

    # Act
    agent = await init_rewrite_agent(bot=test_bot, description=description, instruction=instruction)

    # Assert
    assert agent is not None
    assert agent.name == REWRITE_AGENT_NAME
    assert agent.description == description
    assert agent.instruction == instruction
    assert agent.output_key == STATE_REWRITE_RESULT
    assert agent.output_schema == RewriteResult


@pytest.mark.asyncio
async def test_rewrite_agent_model_config(test_bot):
    """Test that rewrite agent correctly uses bot's model configuration."""
    # Arrange
    description = "Test description"
    instruction = "Test instruction"

    # Act
    agent = await init_rewrite_agent(bot=test_bot, description=description, instruction=instruction)

    # Assert - verify model configuration is passed correctly
    assert agent.model_name == test_bot.agent_cfg.name
    assert agent.model_provider == test_bot.agent_cfg.provider
