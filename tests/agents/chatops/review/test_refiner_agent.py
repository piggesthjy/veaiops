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

from veaiops.agents.chatops.review.refiner_agent import (
    REFINER_AGENT_NAME,
    RefineResult,
    init_refiner_agent,
)


@pytest.mark.asyncio
async def test_init_refiner_agent_basic(test_bot):
    """Test basic initialization of refiner agent."""
    # Arrange
    description = "Test refiner agent description"
    instruction = "Test instruction for refining QA pairs"

    # Act
    agent = await init_refiner_agent(bot=test_bot, description=description, instruction=instruction)

    # Assert
    assert agent is not None
    assert agent.name == REFINER_AGENT_NAME
    assert agent.description == description
    assert agent.instruction == instruction
    assert agent.output_schema == RefineResult


@pytest.mark.asyncio
async def test_init_refiner_agent_custom_name(test_bot):
    """Test initialization of refiner agent with custom name."""
    # Arrange
    description = "Test description"
    instruction = "Test instruction"
    custom_name = "CustomRefinerAgent"

    # Act
    agent = await init_refiner_agent(bot=test_bot, description=description, instruction=instruction, name=custom_name)

    # Assert
    assert agent.name == custom_name


@pytest.mark.asyncio
async def test_refine_result_model_keep_action():
    """Test RefineResult model with keep action."""
    # Test keep action - no modifications needed
    result = RefineResult(action="keep", question=None, answer=None, delete_citation_ids=None)
    assert result.action == "keep"
    assert result.question is None
    assert result.answer is None
    assert result.delete_citation_ids is None


@pytest.mark.asyncio
async def test_refine_result_model_delete_action():
    """Test RefineResult model with delete action."""
    # Test delete action
    result = RefineResult(action="delete", question=None, answer=None, delete_citation_ids=["citation1", "citation2"])
    assert result.action == "delete"
    assert result.delete_citation_ids is not None
    assert len(result.delete_citation_ids) == 2


@pytest.mark.asyncio
async def test_refine_result_model_modify_action():
    """Test RefineResult model with modify action."""
    # Test modify action with new question and answer
    result = RefineResult(
        action="modify",
        question="Modified question?",
        answer="Modified answer",
        delete_citation_ids=["citation1"],
    )
    assert result.action == "modify"
    assert result.question == "Modified question?"
    assert result.answer == "Modified answer"
    assert result.delete_citation_ids == ["citation1"]


@pytest.mark.asyncio
async def test_refine_result_model_pending_action():
    """Test RefineResult model with pending action."""
    # Test pending action (default)
    result = RefineResult(action="pending")
    assert result.action == "pending"


@pytest.mark.asyncio
async def test_refiner_agent_model_config(test_bot):
    """Test that refiner agent correctly uses bot's model configuration."""
    # Arrange
    description = "Test description"
    instruction = "Test instruction"

    # Act
    agent = await init_refiner_agent(bot=test_bot, description=description, instruction=instruction)

    # Assert - verify model configuration is passed correctly
    assert agent.model_name == test_bot.agent_cfg.name
    assert agent.model_provider == test_bot.agent_cfg.provider
