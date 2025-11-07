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
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from google.adk.agents.invocation_context import InvocationContext
from veadk import Agent

from veaiops.agents.chatops.proactive.analysis_agent import (
    ANALYSIS_AGENT_NAME,
    STATE_ANALYSIS_RESULT,
    AnalysisResult,
)
from veaiops.agents.chatops.proactive.identify_agent import (
    IDENTIFY_AGENT_NAME,
    STATE_IDENTIFY_RESULT,
    IdentifyResult,
)
from veaiops.agents.chatops.proactive.proactive_agent import (
    KB_AGENT_NAME,
    ProactiveAgent,
)
from veaiops.agents.chatops.proactive.rewrite_agent import (
    REWRITE_AGENT_NAME,
    STATE_REWRITE_RESULT,
    RewriteResult,
)
from veaiops.agents.chatops.proactive.run import run_proactive_reply_agent
from veaiops.schema.models.chatops import Citation, ProactiveReply
from veaiops.schema.types import ChannelType, ChatType, CitationType

# Tests for run_proactive_reply_agent function


@pytest.mark.asyncio
async def test_skip_non_group_chat(test_bot, test_messages):
    """Test that proactive reply is skipped for non-group chats."""
    # Create a P2P message (not group chat)
    test_message = await test_messages(
        channel=ChannelType.Lark,
        bot_id=test_bot.bot_id,
        chat_id="test_p2p_chat",
        content="Test message",
        msg_time=datetime.now(),
    )
    # Manually change to P2P after creation
    test_message.chat_type = ChatType.P2P
    await test_message.save()

    try:
        with (
            patch("veaiops.utils.kb.EnhancedVikingKBService"),
            patch("veaiops.agents.chatops.proactive.run.send_bot_notification"),
        ):
            result = await run_proactive_reply_agent(bot=test_bot, msg=test_message)

            assert result is None
    finally:
        pass


@pytest.mark.asyncio
@patch("veaiops.agents.chatops.proactive.run.init_proactive_agent")
@patch("veaiops.agents.chatops.proactive.run.Runner")
@patch("veaiops.agents.chatops.proactive.run.embedding_create")
@patch("veaiops.agents.chatops.proactive.run.send_bot_notification")
async def test_proactive_reply_with_answerable_result(
    mock_send_notification, mock_embedding_create, mock_runner_class, mock_init_agent, test_bot, test_messages
):
    """Test proactive reply agent with answerable result."""
    # Arrange - Create historical messages in the database
    base_time = datetime(2025, 1, 15, 10, 0, 0)
    chat_id = "test_chat_answerable"

    # Create some previous messages in the chat
    await test_messages(
        bot_id=test_bot.bot_id,
        chat_id=chat_id,
        content="What is the system status?",
        msg_time=base_time,
    )
    await test_messages(
        bot_id=test_bot.bot_id,
        chat_id=chat_id,
        content="I need help with monitoring",
        msg_time=base_time + timedelta(minutes=1),
    )

    # Create the current message we're testing
    test_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id=chat_id,
        content="How do I configure alerts?",
        msg_time=base_time + timedelta(minutes=2),
    )

    # Mock ProactiveAgent
    mock_agent = AsyncMock()
    mock_init_agent.return_value = mock_agent

    # Mock Runner
    mock_runner = MagicMock()
    mock_runner_class.return_value = mock_runner

    # Mock agent events
    analysis_event = MagicMock()
    analysis_event.is_final_response.return_value = True
    analysis_event.content = MagicMock()
    analysis_event.content.parts = [
        MagicMock(text='{"thinking": "test", "is_answerable": true, "answer": "Test answer"}')
    ]
    analysis_event.author = ANALYSIS_AGENT_NAME

    rewrite_event = MagicMock()
    rewrite_event.is_final_response.return_value = True
    rewrite_event.content = MagicMock()
    rewrite_event.content.parts = [
        MagicMock(text='{"overall_query": "Test query", "sub_queries": ["Sub query 1", "Sub query 2"]}')
    ]
    rewrite_event.author = REWRITE_AGENT_NAME

    async def mock_run_async(*args, **kwargs):
        yield analysis_event
        yield rewrite_event

    mock_runner.run_async = mock_run_async

    # Mock embedding
    mock_embedding = MagicMock()
    mock_embedding.embedding = [0.1, 0.2, 0.3]
    mock_embedding_create.return_value = [mock_embedding]

    # Act
    with patch("veaiops.utils.kb.EnhancedVikingKBService"):
        await run_proactive_reply_agent(bot=test_bot, msg=test_message)

    # Assert
    mock_runner_class.assert_called_once()
    # Should send notification because it's a first answer
    mock_send_notification.assert_called_once()


@pytest.mark.asyncio
@patch("veaiops.agents.chatops.proactive.run.Runner")
@patch("veaiops.agents.chatops.proactive.run.embedding_create")
@patch("veaiops.agents.chatops.proactive.run.send_bot_notification")
async def test_proactive_reply_with_high_similarity(
    mock_send_notification, mock_embedding_create, mock_runner_class, test_bot, test_messages
):
    """Test proactive reply agent when answer similarity is high (should not send)."""
    # Arrange - Create messages in the database
    base_time = datetime(2025, 1, 15, 10, 0, 0)
    chat_id = "test_chat_high_similarity"

    # Create previous message with similar proactive reply
    msg1 = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id=chat_id,
        content="Previous message",
        msg_time=base_time,
    )
    # Add proactive reply with high similarity embedding
    msg1.proactive_reply = ProactiveReply(
        answer_embedding=[1.0, 0.0, 0.0],
        query_embedding=[1.0, 0.0, 0.0],
    )
    await msg1.save()

    # Create the current message
    test_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id=chat_id,
        content="Latest message",
        msg_time=base_time + timedelta(minutes=1),
    )

    mock_runner = MagicMock()
    mock_runner_class.return_value = mock_runner

    analysis_event = MagicMock()
    analysis_event.is_final_response.return_value = True
    analysis_event.content = MagicMock()
    analysis_event.content.parts = [
        MagicMock(text='{"thinking": "test", "is_answerable": true, "answer": "Test answer"}')
    ]
    analysis_event.author = ANALYSIS_AGENT_NAME

    rewrite_event = MagicMock()
    rewrite_event.is_final_response.return_value = True
    rewrite_event.content = MagicMock()
    rewrite_event.content.parts = [MagicMock(text='{"overall_query": "Test query", "sub_queries": ["Sub query 1"]}')]
    rewrite_event.author = REWRITE_AGENT_NAME

    async def mock_run_async(*args, **kwargs):
        yield analysis_event
        yield rewrite_event

    mock_runner.run_async = mock_run_async

    # Mock embedding - same embedding for both (high similarity)
    mock_embedding = MagicMock()
    mock_embedding.embedding = [1.0, 0.0, 0.0]
    mock_embedding_create.return_value = [mock_embedding]

    # Act
    with patch("veaiops.utils.kb.EnhancedVikingKBService"):
        await run_proactive_reply_agent(bot=test_bot, msg=test_message)

    # Assert
    # Should NOT send notification because similarity is high (>= 0.7)
    mock_send_notification.assert_not_called()


@pytest.mark.asyncio
@patch("veaiops.agents.chatops.proactive.run.Runner")
async def test_proactive_reply_with_non_answerable_result(mock_runner_class, test_bot, test_messages):
    """Test proactive reply agent with non-answerable result."""
    # Arrange - Create messages in the database
    base_time = datetime(2025, 1, 15, 10, 0, 0)
    chat_id = "test_chat_non_answerable"

    # Create previous messages
    await test_messages(
        bot_id=test_bot.bot_id,
        chat_id=chat_id,
        content="Previous message",
        msg_time=base_time,
    )

    # Create the current message
    test_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id=chat_id,
        content="Latest message",
        msg_time=base_time + timedelta(minutes=1),
    )

    mock_runner = MagicMock()
    mock_runner_class.return_value = mock_runner

    analysis_event = MagicMock()
    analysis_event.is_final_response.return_value = True
    analysis_event.content = MagicMock()
    analysis_event.content.parts = [MagicMock(text='{"thinking": "test", "is_answerable": false, "answer": null}')]
    analysis_event.author = ANALYSIS_AGENT_NAME

    async def mock_run_async(*args, **kwargs):
        yield analysis_event

    mock_runner.run_async = mock_run_async

    # Act
    with (
        patch("veaiops.utils.kb.EnhancedVikingKBService"),
        patch("veaiops.agents.chatops.proactive.run.send_bot_notification") as mock_send,
    ):
        await run_proactive_reply_agent(bot=test_bot, msg=test_message)

        # Assert
        # Should NOT send notification because question is not answerable
        mock_send.assert_not_called()


@pytest.mark.asyncio
@patch("veaiops.agents.chatops.proactive.run.Runner")
@patch("veaiops.agents.chatops.proactive.run.embedding_create")
async def test_proactive_reply_with_kb_citations(mock_embedding_create, mock_runner_class, test_bot, test_messages):
    """Test proactive reply agent with KB citations."""
    # Arrange - Create messages in the database
    base_time = datetime(2025, 1, 15, 10, 0, 0)
    chat_id = "test_chat_kb_citations"

    # Create previous messages (no proactive replies, so similarity check passes)
    await test_messages(
        bot_id=test_bot.bot_id,
        chat_id=chat_id,
        content="Previous message",
        msg_time=base_time,
    )

    # Create the current message
    test_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id=chat_id,
        content="Latest message",
        msg_time=base_time + timedelta(minutes=1),
    )

    mock_runner = MagicMock()
    mock_runner_class.return_value = mock_runner

    # KB event with citations
    kb_event = MagicMock()
    kb_event.is_final_response.return_value = True
    kb_event.content = MagicMock()
    citation_json = (
        '{"citation_type": "QA", "source": "test_source", "title": "Test Title", '
        '"knowledge_key": "key1", "content": "test content", "update_ts_seconds": 1234567890}'
    )
    kb_event.content.parts = [MagicMock(text=citation_json)]
    kb_event.author = KB_AGENT_NAME

    analysis_event = MagicMock()
    analysis_event.is_final_response.return_value = True
    analysis_event.content = MagicMock()
    analysis_event.content.parts = [
        MagicMock(text='{"thinking": "test", "is_answerable": true, "answer": "Test answer"}')
    ]
    analysis_event.author = ANALYSIS_AGENT_NAME

    async def mock_run_async(*args, **kwargs):
        yield kb_event
        yield analysis_event

    mock_runner.run_async = mock_run_async

    mock_embedding = MagicMock()
    mock_embedding.embedding = [0.1, 0.2, 0.3]
    mock_embedding_create.return_value = [mock_embedding]

    # Act
    with (
        patch("veaiops.utils.kb.EnhancedVikingKBService"),
        patch("veaiops.agents.chatops.proactive.run.send_bot_notification") as mock_send,
    ):
        await run_proactive_reply_agent(bot=test_bot, msg=test_message)

        # Assert
        # Should send notification with citations
        mock_send.assert_called_once()
        notification = mock_send.call_args[1]["data"]
        assert len(notification.data.citations) == 1


@pytest.mark.asyncio
@patch("veaiops.agents.chatops.proactive.run.Runner")
async def test_proactive_reply_without_rewrite_query(mock_runner_class, test_bot, test_messages):
    """Test proactive reply agent when no rewrite query is generated."""
    # Arrange - Create messages in the database
    base_time = datetime(2025, 1, 15, 10, 0, 0)
    chat_id = "test_chat_no_rewrite"

    # Create previous messages
    await test_messages(
        bot_id=test_bot.bot_id,
        chat_id=chat_id,
        content="Previous message",
        msg_time=base_time,
    )

    # Create the current message
    test_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id=chat_id,
        content="Latest message",
        msg_time=base_time + timedelta(minutes=1),
    )

    mock_runner = MagicMock()
    mock_runner_class.return_value = mock_runner

    # Only analysis event, no rewrite event
    analysis_event = MagicMock()
    analysis_event.is_final_response.return_value = True
    analysis_event.content = MagicMock()
    analysis_event.content.parts = [MagicMock(text='{"thinking": "test", "is_answerable": false, "answer": null}')]
    analysis_event.author = ANALYSIS_AGENT_NAME

    async def mock_run_async(*args, **kwargs):
        yield analysis_event

    mock_runner.run_async = mock_run_async

    # Act
    with patch("veaiops.utils.kb.EnhancedVikingKBService"):
        await run_proactive_reply_agent(bot=test_bot, msg=test_message)

    # Assert - should complete without error
    assert True  # Test passes if no exception raised


# Tests for ProactiveAgent class


@pytest.mark.asyncio
async def test_proactive_agent_run_with_out_of_scope():
    """Test ProactiveAgent._run_async_impl when question is out of scope."""
    # Arrange
    mock_identify_agent = AsyncMock(spec=Agent)
    mock_rewrite_agent = AsyncMock(spec=Agent)
    mock_analysis_agent = AsyncMock(spec=Agent)
    mock_viking_kb = MagicMock()

    # Mock identify agent to return out of scope
    async def mock_identify_run(*args, **kwargs):
        ctx = args[0]
        ctx.session.state[STATE_IDENTIFY_RESULT] = IdentifyResult(
            within_scope=False, thinking="Out of scope"
        ).model_dump()
        event = MagicMock()
        event.is_final_response.return_value = True
        yield event

    mock_identify_agent.run_async = mock_identify_run
    mock_identify_agent.name = IDENTIFY_AGENT_NAME
    mock_rewrite_agent.name = REWRITE_AGENT_NAME
    mock_analysis_agent.name = ANALYSIS_AGENT_NAME

    # Bypass Pydantic validation with model_construct
    agent = ProactiveAgent.model_construct(
        name="test_agent",
        identifier=mock_identify_agent,
        rewriter=mock_rewrite_agent,
        analyzer=mock_analysis_agent,
        kb_collections=[],
        vikingkb=mock_viking_kb,
        model_api_key="test_api_key",
    )

    # Mock context
    ctx = MagicMock(spec=InvocationContext)
    ctx.session = MagicMock()
    ctx.session.state = {}

    # Act
    events = []
    async for event in agent._run_async_impl(ctx):
        events.append(event)

    # Assert
    # Should only have events from identify agent, not from rewriter or analyzer
    assert len(events) >= 1


@pytest.mark.asyncio
async def test_proactive_agent_run_with_in_scope_but_not_answerable():
    """Test ProactiveAgent._run_async_impl when question is in scope but not answerable."""
    # Arrange
    mock_identify_agent = AsyncMock()
    mock_rewrite_agent = AsyncMock()
    mock_analysis_agent = AsyncMock()
    mock_viking_kb = MagicMock()
    # Mock should return empty result_list in proper format
    mock_viking_kb.async_search_knowledge = AsyncMock(return_value={"result_list": []})

    # Mock identify agent to return in scope
    async def mock_identify_run(*args, **kwargs):
        ctx = args[0]
        ctx.session.state[STATE_IDENTIFY_RESULT] = IdentifyResult(within_scope=True, thinking="In scope").model_dump()
        event = MagicMock()
        event.is_final_response.return_value = True
        yield event

    # Mock rewrite agent
    async def mock_rewrite_run(*args, **kwargs):
        ctx = args[0]
        ctx.session.state[STATE_REWRITE_RESULT] = RewriteResult(
            overall_query="Test query", sub_queries=["Sub query 1"]
        ).model_dump()
        event = MagicMock()
        event.is_final_response.return_value = True
        yield event

    # Mock analysis agent to return not answerable
    async def mock_analysis_run(*args, **kwargs):
        ctx = args[0]
        ctx.session.state[STATE_ANALYSIS_RESULT] = AnalysisResult(
            thinking="Not answerable", is_answerable=False, answer=None
        ).model_dump()
        event = MagicMock()
        event.is_final_response.return_value = True
        yield event

    mock_identify_agent.run_async = mock_identify_run
    mock_identify_agent.name = IDENTIFY_AGENT_NAME
    mock_rewrite_agent.run_async = mock_rewrite_run
    mock_rewrite_agent.name = REWRITE_AGENT_NAME
    mock_analysis_agent.run_async = mock_analysis_run
    mock_analysis_agent.name = ANALYSIS_AGENT_NAME

    mock_collection = MagicMock()
    mock_collection.collection_name = "test_collection"
    mock_collection.project = "test_project"

    # Bypass Pydantic validation with model_construct
    agent = ProactiveAgent.model_construct(
        name="test_agent_in_scope",
        identifier=mock_identify_agent,
        rewriter=mock_rewrite_agent,
        analyzer=mock_analysis_agent,
        kb_collections=[mock_collection],
        vikingkb=mock_viking_kb,
        model_api_key="test_api_key",
    )

    # Mock context
    ctx = MagicMock(spec=InvocationContext)
    ctx.session = MagicMock()
    ctx.session.state = {}

    # Act
    events = []
    async for event in agent._run_async_impl(ctx):
        events.append(event)

    # Assert
    # Should have events from all agents but no final citations
    assert len(events) >= 3


@pytest.mark.asyncio
@patch("veaiops.agents.chatops.proactive.proactive_agent.convert_viking_to_citations")
async def test_proactive_agent_run_with_answerable_question(mock_convert_citations):
    """Test ProactiveAgent._run_async_impl with complete answerable flow."""
    # Arrange
    mock_identify_agent = AsyncMock()
    mock_rewrite_agent = AsyncMock()
    mock_analysis_agent = AsyncMock()
    mock_viking_kb = MagicMock()
    mock_viking_kb.async_search_knowledge = AsyncMock(return_value=[{"text": "test"}])

    # Mock identify agent to return in scope
    async def mock_identify_run(*args, **kwargs):
        ctx = args[0]
        ctx.session.state[STATE_IDENTIFY_RESULT] = IdentifyResult(within_scope=True, thinking="In scope").model_dump()
        event = MagicMock()
        event.is_final_response.return_value = True
        yield event

    # Mock rewrite agent
    async def mock_rewrite_run(*args, **kwargs):
        ctx = args[0]
        ctx.session.state[STATE_REWRITE_RESULT] = RewriteResult(
            overall_query="Test query", sub_queries=["Sub query 1"]
        ).model_dump()
        event = MagicMock()
        event.is_final_response.return_value = True
        yield event

    # Mock analysis agent to return answerable
    async def mock_analysis_run(*args, **kwargs):
        ctx = args[0]
        ctx.session.state[STATE_ANALYSIS_RESULT] = AnalysisResult(
            thinking="Answerable", is_answerable=True, answer="Test answer with <doc>1</doc>"
        ).model_dump()
        event = MagicMock()
        event.is_final_response.return_value = True
        yield event

    mock_identify_agent.run_async = mock_identify_run
    mock_identify_agent.name = IDENTIFY_AGENT_NAME
    mock_rewrite_agent.run_async = mock_rewrite_run
    mock_rewrite_agent.name = REWRITE_AGENT_NAME
    mock_analysis_agent.run_async = mock_analysis_run
    mock_analysis_agent.name = ANALYSIS_AGENT_NAME

    # Mock citation conversion
    mock_citation = Citation(
        citation_type=CitationType.QA,
        source="test_source",
        title="Test Title",
        knowledge_key="key1",
        content="Test content",
        update_ts_seconds=1234567890,
    )
    mock_convert_citations.return_value = [mock_citation]

    mock_collection = MagicMock()
    mock_collection.collection_name = "test_collection"
    mock_collection.project = "test_project"

    # Bypass Pydantic validation with model_construct
    agent = ProactiveAgent.model_construct(
        name="test_agent_answerable",
        identifier=mock_identify_agent,
        rewriter=mock_rewrite_agent,
        analyzer=mock_analysis_agent,
        kb_collections=[mock_collection],
        vikingkb=mock_viking_kb,
        model_api_key="test_api_key",
    )

    # Mock context
    ctx = MagicMock(spec=InvocationContext)
    ctx.session = MagicMock()
    ctx.session.state = {}

    # Act
    events = []
    async for event in agent._run_async_impl(ctx):
        events.append(event)

    # Assert
    # Should have events from all agents plus citations
    assert len(events) >= 4
    # Last event should be citations
    assert events[-1].author == KB_AGENT_NAME
