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
from unittest.mock import MagicMock, patch

import pytest
from google.genai.types import Content, Part

from tests.agents.chatops.utils import create_async_iterator
from veaiops.agents.chatops.interest.interest_agent import INTEREST_AGENT_NAME
from veaiops.agents.chatops.interest.run import (
    run_re_interest_agents,
    run_semantic_interest_agents,
)
from veaiops.schema.documents import Interest, InterestAgentResp
from veaiops.schema.types import (
    InterestActionType,
    InterestInspectType,
)


@pytest.mark.asyncio
async def test_run_semantic_interest_agents_with_defaults(test_bot, default_interests, test_messages):
    """Test run_semantic_interest_agents with real default interest configurations."""
    # Get semantic interests from defaults
    semantic_interests = [i for i in default_interests if i.inspect_category == InterestInspectType.Semantic]
    assert len(semantic_interests) > 0, "Should have semantic interests from defaults"

    # Use one semantic interest for testing
    interest_configs = semantic_interests[:1]

    # Create historical messages
    await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_semantic_default",
        content="线上流量跌零了，请紧急处理",
        msg_time=datetime(2025, 1, 15, 9, 59, 0),
    )

    # Create test message
    test_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_semantic_default",
        content="线上流量跌零了，请紧急处理",
        msg_time=datetime(2025, 1, 15, 10, 0, 0),
    )

    mock_event = MagicMock()
    mock_event.author = f"{INTEREST_AGENT_NAME}_0"  # Fixed: Use correct agent name format
    mock_event.content = Content(parts=[Part(text='{"thinking": "用户明确提到线上流量跌零", "is_satisfied": true}')])

    with patch("veaiops.agents.chatops.interest.run.Runner") as mock_runner_class:
        mock_runner = MagicMock()
        mock_runner.run_async = MagicMock(return_value=create_async_iterator([mock_event]))
        mock_runner_class.return_value = mock_runner

        # Act
        result = await run_semantic_interest_agents(bot=test_bot, msg=test_message, interest_configs=interest_configs)

    # Assert
    assert len(result) == 1
    assert any(isinstance(i, InterestAgentResp) for i in result)

    for interest_config, resp in zip(interest_configs, result):
        assert all(getattr(interest_config, f) == getattr(resp, f) for f in Interest.model_fields.keys())

    assert result[0].name == interest_configs[0].name
    assert result[0].thinking == "用户明确提到线上流量跌零"
    assert result[0].is_satisfied is True


@pytest.mark.asyncio
async def test_run_semantic_interest_agents_multiple_defaults(test_bot, default_interests, test_messages):
    """Test run_semantic_interest_agents with multiple default interest configurations."""
    # Get all semantic interests
    semantic_interests = [i for i in default_interests if i.inspect_category == InterestInspectType.Semantic]
    assert len(semantic_interests) >= 2, "Should have at least 2 semantic interests"

    # Use first two semantic interests
    interest_configs = semantic_interests[:2]

    # Create historical message
    await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_semantic_multiple",
        content="很多客户都反馈报错，客户非常不满",
        msg_time=datetime(2025, 1, 15, 9, 59, 0),
    )

    # Create test message
    test_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_semantic_multiple",
        content="很多客户都反馈报错，客户非常不满",
        msg_time=datetime(2025, 1, 15, 10, 0, 0),
    )

    mock_event_1 = MagicMock()
    mock_event_1.author = f"{INTEREST_AGENT_NAME}_0"  # Fixed: Use correct agent name format
    mock_event_1.content = Content(parts=[Part(text='{"thinking": "多个客户都反馈问题", "is_satisfied": true}')])

    mock_event_2 = MagicMock()
    mock_event_2.author = f"{INTEREST_AGENT_NAME}_1"  # Fixed: Use correct agent name format
    mock_event_2.content = Content(parts=[Part(text='{"thinking": "客户表达不满情绪", "is_satisfied": true}')])

    with patch("veaiops.agents.chatops.interest.run.Runner") as mock_runner_class:
        mock_runner = MagicMock()
        mock_runner.run_async = MagicMock(return_value=create_async_iterator([mock_event_1, mock_event_2]))
        mock_runner_class.return_value = mock_runner

        # Act
        result = await run_semantic_interest_agents(bot=test_bot, msg=test_message, interest_configs=interest_configs)

    # Assert
    assert len(result) == 2
    assert any(isinstance(i, InterestAgentResp) for i in result)

    for interest_config, resp in zip(interest_configs, result):
        assert all(getattr(interest_config, f) == getattr(resp, f) for f in Interest.model_fields.keys())

    assert result[0].is_satisfied is True
    assert result[1].is_satisfied is True


@pytest.mark.asyncio
async def test_run_re_interest_agents_with_defaults(test_bot, default_interests, test_messages):
    """Test run_re_interest_agents with real default RE interest (SVIP客户)."""
    # Get RE interest from defaults
    re_interests = [i for i in default_interests if i.inspect_category == InterestInspectType.RE]
    assert len(re_interests) > 0, "Should have RE interests from defaults"

    interest_configs = re_interests[:1]

    # Create test message
    test_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_re_default",
        content="这是一个SVIP客户的问题",
        msg_time=datetime(2025, 1, 15, 10, 0, 0),
    )

    # Act
    result = await run_re_interest_agents(bot=test_bot, msg=test_message, interest_configs=interest_configs)

    # Assert
    assert len(result) == 1
    assert result[0].name == re_interests[0].name
    assert result[0].is_satisfied is True


@pytest.mark.asyncio
async def test_run_re_interest_agents_no_match(test_bot, default_interests, test_messages):
    """Test run_re_interest_agents with no matching pattern."""
    # Get RE interest from defaults
    re_interests = [i for i in default_interests if i.inspect_category == InterestInspectType.RE]
    interest_configs = [re_interests[0]]

    # Create test message
    test_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_re_no_match",
        content="这是一个普通客户的问题",
        msg_time=datetime(2025, 1, 15, 10, 0, 0),
    )

    # Act
    result = await run_re_interest_agents(bot=test_bot, msg=test_message, interest_configs=interest_configs)

    # Assert
    assert len(result) == 1
    assert result[0].is_satisfied is False


@pytest.mark.asyncio
async def test_run_re_interest_agents_case_insensitive(test_bot, default_interests, test_messages):
    """Test run_re_interest_agents case insensitivity."""
    # Get RE interest from defaults (SVIP pattern is case-insensitive)
    re_interests = [i for i in default_interests if i.inspect_category == InterestInspectType.RE]
    interest_configs = [re_interests[0]]

    # Create test message
    test_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_re_case",
        content="svip客户反馈的问题",
        msg_time=datetime(2025, 1, 15, 10, 0, 0),
    )

    # Act
    result = await run_re_interest_agents(bot=test_bot, msg=test_message, interest_configs=interest_configs)

    # Assert
    assert len(result) == 1
    assert result[0].is_satisfied is True


@pytest.mark.asyncio
async def test_run_re_interest_agents_empty_message(test_bot, default_interests, test_messages):
    """Test run_re_interest_agents with empty message content."""
    # Get RE interest from defaults
    re_interests = [i for i in default_interests if i.inspect_category == InterestInspectType.RE]
    interest_configs = [re_interests[0]]

    # Create test message with empty content
    test_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_re_empty",
        content="",
        msg_time=datetime(2025, 1, 15, 10, 0, 0),
    )

    # Act
    result = await run_re_interest_agents(bot=test_bot, msg=test_message, interest_configs=interest_configs)

    # Assert
    assert len(result) == 1
    assert result[0].is_satisfied is False


@pytest.mark.asyncio
async def test_run_semantic_interest_agents_empty_history(test_bot, default_interests, test_messages):
    """Test run_semantic_interest_agents with empty history messages."""
    # Get a semantic interest
    semantic_interests = [i for i in default_interests if i.inspect_category == InterestInspectType.Semantic]
    interest_configs = [semantic_interests[0]]

    # Create test message (no historical messages - empty history)
    test_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_semantic_empty_hist",
        content="这是一条测试消息",
        msg_time=datetime(2025, 1, 15, 10, 0, 0),
    )

    mock_event = MagicMock()
    mock_event.author = f"{INTEREST_AGENT_NAME}_0"  # Fixed: Use correct agent name format
    mock_event.content = Content(parts=[Part(text='{"thinking": "提到测试环境", "is_satisfied": true}')])

    with patch("veaiops.agents.chatops.interest.run.Runner") as mock_runner_class:
        mock_runner = MagicMock()
        mock_runner.run_async = MagicMock(return_value=create_async_iterator([mock_event]))
        mock_runner_class.return_value = mock_runner

        # Act
        result = await run_semantic_interest_agents(bot=test_bot, msg=test_message, interest_configs=interest_configs)

    # Assert
    assert len(result) == 1


@pytest.mark.asyncio
async def test_run_semantic_interest_agents_invalid_json_response(test_bot, default_interests, test_messages):
    """Test run_semantic_interest_agents handles invalid JSON response gracefully."""
    # Get a semantic interest
    semantic_interests = [i for i in default_interests if i.inspect_category == InterestInspectType.Semantic]
    interest_configs = [semantic_interests[0]]

    # Create historical message
    await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_semantic_invalid_json",
        content="测试消息",
        msg_time=datetime(2025, 1, 15, 9, 59, 0),
    )

    # Create test message
    test_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_semantic_invalid_json",
        content="测试消息",
        msg_time=datetime(2025, 1, 15, 10, 0, 0),
    )

    mock_event = MagicMock()
    mock_event.author = f"{INTEREST_AGENT_NAME}_0"  # Fixed: Use correct agent name format
    mock_event.content = Content(parts=[Part(text="invalid json response")])

    with patch("veaiops.agents.chatops.interest.run.Runner") as mock_runner_class:
        mock_runner = MagicMock()
        mock_runner.run_async = MagicMock(return_value=create_async_iterator([mock_event]))
        mock_runner_class.return_value = mock_runner

        # Act
        result = await run_semantic_interest_agents(bot=test_bot, msg=test_message, interest_configs=interest_configs)

    # Assert
    assert len(result) == 1
    assert result[0].is_satisfied is False
    assert result[0].thinking == "Error in response parsing."


@pytest.mark.asyncio
async def test_run_re_interest_agents_missing_regex_pattern(test_bot, test_messages):
    """Test run_re_interest_agents when regular_expression is None or empty."""
    # Create an RE interest config with None regular_expression
    interest_config = Interest.model_construct(
        bot_id=test_bot.bot_id,
        channel=test_bot.channel,
        name="测试缺失正则表达式",
        description="测试用例：正则表达式为None",
        inspect_category=InterestInspectType.RE,
        action_category=InterestActionType.Detect,
        regular_expression=None,  # This is the key test condition
        inspect_history=1,
    )
    interest_configs = [interest_config]

    # Create test message
    test_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_re_missing_regex",
        content="这是一个测试消息",
        msg_time=datetime(2025, 1, 15, 10, 0, 0),
    )

    # Mock InterestAgentResp to bypass validation
    with patch("veaiops.agents.chatops.interest.run.InterestAgentResp") as mock_resp_class:
        # Create a mock response object
        mock_resp = MagicMock()
        mock_resp.is_satisfied = False
        mock_resp.thinking = "Missing regex pattern."
        mock_resp.name = "测试缺失正则表达式"
        mock_resp_class.return_value = mock_resp

        # Act
        result = await run_re_interest_agents(bot=test_bot, msg=test_message, interest_configs=interest_configs)

        # Assert
        assert len(result) == 1
        assert result[0].is_satisfied is False
        assert result[0].thinking == "Missing regex pattern."
        assert result[0].name == "测试缺失正则表达式"

        # Verify InterestAgentResp was called with correct parameters
        mock_resp_class.assert_called_once()
        call_kwargs = mock_resp_class.call_args[1]
        assert call_kwargs["is_satisfied"] is False
        assert call_kwargs["thinking"] == "Missing regex pattern."
