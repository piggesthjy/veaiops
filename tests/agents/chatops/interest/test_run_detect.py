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
    run_interest_detect_agent,
)
from veaiops.schema.documents import AgentNotification, InterestAgentResp
from veaiops.schema.types import (
    AgentType,
    InterestInspectType,
)


@pytest.mark.asyncio
async def test_run_interest_detect_agent_with_both_types(test_bot, default_interests, test_messages):
    """Test run_interest_detect_agent with both semantic and RE interests."""
    # Create test message
    test_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_detect_both",
        content="SVIP customer reported online traffic dropped to zero",
        msg_time=datetime(2025, 1, 15, 10, 0, 0),
    )

    # Mock semantic agent response
    mock_event = MagicMock()
    mock_event.author = f"{INTEREST_AGENT_NAME}_0"
    mock_event.content = Content(parts=[Part(text='{"thinking": "线上流量跌零", "is_satisfied": true}')])

    with patch("veaiops.agents.chatops.interest.run.Runner") as mock_runner_class:
        with patch("veaiops.agents.chatops.interest.run.send_bot_notification") as mock_send_notification:
            mock_runner = MagicMock()
            mock_runner.run_async = MagicMock(return_value=create_async_iterator([mock_event]))
            mock_runner_class.return_value = mock_runner

            # Act
            await test_bot.save()

            await run_interest_detect_agent(bot=test_bot, msg=test_message)

            # Assert
            mock_send_notification.assert_called_once()
            call_args = mock_send_notification.call_args
            assert call_args[1]["bot"] == test_bot
            notification = call_args[1]["data"]
            assert notification.bot_id == test_bot.bot_id
            assert notification.channel == test_message.channel
            assert notification.chat_id == test_message.chat_id
            assert notification.agent_type == AgentType.CHATOPS_INTEREST
            assert notification.msg_id == test_message.msg_id
            assert len(notification.data) >= 2  # At least one semantic and one RE


@pytest.mark.asyncio
async def test_run_interest_detect_agent_no_interests(test_bot, test_messages):
    """Test run_interest_detect_agent with no active interests (early return)."""
    # Create a bot with different bot_id that has no interests
    test_bot.bot_id = "test_bot_no_interests"

    # Create test message
    test_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_no_interests",
        content="Test message",
        msg_time=datetime(2025, 1, 15, 10, 0, 0),
    )

    with patch("veaiops.agents.chatops.interest.run.send_bot_notification") as mock_send_notification:
        # Act
        await run_interest_detect_agent(bot=test_bot, msg=test_message)

        # Assert - should return early without sending notification
        mock_send_notification.assert_not_called()


@pytest.mark.asyncio
async def test_run_interest_detect_agent_only_semantic(test_bot, default_interests, test_messages):
    """Test run_interest_detect_agent with only semantic interests."""
    # Temporarily disable RE interests
    re_interests = [i for i in default_interests if i.inspect_category == InterestInspectType.RE]
    for interest in re_interests:
        interest.is_active = False
        await interest.save()

    # Create test message
    test_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_semantic_only",
        content="Online traffic dropped to zero",
        msg_time=datetime(2025, 1, 15, 10, 0, 0),
    )

    mock_event = MagicMock()
    mock_event.author = f"{INTEREST_AGENT_NAME}_0"
    mock_event.content = Content(parts=[Part(text='{"thinking": "线上故障", "is_satisfied": true}')])

    with patch("veaiops.agents.chatops.interest.run.Runner") as mock_runner_class:
        with patch("veaiops.agents.chatops.interest.run.send_bot_notification") as mock_send_notification:
            mock_runner = MagicMock()
            mock_runner.run_async = MagicMock(return_value=create_async_iterator([mock_event]))
            mock_runner_class.return_value = mock_runner

            # Act
            await test_bot.save()

            await run_interest_detect_agent(bot=test_bot, msg=test_message)

            # Assert
            mock_send_notification.assert_called_once()
            notification = mock_send_notification.call_args[1]["data"]
            assert all(resp.inspect_category == InterestInspectType.Semantic for resp in notification.data)

    # Restore RE interests
    for interest in re_interests:
        interest.is_active = True
        await interest.save()


@pytest.mark.asyncio
async def test_run_interest_detect_agent_only_re(test_bot, default_interests, test_messages):
    """Test run_interest_detect_agent with only RE interests."""
    # Temporarily disable semantic interests
    semantic_interests = [i for i in default_interests if i.inspect_category == InterestInspectType.Semantic]
    for interest in semantic_interests:
        interest.is_active = False
        await interest.save()

    # Create test message
    test_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_re_only",
        content="SVIP customer reported issue",
        msg_time=datetime(2025, 1, 15, 10, 0, 0),
    )

    with patch("veaiops.agents.chatops.interest.run.send_bot_notification") as mock_send_notification:
        # Act
        await test_bot.save()

        await run_interest_detect_agent(bot=test_bot, msg=test_message)

        # Assert
        mock_send_notification.assert_called_once()
        notification = mock_send_notification.call_args[1]["data"]
        assert all(resp.inspect_category == InterestInspectType.RE for resp in notification.data)
        assert any(resp.is_satisfied for resp in notification.data)

    # Cleanup and restore semantic interests
    for interest in semantic_interests:
        interest.is_active = True
        await interest.save()


@pytest.mark.asyncio
async def test_run_interest_detect_agent_notification_structure(test_bot, default_interests, test_messages):
    """Test run_interest_detect_agent creates correct notification structure."""
    # Create test message
    test_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_notification",
        content="Test message",
        msg_time=datetime(2025, 1, 15, 10, 0, 0),
    )

    mock_event = MagicMock()
    mock_event.author = f"{INTEREST_AGENT_NAME}_0"
    mock_event.content = Content(parts=[Part(text='{"thinking": "测试", "is_satisfied": false}')])

    with patch("veaiops.agents.chatops.interest.run.Runner") as mock_runner_class:
        with patch("veaiops.agents.chatops.interest.run.send_bot_notification") as mock_send_notification:
            mock_runner = MagicMock()
            mock_runner.run_async = MagicMock(return_value=create_async_iterator([mock_event]))
            mock_runner_class.return_value = mock_runner

            # Act
            await test_bot.save()

            await run_interest_detect_agent(bot=test_bot, msg=test_message)

            # Assert notification structure
            assert mock_send_notification.call_count == 1
            notification = mock_send_notification.call_args[1]["data"]

            assert isinstance(notification, AgentNotification)
            assert notification.bot_id == test_bot.bot_id
            assert notification.channel == test_message.channel
            assert notification.chat_id == test_message.chat_id
            assert notification.agent_type == AgentType.CHATOPS_INTEREST
            assert notification.msg_id == test_message.msg_id
            assert isinstance(notification.data, list)
            assert all(isinstance(resp, InterestAgentResp) for resp in notification.data)


@pytest.mark.asyncio
async def test_run_interest_detect_agent_mixed_results(test_bot, default_interests, test_messages):
    """Test run_interest_detect_agent with mixed satisfied/unsatisfied results."""
    # Create test message that matches RE but not semantic
    test_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_mixed",
        content="SVIP customer asking for product info",  # Matches SVIP regex but not urgent semantic
        msg_time=datetime(2025, 1, 15, 10, 0, 0),
    )

    mock_event = MagicMock()
    mock_event.author = f"{INTEREST_AGENT_NAME}_0"
    mock_event.content = Content(parts=[Part(text='{"thinking": "不是紧急问题", "is_satisfied": false}')])

    with patch("veaiops.agents.chatops.interest.run.Runner") as mock_runner_class:
        with patch("veaiops.agents.chatops.interest.run.send_bot_notification") as mock_send_notification:
            mock_runner = MagicMock()
            mock_runner.run_async = MagicMock(return_value=create_async_iterator([mock_event]))
            mock_runner_class.return_value = mock_runner

            # Act
            await test_bot.save()

            await run_interest_detect_agent(bot=test_bot, msg=test_message)

            # Assert - should have mixed results
            notification = mock_send_notification.call_args[1]["data"]
            re_results = [r for r in notification.data if r.inspect_category == InterestInspectType.RE]
            semantic_results = [r for r in notification.data if r.inspect_category == InterestInspectType.Semantic]

            assert any(r.is_satisfied for r in re_results)  # SVIP should match
            assert all(not r.is_satisfied for r in semantic_results)  # Not urgent
