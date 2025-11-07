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

from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch

import pytest

from tests.agents.chatops.utils import create_async_iterator, create_mock_runner_with_response
from tests.utils import create_mock_viking_kb_service, get_test_base_time
from veaiops.agents.chatops.review.review_answer_agent import run_answer_review_agent
from veaiops.schema.types import CitationType


@pytest.mark.asyncio
async def test_run_answer_review_agent_basic(test_bot, test_messages):
    """Test basic execution of answer review agent."""
    # Arrange - Create messages in chronological order to provide context
    base_time = datetime(2025, 1, 15, 10, 0, 0)

    # Create backward messages (earlier messages for context)
    await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_answer_review",
        content="This is previous message 1",
        msg_time=base_time - timedelta(minutes=10),
    )

    await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_answer_review",
        content="This is previous message 2",
        msg_time=base_time - timedelta(minutes=5),
    )

    # Create the target message with proactive reply
    test_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_answer_review",
        content="Test question",
        msg_time=base_time,
        proactive_reply={
            "rewrite_query": "Test query",
            "answer": "This is a test answer",
            "is_first_answer": True,
        },
    )

    # Create forward messages (later messages for context)
    await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_answer_review",
        content="This is next message 1",
        msg_time=base_time + timedelta(minutes=5),
    )

    await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_answer_review",
        content="This is next message 2",
        msg_time=base_time + timedelta(minutes=10),
    )

    # Only mock the Runner to avoid actual LLM calls
    with patch("veaiops.agents.chatops.review.review_answer_agent.Runner") as mock_runner_class:
        mock_runner = MagicMock()
        # Mock run_async to return an async iterator
        mock_runner.run_async.return_value = create_async_iterator([])
        mock_runner_class.return_value = mock_runner

        # Act - let real get_backward/forward_chat_messages fetch the created messages
        await run_answer_review_agent(bot=test_bot, msg=test_message)

        # Assert - Runner should have been initialized (agent was executed with real context)
        assert mock_runner_class.called
        assert mock_runner.run_async.called


@pytest.mark.asyncio
async def test_run_answer_review_agent_action_pending(test_bot, test_chat, test_messages):
    """Test answer review agent with action=pending."""
    base_time = get_test_base_time()

    # Create messages with automatic cleanup
    await test_messages(
        bot_id=test_bot.bot_id,
        chat_id=test_chat.chat_id,
        content="Background info",
        msg_time=base_time - timedelta(minutes=5),
    )

    test_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id=test_chat.chat_id,
        content="Test question",
        msg_time=base_time,
        proactive_reply={
            "rewrite_query": "Test query",
            "answer": "Test answer",
            "is_first_answer": True,
        },
    )

    await test_messages(
        bot_id=test_bot.bot_id,
        chat_id=test_chat.chat_id,
        content="Next message info",
        msg_time=base_time + timedelta(minutes=5),
    )

    # Mock Runner to return action=pending
    with patch("veaiops.agents.chatops.review.review_answer_agent.Runner") as mock_runner_class:
        mock_runner, _ = create_mock_runner_with_response('{"action": "pending"}')
        mock_runner_class.return_value = mock_runner

        # Act
        await run_answer_review_agent(bot=test_bot, msg=test_message)

        # Assert - message should be marked as "keep" for pending action
        await test_message.sync()
        assert test_message.proactive_reply.review_status == "keep"


@pytest.mark.asyncio
async def test_run_answer_review_agent_action_keep(test_bot, test_chat, test_messages):
    """Test answer review agent with action=keep."""
    base_time = get_test_base_time()

    # Create messages with automatic cleanup
    await test_messages(
        bot_id=test_bot.bot_id,
        chat_id=test_chat.chat_id,
        content="Background info",
        msg_time=base_time - timedelta(minutes=5),
    )

    test_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id=test_chat.chat_id,
        content="Test question",
        msg_time=base_time,
        proactive_reply={
            "rewrite_query": "Test query",
            "answer": "Test answer",
            "is_first_answer": True,
        },
    )

    await test_messages(
        bot_id=test_bot.bot_id,
        chat_id=test_chat.chat_id,
        content="Next message info",
        msg_time=base_time + timedelta(minutes=5),
    )

    # Mock Runner to return action=keep
    with patch("veaiops.agents.chatops.review.review_answer_agent.Runner") as mock_runner_class:
        mock_runner, _ = create_mock_runner_with_response('{"action": "keep"}')
        mock_runner_class.return_value = mock_runner

        # Act
        await run_answer_review_agent(bot=test_bot, msg=test_message)

        # Assert
        await test_message.sync()
        assert test_message.proactive_reply.review_status == "keep"


@pytest.mark.asyncio
async def test_run_answer_review_agent_action_modify(test_bot, test_chat, test_messages, test_vekb):
    """Test answer review agent with action=modify."""
    base_time = get_test_base_time()

    # Create messages with automatic cleanup
    await test_messages(
        bot_id=test_bot.bot_id,
        chat_id=test_chat.chat_id,
        content="Background info",
        msg_time=base_time - timedelta(minutes=5),
    )

    test_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id=test_chat.chat_id,
        content="Test question",
        msg_time=base_time,
        proactive_reply={
            "rewrite_query": "Test query",
            "answer": "Test answer",
            "is_first_answer": True,
        },
    )

    await test_messages(
        bot_id=test_bot.bot_id,
        chat_id=test_chat.chat_id,
        content="Next message info",
        msg_time=base_time + timedelta(minutes=5),
    )

    # Mock Viking KB service and Runner
    with patch("veaiops.agents.chatops.review.review_answer_agent.Runner") as mock_runner_class:
        with patch("veaiops.agents.chatops.review.review_answer_agent.EnhancedVikingKBService") as mock_viking_service:
            # Setup mock Viking KB service
            mock_viking_instance, _ = create_mock_viking_kb_service(point_id="modified_point_123")
            mock_viking_service.return_value = mock_viking_instance

            # Setup mock runner
            mock_runner, _ = create_mock_runner_with_response(
                '{"action": "modify", "question": "修改后的问题", "answer": "修改后的答案"}'
            )
            mock_runner_class.return_value = mock_runner

            # Act
            await run_answer_review_agent(bot=test_bot, msg=test_message)

            # Assert
            await test_message.sync()
            assert test_message.proactive_reply.review_status == "modify"
            assert test_message.proactive_reply.modified_query == "修改后的问题"
            assert test_message.proactive_reply.modified_answer == "修改后的答案"
            assert test_message.proactive_reply.knowledge_key == "modified_point_123"


@pytest.mark.asyncio
async def test_run_answer_review_agent_action_delete(test_bot, test_chat, test_messages, test_vekb):
    """Test answer review agent with action=delete."""
    base_time = get_test_base_time()

    # Create messages with automatic cleanup
    await test_messages(
        bot_id=test_bot.bot_id,
        chat_id=test_chat.chat_id,
        content="Background info",
        msg_time=base_time - timedelta(minutes=5),
    )

    test_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id=test_chat.chat_id,
        content="Test question",
        msg_time=base_time,
        proactive_reply={
            "rewrite_query": "Test query",
            "answer": "Test answer",
            "is_first_answer": True,
            "citations": [
                {
                    "knowledge_key": "citation_key_1",
                    "citation_type": CitationType.QA,
                    "title": "Citation question 1",
                    "content": "Citation answer 1",
                    "source": "test_source",
                    "update_ts_seconds": int(base_time.timestamp()),
                }
            ],
        },
    )

    await test_messages(
        bot_id=test_bot.bot_id,
        chat_id=test_chat.chat_id,
        content="下文信息",
        msg_time=base_time + timedelta(minutes=5),
    )

    # Mock Viking KB service and Runner
    with patch("veaiops.agents.chatops.review.review_answer_agent.Runner") as mock_runner_class:
        with patch("veaiops.agents.chatops.review.review_answer_agent.EnhancedVikingKBService") as mock_viking_service:
            # Setup mock collection with delete capability
            mock_viking_instance, mock_collection = create_mock_viking_kb_service()
            mock_collection.delete_point = MagicMock()
            mock_viking_service.return_value = mock_viking_instance

            # Setup mock runner
            mock_runner, _ = create_mock_runner_with_response(
                '{"action": "delete", "delete_citation_ids": ["citation_key_1"]}'
            )
            mock_runner_class.return_value = mock_runner

            # Act
            await run_answer_review_agent(bot=test_bot, msg=test_message)

            # Assert
            await test_message.sync()
            assert test_message.proactive_reply.review_status == "delete"
            assert test_message.proactive_reply.deleted_citations is not None
            assert "citation_key_1" in test_message.proactive_reply.deleted_citations
            mock_collection.delete_point.assert_called_once()
