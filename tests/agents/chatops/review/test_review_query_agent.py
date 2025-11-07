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

from datetime import timedelta
from unittest.mock import patch

import pytest

from tests.utils import (
    create_mock_runner_with_response,
    create_mock_viking_kb_service,
    get_test_base_time,
)
from veaiops.agents.chatops.review.review_query_agent import (
    QUERY_REVIEW_AGENT_NAME,
    STATE_REVIEW_RESULT,
    ExtractedAnswer,
    init_query_review_agent,
    run_query_review_agent,
)
from veaiops.schema.documents.chatops.kb import KBType, VeKB


@pytest.mark.asyncio
async def test_init_query_review_agent_basic(test_bot):
    """Test basic initialization of query review agent."""
    # Arrange
    description = "Test query review agent description"
    instruction = "Test instruction for reviewing queries"

    # Act
    agent = await init_query_review_agent(bot=test_bot, description=description, instruction=instruction)

    # Assert
    assert agent is not None
    assert agent.name == QUERY_REVIEW_AGENT_NAME
    assert agent.description == description
    assert agent.instruction == instruction
    assert agent.output_key == STATE_REVIEW_RESULT
    assert agent.output_schema == ExtractedAnswer


@pytest.mark.asyncio
async def test_query_review_agent_model_config(test_bot):
    """Test that query review agent correctly uses bot's model configuration."""
    # Arrange
    description = "Test description"
    instruction = "Test instruction"

    # Act
    agent = await init_query_review_agent(bot=test_bot, description=description, instruction=instruction)

    # Assert - verify model configuration is passed correctly
    assert agent.model_name == test_bot.agent_cfg.name
    assert agent.model_provider == test_bot.agent_cfg.provider


@pytest.mark.asyncio
async def test_run_query_review_agent_no_answer_found(test_bot, test_messages):
    """Test run_query_review_agent when no answer is found in forward messages."""
    # Arrange
    base_time = get_test_base_time()

    # Create backward messages for context with automatic cleanup
    await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_query",
        content="Background information",
        msg_time=base_time - timedelta(minutes=5),
    )

    # Create the query message with pending review
    test_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_query",
        content="Test question",
        msg_time=base_time,
        proactive_reply={
            "rewrite_query": "Test query question",
            "answer": "",
            "is_first_query": True,
            "review_status": "pending",
        },
    )

    # Create forward messages (no clear answer) with automatic cleanup
    await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_query",
        content="Unrelated reply",
        msg_time=base_time + timedelta(minutes=2),
    )

    # Mock Runner to return no answer found
    with patch("veaiops.agents.chatops.review.review_query_agent.Runner") as mock_runner_class:
        mock_runner, _ = create_mock_runner_with_response('{"has_answer": false, "answer": null}')
        mock_runner_class.return_value = mock_runner

        # Act
        await run_query_review_agent(bot=test_bot, msg=test_message)

        # Assert - Runner was called but no knowledge base update (no answer found)
        assert mock_runner_class.called


@pytest.mark.asyncio
async def test_run_query_review_agent_saves_to_kb(test_bot, test_chat, test_messages, test_vekb):
    """Test that run_query_review_agent saves query to knowledge base."""
    # Arrange
    base_time = get_test_base_time()

    # Create backward messages for context with automatic cleanup
    await test_messages(
        bot_id=test_bot.bot_id,
        chat_id=test_chat.chat_id,
        content="Background information",
        msg_time=base_time - timedelta(minutes=5),
    )

    # Create the query message
    test_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id=test_chat.chat_id,
        content="Test question",
        msg_time=base_time,
        proactive_reply={
            "rewrite_query": "How to configure the system?",
            "answer": "",
            "is_first_query": True,
            "review_status": "pending",
        },
    )

    # Create forward messages with answer with automatic cleanup
    await test_messages(
        bot_id=test_bot.bot_id,
        chat_id=test_chat.chat_id,
        content="You need to set parameters in the config file",
        msg_time=base_time + timedelta(minutes=2),
    )

    # Mock only external Viking KB service
    with patch("veaiops.agents.chatops.review.review_query_agent.Runner") as mock_runner_class:
        with patch("veaiops.agents.chatops.review.review_query_agent.EnhancedVikingKBService") as mock_viking_service:
            # Setup mock Viking KB service
            mock_viking_instance, mock_collection = create_mock_viking_kb_service(point_id="test_point_id_123")
            mock_viking_service.return_value = mock_viking_instance

            # Mock Runner to return extracted answer
            mock_runner, _ = create_mock_runner_with_response(
                '{"has_answer": true, "answer": "Set parameters in the config file"}'
            )
            mock_runner_class.return_value = mock_runner

            # Act - uses real VeKB from database and real VeAIOpsKBManager (including get_or_create_collection)
            await run_query_review_agent(bot=test_bot, msg=test_message)

            # Assert - Collection.add_point was called
            mock_collection.add_point.assert_called_once()

            # Verify message was updated
            await test_message.sync()
            assert test_message.proactive_reply.review_status == "add"
            assert test_message.proactive_reply.knowledge_key == "test_point_id_123"


@pytest.mark.asyncio
async def test_run_query_review_agent_creates_kb_if_not_exists(test_bot, test_chat, test_messages):
    """Test that run_query_review_agent creates knowledge base if it doesn't exist."""
    base_time = get_test_base_time()

    # Create test message with proactive reply
    test_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id=test_chat.chat_id,
        content="Test question",
        msg_time=base_time,
        proactive_reply={
            "rewrite_query": "New question",
            "is_first_query": True,
            "review_status": "pending",
        },
    )

    # Create forward message with answer using test_messages for automatic cleanup
    await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_new_kb",
        content="This is the answer",
        msg_time=base_time + timedelta(minutes=1),
    )

    # Ensure no KB exists before the test
    existing_kb = await VeKB.find_one(
        VeKB.bot_id == test_bot.bot_id, VeKB.channel == test_message.channel, VeKB.kb_type == KBType.AutoQA
    )
    if existing_kb:
        await existing_kb.delete()

    # Mock set_default_knowledgebase to create a VeKB
    async def mock_set_default_kb(bot):
        vekb = VeKB(
            bot_id=bot.bot_id,
            channel=test_message.channel,
            kb_type=KBType.AutoQA,
            collection_name="test_collection",
            project="test_project",
            bucket_name="test_bucket",
        )
        await vekb.insert()

    # Mock only external Viking KB service
    with patch("veaiops.agents.chatops.review.review_query_agent.Runner") as mock_runner_class:
        with patch("veaiops.agents.chatops.review.review_query_agent.EnhancedVikingKBService") as mock_viking_service:
            with patch(
                "veaiops.agents.chatops.review.review_query_agent.set_default_knowledgebase",
                side_effect=mock_set_default_kb,
            ):
                # Setup mock Viking KB service
                mock_viking_instance, mock_collection = create_mock_viking_kb_service(point_id="new_point_id")
                mock_viking_service.return_value = mock_viking_instance

                # Mock Runner to return answer
                mock_runner, _ = create_mock_runner_with_response('{"has_answer": true, "answer": "Answer content"}')
                mock_runner_class.return_value = mock_runner

                # Act - will create VeKB in database through mocked set_default_knowledgebase
                await run_query_review_agent(bot=test_bot, msg=test_message)

            # Verify VeKB was created in database
            created_kb = await VeKB.find_one(
                VeKB.bot_id == test_bot.bot_id, VeKB.channel == test_message.channel, VeKB.kb_type == KBType.AutoQA
            )
            assert created_kb is not None
            assert created_kb.bot_id == test_bot.bot_id

            # Verify message was updated
            await test_message.sync()
            assert test_message.proactive_reply.review_status == "add"
            assert test_message.proactive_reply.knowledge_key == "new_point_id"

    # Cleanup
    if created_kb:
        await created_kb.delete()
