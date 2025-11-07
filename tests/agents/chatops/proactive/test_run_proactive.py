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
from veaiops.agents.chatops.proactive.analysis_agent import ANALYSIS_AGENT_NAME
from veaiops.agents.chatops.proactive.run import (
    calc_embs_similarity,
    run_proactive_reply_agent,
)
from veaiops.schema.documents import Message
from veaiops.schema.models.chatops import ProactiveReply
from veaiops.schema.types import ChatType

# Tests for calc_embs_similarity function


@pytest.mark.asyncio
async def test_calc_embs_similarity_with_identical_vectors():
    """Test similarity calculation with identical vectors."""
    # Arrange
    embedding = [1.0, 0.0, 0.0]
    target_embs = [[1.0, 0.0, 0.0]]

    # Act
    similarity = await calc_embs_similarity(embedding, target_embs)

    # Assert
    assert similarity == pytest.approx(1.0, abs=0.01)


@pytest.mark.asyncio
async def test_calc_embs_similarity_with_orthogonal_vectors():
    """Test similarity calculation with orthogonal vectors."""
    # Arrange
    embedding = [1.0, 0.0, 0.0]
    target_embs = [[0.0, 1.0, 0.0]]

    # Act
    similarity = await calc_embs_similarity(embedding, target_embs)

    # Assert
    assert similarity == pytest.approx(0.0, abs=0.01)


@pytest.mark.asyncio
async def test_calc_embs_similarity_with_opposite_vectors():
    """Test similarity calculation with opposite vectors."""
    # Arrange
    embedding = [1.0, 0.0, 0.0]
    target_embs = [[-1.0, 0.0, 0.0]]

    # Act
    similarity = await calc_embs_similarity(embedding, target_embs)

    # Assert
    assert similarity == pytest.approx(0.0, abs=0.01)


@pytest.mark.asyncio
async def test_calc_embs_similarity_with_empty_target():
    """Test similarity calculation with empty target embeddings."""
    # Arrange
    embedding = [1.0, 0.0, 0.0]
    target_embs = []

    # Act
    similarity = await calc_embs_similarity(embedding, target_embs)

    # Assert
    assert similarity == 0.0


@pytest.mark.asyncio
async def test_calc_embs_similarity_with_none_in_target():
    """Test similarity calculation with None in target embeddings."""
    # Arrange
    embedding = [1.0, 0.0, 0.0]
    target_embs = [None, [1.0, 0.0, 0.0]]

    # Act
    similarity = await calc_embs_similarity(embedding, target_embs)

    # Assert
    assert similarity == pytest.approx(1.0, abs=0.01)


@pytest.mark.asyncio
async def test_calc_embs_similarity_with_zero_norm():
    """Test similarity calculation when denominator is zero."""
    # Arrange
    embedding = [0.0, 0.0, 0.0]
    target_embs = [[1.0, 0.0, 0.0]]

    # Act
    similarity = await calc_embs_similarity(embedding, target_embs)

    # Assert
    assert similarity == 0.0


@pytest.mark.asyncio
async def test_calc_embs_similarity_returns_max():
    """Test that similarity returns maximum similarity among multiple targets."""
    # Arrange
    embedding = [1.0, 0.0, 0.0]
    target_embs = [
        [0.0, 1.0, 0.0],  # orthogonal, sim = 0
        [1.0, 0.0, 0.0],  # identical, sim = 1
        [0.5, 0.5, 0.0],  # partial, sim < 1
    ]

    # Act
    similarity = await calc_embs_similarity(embedding, target_embs)

    # Assert
    assert similarity == pytest.approx(1.0, abs=0.01)


@pytest.mark.asyncio
async def test_calc_embs_similarity_with_empty_list_in_target():
    """Test similarity calculation with empty list in target embeddings."""
    # Arrange
    embedding = [1.0, 0.0, 0.0]
    target_embs = [[], [1.0, 0.0, 0.0]]

    # Act
    similarity = await calc_embs_similarity(embedding, target_embs)

    # Assert
    assert similarity == pytest.approx(1.0, abs=0.01)


@pytest.mark.asyncio
async def test_run_proactive_agent_out_of_scope(test_bot, test_messages):
    """Test proactive agent with out-of-scope message."""
    # Arrange
    test_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_proactive_out_scope",
        content="What's the weather today?",
        msg_time=datetime(2025, 1, 15, 10, 0, 0),
    )

    # Mock identify agent returning out-of-scope
    mock_event = MagicMock()
    mock_event.author = "identify_agent"
    mock_event.content = Content(parts=[Part(text='{"within_scope": false, "thinking": "Weather is out of scope"}')])

    with patch("veaiops.agents.chatops.proactive.run.Runner") as mock_runner_class:
        with patch("veaiops.utils.kb.EnhancedVikingKBService"):
            mock_runner = MagicMock()
            mock_runner.run_async = MagicMock(return_value=create_async_iterator([mock_event]))
            mock_runner_class.return_value = mock_runner

            await test_bot.save()

            # Act
            await run_proactive_reply_agent(bot=test_bot, msg=test_message)

            # Verify message was processed
            saved_msg = await Message.get(test_message.id)
            assert saved_msg is not None


@pytest.mark.asyncio
async def test_run_proactive_agent_message_structure(test_bot, test_messages):
    """Test that run_proactive_agent handles message structure correctly."""
    # Arrange
    test_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_structure",
        content="What are the monitoring metrics of the alarm system?",
        msg_time=datetime(2025, 1, 15, 10, 0, 0),
    )

    # Mock agents returning valid responses
    mock_identify_event = MagicMock()
    mock_identify_event.author = "identify_agent"
    mock_identify_event.content = Content(
        parts=[Part(text='{"within_scope": true, "thinking": "This is about monitoring"}')]
    )

    mock_rewrite_event = MagicMock()
    mock_rewrite_event.author = "query_rewrite_agent"  # Correct agent name
    mock_rewrite_event.content = Content(
        parts=[
            Part(
                text='{"overall_query": "monitoring metrics", "sub_queries": ["monitoring metrics", "系统metrics类型"]}'
            )
        ]
    )

    mock_analysis_event = MagicMock()
    mock_analysis_event.author = ANALYSIS_AGENT_NAME  # Correct agent name
    mock_analysis_event.content = Content(
        parts=[Part(text='{"thinking": "Found answer", "is_answerable": true, "answer": "metrics包括CPU、内存等"}')]
    )

    with patch("veaiops.agents.chatops.proactive.run.Runner") as mock_runner_class:
        with patch("veaiops.utils.kb.EnhancedVikingKBService"):
            with patch("veaiops.agents.chatops.proactive.run.embedding_create") as mock_embedding:
                mock_runner = MagicMock()
                mock_runner.run_async = MagicMock(
                    return_value=create_async_iterator([mock_identify_event, mock_rewrite_event, mock_analysis_event])
                )
                mock_runner_class.return_value = mock_runner

                # Mock embedding creation - return list of embedding objects
                mock_emb_obj = MagicMock()
                mock_emb_obj.embedding = [0.1] * 768
                mock_embedding.return_value = [mock_emb_obj]

                await test_bot.save()

                # Act
                await run_proactive_reply_agent(bot=test_bot, msg=test_message)

                # Verify message was saved (with proactive_reply data)
                saved_msg = await Message.get(test_message.id)
                assert saved_msg is not None


# Additional comprehensive tests for run_proactive_reply_agent


@pytest.mark.asyncio
async def test_run_proactive_agent_private_chat_early_return(test_bot, test_messages):
    """Test that proactive agent returns early for private chats (not group chats)."""
    # Arrange
    test_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_private",
        content="Hello",
        msg_time=datetime(2025, 1, 15, 10, 0, 0),
    )
    # Change chat_type to private
    test_message.chat_type = ChatType.P2P
    await test_message.save()

    # Act
    with patch("veaiops.agents.chatops.proactive.run.Runner") as mock_runner_class:
        await run_proactive_reply_agent(bot=test_bot, msg=test_message)

        # Assert - Runner should not be instantiated for private chats
        mock_runner_class.assert_not_called()


@pytest.mark.asyncio
async def test_run_proactive_agent_with_kb_citations(test_bot, test_messages):
    """Test proactive agent when KB agent returns citations."""
    # Arrange
    test_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_kb_citations",
        content="What is the monitoring dashboard?",
        msg_time=datetime(2025, 1, 15, 10, 0, 0),
    )

    # Mock KB agent event with citations (correct Citation schema)
    mock_kb_event = MagicMock()
    mock_kb_event.is_final_response = MagicMock(return_value=True)
    mock_kb_event.author = "kb"  # Correct agent name
    citation_json_1 = (
        '{"content": "Monitoring Guide content", "source": "https://example.com/doc1", '
        '"title": "Monitoring Guide", "citation_type": "Document", "update_ts_seconds": 1234567890}'
    )
    citation_json_2 = (
        '{"content": "Dashboard Setup content", "source": "https://example.com/doc2", '
        '"title": "Dashboard Setup", "citation_type": "Document", "update_ts_seconds": 1234567890}'
    )
    mock_kb_event.content = Content(
        parts=[
            Part(text=citation_json_1),
            Part(text=citation_json_2),
        ]
    )

    mock_rewrite_event = MagicMock()
    mock_rewrite_event.is_final_response = MagicMock(return_value=True)
    mock_rewrite_event.author = "query_rewrite_agent"  # Correct agent name
    mock_rewrite_event.content = Content(
        parts=[Part(text='{"overall_query": "monitoring dashboard", "sub_queries": ["dashboard", "monitoring"]}')]
    )

    mock_analysis_event = MagicMock()
    mock_analysis_event.is_final_response = MagicMock(return_value=True)
    mock_analysis_event.author = ANALYSIS_AGENT_NAME  # Correct agent name
    mock_analysis_event.content = Content(
        parts=[Part(text='{"thinking": "Found info", "is_answerable": true, "answer": "The monitoring dashboard..."}')]
    )

    with patch("veaiops.agents.chatops.proactive.run.Runner") as mock_runner_class:
        with patch("veaiops.utils.kb.EnhancedVikingKBService"):
            with patch("veaiops.agents.chatops.proactive.run.embedding_create") as mock_embedding:
                with patch("veaiops.agents.chatops.proactive.run.send_bot_notification") as mock_send:
                    mock_runner = MagicMock()
                    mock_runner.run_async = MagicMock(
                        return_value=create_async_iterator([mock_kb_event, mock_rewrite_event, mock_analysis_event])
                    )
                    mock_runner_class.return_value = mock_runner

                    # Mock embedding to return high similarity (not first answer/query)
                    mock_emb_obj = MagicMock()
                    mock_emb_obj.embedding = [0.9] * 768  # High similarity
                    mock_embedding.return_value = [mock_emb_obj]

                    # Act
                    await run_proactive_reply_agent(bot=test_bot, msg=test_message)

                    # Assert - notification IS sent because this is first answer (no history)
                    mock_send.assert_called_once()
                    call_args = mock_send.call_args
                    notification = call_args[1]["data"]
                    assert notification.bot_id == test_bot.bot_id
                    assert notification.chat_id == test_message.chat_id

                    # Verify citations were passed in notification
                    assert len(notification.data.citations) == 2
                    assert notification.data.citations[0].title == "Monitoring Guide"
                    assert notification.data.citations[1].title == "Dashboard Setup"

                    # Verify message was saved with proactive_reply
                    saved_msg = await Message.get(test_message.id)
                    assert saved_msg is not None
                    assert saved_msg.proactive_reply is not None  # type: ignore
                    assert saved_msg.proactive_reply.citations is not None  # type: ignore
                    assert len(saved_msg.proactive_reply.citations) == 2  # type: ignore


@pytest.mark.asyncio
async def test_run_proactive_agent_first_answer_sends_notification(test_bot, test_messages):
    """Test that proactive agent sends notification when it's the first answer."""
    # Arrange - create history messages for the agent to process
    test_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_first_answer",
        content="What is the new feature?",
        msg_time=datetime(2025, 1, 15, 10, 0, 0),
    )

    mock_rewrite_event = MagicMock()
    mock_rewrite_event.is_final_response = MagicMock(return_value=True)
    mock_rewrite_event.author = "query_rewrite_agent"  # Correct agent name
    mock_rewrite_event.content = Content(
        parts=[Part(text='{"overall_query": "new feature", "sub_queries": ["feature"]}')]
    )

    mock_analysis_event = MagicMock()
    mock_analysis_event.is_final_response = MagicMock(return_value=True)
    mock_analysis_event.author = ANALYSIS_AGENT_NAME  # Correct agent name
    mock_analysis_event.content = Content(
        parts=[Part(text='{"thinking": "Found answer", "is_answerable": true, "answer": "The new feature is..."}')]
    )

    with patch("veaiops.agents.chatops.proactive.run.Runner") as mock_runner_class:
        with patch("veaiops.utils.kb.EnhancedVikingKBService"):
            with patch("veaiops.agents.chatops.proactive.run.embedding_create") as mock_embedding:
                with patch("veaiops.agents.chatops.proactive.run.send_bot_notification") as mock_send:
                    mock_runner = MagicMock()
                    mock_runner.run_async = MagicMock(
                        return_value=create_async_iterator([mock_rewrite_event, mock_analysis_event])
                    )
                    mock_runner_class.return_value = mock_runner

                    # Mock embedding to return low similarity (first answer)
                    # embedding_create is called twice: once for answer, once for query
                    mock_emb_obj_answer = MagicMock()
                    mock_emb_obj_answer.embedding = [0.1] * 768  # Low similarity for first answer
                    mock_emb_obj_query = MagicMock()
                    mock_emb_obj_query.embedding = [0.2] * 768  # Low similarity for first query

                    # Side effect to return different embeddings for each call
                    mock_embedding.side_effect = [[mock_emb_obj_answer], [mock_emb_obj_query]]

                    # Act
                    await run_proactive_reply_agent(bot=test_bot, msg=test_message)

                    # Assert - notification should be sent
                    mock_send.assert_called_once()
                    call_args = mock_send.call_args
                    assert call_args[1]["bot"] == test_bot
                    notification = call_args[1]["data"]
                    assert notification.bot_id == test_bot.bot_id
                    assert notification.chat_id == test_message.chat_id


@pytest.mark.asyncio
async def test_run_proactive_agent_high_similarity_no_notification(test_bot, test_messages):
    """Test that proactive agent doesn't send notification when answer similarity is high."""
    # Arrange
    test_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_high_sim",
        content="What is monitoring?",
        msg_time=datetime(2025, 1, 15, 10, 0, 0),
    )

    # Create a previous message with similar answer embedding
    prev_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_high_sim",
        content="Previous question",
        msg_time=datetime(2025, 1, 15, 9, 0, 0),
    )
    prev_message.proactive_reply = ProactiveReply(
        answer="Similar answer",
        answer_embedding=[0.9] * 768,
        rewrite_query="monitoring",
        rewrite_sub_queries=["monitoring"],
        citations=[],
        answer_similarity=0.0,
        query_similarity=0.0,
        is_first_answer=True,
        is_first_query=True,
        review_status="pending",
    )
    await prev_message.save()

    mock_rewrite_event = MagicMock()
    mock_rewrite_event.is_final_response = MagicMock(return_value=True)
    mock_rewrite_event.author = "query_rewrite_agent"  # Correct agent name
    mock_rewrite_event.content = Content(parts=[Part(text='{"overall_query": "monitoring", "sub_queries": []}')])

    mock_analysis_event = MagicMock()
    mock_analysis_event.is_final_response = MagicMock(return_value=True)
    mock_analysis_event.author = ANALYSIS_AGENT_NAME  # Correct agent name
    mock_analysis_event.content = Content(
        parts=[Part(text='{"thinking": "Found", "is_answerable": true, "answer": "Monitoring is..."}')]
    )

    with patch("veaiops.agents.chatops.proactive.run.Runner") as mock_runner_class:
        with patch("veaiops.utils.kb.EnhancedVikingKBService"):
            with patch("veaiops.agents.chatops.proactive.run.embedding_create") as mock_embedding:
                with patch("veaiops.agents.chatops.proactive.run.send_bot_notification") as mock_send:
                    mock_runner = MagicMock()
                    mock_runner.run_async = MagicMock(
                        return_value=create_async_iterator([mock_rewrite_event, mock_analysis_event])
                    )
                    mock_runner_class.return_value = mock_runner

                    # Use same embedding for both answer and query to achieve high similarity
                    mock_emb_obj = MagicMock()
                    mock_emb_obj.embedding = [0.9] * 768
                    mock_embedding.return_value = [mock_emb_obj]

                    # Act
                    await run_proactive_reply_agent(bot=test_bot, msg=test_message)

                    # Assert - notification should NOT be sent (high similarity)
                    mock_send.assert_not_called()


@pytest.mark.asyncio
async def test_run_proactive_agent_query_similarity_first_query(test_bot, test_messages):
    """Test that is_first_query is correctly set when query similarity is below threshold."""
    # Arrange
    test_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_first_query",
        content="How to configure alerts?",
        msg_time=datetime(2025, 1, 15, 10, 0, 0),
    )

    mock_rewrite_event = MagicMock()
    mock_rewrite_event.is_final_response = MagicMock(return_value=True)
    mock_rewrite_event.author = "query_rewrite_agent"  # Correct agent name
    mock_rewrite_event.content = Content(
        parts=[Part(text='{"overall_query": "configure alerts", "sub_queries": ["alerts", "configuration"]}')]
    )

    # Add analysis event so answer embeddings can be calculated
    mock_analysis_event = MagicMock()
    mock_analysis_event.is_final_response = MagicMock(return_value=True)
    mock_analysis_event.author = ANALYSIS_AGENT_NAME  # Correct agent name
    mock_analysis_event.content = Content(
        parts=[Part(text='{"thinking": "Answer", "is_answerable": true, "answer": "Configure alerts by..."}')]
    )

    with patch("veaiops.agents.chatops.proactive.run.Runner") as mock_runner_class:
        with patch("veaiops.utils.kb.EnhancedVikingKBService"):
            with patch("veaiops.agents.chatops.proactive.run.embedding_create") as mock_embedding:
                mock_runner = MagicMock()
                # Must include both rewrite and analysis events
                mock_runner.run_async = MagicMock(
                    return_value=create_async_iterator([mock_rewrite_event, mock_analysis_event])
                )
                mock_runner_class.return_value = mock_runner

                mock_emb_obj = MagicMock()
                mock_emb_obj.embedding = [0.3] * 768
                mock_embedding.return_value = [mock_emb_obj]

                # Act
                await run_proactive_reply_agent(bot=test_bot, msg=test_message)

                # Assert
                saved_msg = await Message.get(test_message.id)
                assert saved_msg is not None
                assert saved_msg.proactive_reply is not None  # type: ignore
                assert saved_msg.proactive_reply.is_first_query is True  # type: ignore
                # Similarity will be calculated by real function (low since no history)
                assert saved_msg.proactive_reply.query_similarity < 0.7  # type: ignore


@pytest.mark.asyncio
async def test_run_proactive_agent_query_similarity_not_first_query(test_bot, test_messages):
    """Test that is_first_query is False when query similarity is above threshold."""
    # Arrange
    test_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_not_first_query",
        content="How to configure alerts?",
        msg_time=datetime(2025, 1, 15, 10, 0, 0),
    )

    # Create previous message with similar query
    prev_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_not_first_query",
        content="Alert configuration",
        msg_time=datetime(2025, 1, 15, 9, 0, 0),
    )
    prev_message.proactive_reply = ProactiveReply(
        answer="Some answer",
        answer_embedding=[0.1] * 768,
        query_embedding=[0.8] * 768,
        rewrite_query="configure alerts",
        rewrite_sub_queries=["alerts"],
        citations=[],
        answer_similarity=0.0,
        query_similarity=0.0,
        is_first_answer=True,
        is_first_query=True,
        review_status="pending",
    )
    await prev_message.save()

    mock_rewrite_event = MagicMock()
    mock_rewrite_event.is_final_response = MagicMock(return_value=True)
    mock_rewrite_event.author = "query_rewrite_agent"  # Correct agent name
    mock_rewrite_event.content = Content(
        parts=[Part(text='{"overall_query": "configure alerts", "sub_queries": ["alerts"]}')]
    )

    # Add analysis event so answer embeddings can be calculated
    mock_analysis_event = MagicMock()
    mock_analysis_event.is_final_response = MagicMock(return_value=True)
    mock_analysis_event.author = ANALYSIS_AGENT_NAME  # Correct agent name
    mock_analysis_event.content = Content(
        parts=[Part(text='{"thinking": "Answer", "is_answerable": true, "answer": "Configure alerts by..."}')]
    )

    with patch("veaiops.agents.chatops.proactive.run.Runner") as mock_runner_class:
        with patch("veaiops.utils.kb.EnhancedVikingKBService"):
            with patch("veaiops.agents.chatops.proactive.run.embedding_create") as mock_embedding:
                mock_runner = MagicMock()
                # Must include both rewrite and analysis events
                mock_runner.run_async = MagicMock(
                    return_value=create_async_iterator([mock_rewrite_event, mock_analysis_event])
                )
                mock_runner_class.return_value = mock_runner

                # Use same embedding as previous message to get high similarity
                mock_emb_obj = MagicMock()
                mock_emb_obj.embedding = [0.8] * 768
                mock_embedding.return_value = [mock_emb_obj]

                # Act
                await run_proactive_reply_agent(bot=test_bot, msg=test_message)

                # Assert
                saved_msg = await Message.get(test_message.id)
                assert saved_msg is not None
                assert saved_msg.proactive_reply is not None  # type: ignore
                assert saved_msg.proactive_reply.is_first_query is False  # type: ignore
                # Similarity will be high since we use same embedding as prev message
                assert saved_msg.proactive_reply.query_similarity >= 0.7  # type: ignore


@pytest.mark.asyncio
async def test_run_proactive_agent_no_analysis_result(test_bot, test_messages):
    """Test proactive agent when analysis agent doesn't return a result."""
    # Arrange
    test_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_no_analysis",
        content="Some question",
        msg_time=datetime(2025, 1, 15, 10, 0, 0),
    )

    mock_rewrite_event = MagicMock()
    mock_rewrite_event.is_final_response = MagicMock(return_value=True)
    mock_rewrite_event.author = "query_rewrite_agent"  # Correct agent name
    mock_rewrite_event.content = Content(parts=[Part(text='{"overall_query": "question", "sub_queries": []}')])

    with patch("veaiops.agents.chatops.proactive.run.Runner") as mock_runner_class:
        with patch("veaiops.utils.kb.EnhancedVikingKBService"):
            with patch("veaiops.agents.chatops.proactive.run.embedding_create") as mock_embedding:
                with patch("veaiops.agents.chatops.proactive.run.send_bot_notification") as mock_send:
                    mock_runner = MagicMock()
                    mock_runner.run_async = MagicMock(return_value=create_async_iterator([mock_rewrite_event]))
                    mock_runner_class.return_value = mock_runner

                    mock_emb_obj = MagicMock()
                    mock_emb_obj.embedding = [0.2] * 768
                    mock_embedding.return_value = [mock_emb_obj]

                    # Act
                    await run_proactive_reply_agent(bot=test_bot, msg=test_message)

                    # Assert - no notification should be sent (no analysis result)
                    mock_send.assert_not_called()

                    # Verify proactive_reply was saved with None answer
                    saved_msg = await Message.get(test_message.id)
                    assert saved_msg is not None
                    assert saved_msg.proactive_reply is not None  # type: ignore
                    assert saved_msg.proactive_reply.answer is None  # type: ignore


@pytest.mark.asyncio
async def test_run_proactive_agent_answer_not_string(test_bot, test_messages):
    """Test that notification is not sent when answer is not a string."""
    # Arrange
    test_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_answer_not_string",
        content="Question?",
        msg_time=datetime(2025, 1, 15, 10, 0, 0),
    )

    mock_analysis_event = MagicMock()
    mock_analysis_event.is_final_response = MagicMock(return_value=True)
    mock_analysis_event.author = ANALYSIS_AGENT_NAME  # Correct agent name
    # Answer is None/null instead of string
    mock_analysis_event.content = Content(
        parts=[Part(text='{"thinking": "Cannot answer", "is_answerable": false, "answer": null}')]
    )

    mock_rewrite_event = MagicMock()
    mock_rewrite_event.is_final_response = MagicMock(return_value=True)
    mock_rewrite_event.author = "query_rewrite_agent"  # Correct agent name
    mock_rewrite_event.content = Content(parts=[Part(text='{"overall_query": "question", "sub_queries": []}')])

    with patch("veaiops.agents.chatops.proactive.run.Runner") as mock_runner_class:
        with patch("veaiops.utils.kb.EnhancedVikingKBService"):
            with patch("veaiops.agents.chatops.proactive.run.embedding_create") as mock_embedding:
                with patch("veaiops.agents.chatops.proactive.run.send_bot_notification") as mock_send:
                    mock_runner = MagicMock()
                    mock_runner.run_async = MagicMock(
                        return_value=create_async_iterator([mock_analysis_event, mock_rewrite_event])
                    )
                    mock_runner_class.return_value = mock_runner

                    mock_emb_obj = MagicMock()
                    mock_emb_obj.embedding = [0.1] * 768
                    mock_embedding.return_value = [mock_emb_obj]

                    # Act
                    await run_proactive_reply_agent(bot=test_bot, msg=test_message)

                    # Assert - no notification sent (answer is not string)
                    mock_send.assert_not_called()


@pytest.mark.asyncio
async def test_run_proactive_agent_event_without_final_response(test_bot, test_messages):
    """Test that non-final events are properly skipped."""
    # Arrange
    test_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_non_final",
        content="Question?",
        msg_time=datetime(2025, 1, 15, 10, 0, 0),
    )

    # Create non-final event
    mock_non_final_event = MagicMock()
    mock_non_final_event.is_final_response = MagicMock(return_value=False)
    mock_non_final_event.author = ANALYSIS_AGENT_NAME  # Correct agent name
    mock_non_final_event.content = Content(parts=[Part(text='{"thinking": "Processing..."}')])

    mock_rewrite_event = MagicMock()
    mock_rewrite_event.is_final_response = MagicMock(return_value=True)
    mock_rewrite_event.author = "query_rewrite_agent"  # Correct agent name
    mock_rewrite_event.content = Content(parts=[Part(text='{"overall_query": "question", "sub_queries": []}')])

    with patch("veaiops.agents.chatops.proactive.run.Runner") as mock_runner_class:
        with patch("veaiops.utils.kb.EnhancedVikingKBService"):
            with patch("veaiops.agents.chatops.proactive.run.embedding_create") as mock_embedding:
                mock_runner = MagicMock()
                mock_runner.run_async = MagicMock(
                    return_value=create_async_iterator([mock_non_final_event, mock_rewrite_event])
                )
                mock_runner_class.return_value = mock_runner

                mock_emb_obj = MagicMock()
                mock_emb_obj.embedding = [0.2] * 768
                mock_embedding.return_value = [mock_emb_obj]

                # Act
                await run_proactive_reply_agent(bot=test_bot, msg=test_message)

                # Assert - message processed successfully
                saved_msg = await Message.get(test_message.id)
                assert saved_msg is not None
                assert saved_msg.proactive_reply is not None  # type: ignore


@pytest.mark.asyncio
async def test_run_proactive_agent_event_without_content(test_bot, test_messages):
    """Test handling of events without content."""
    # Arrange
    test_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_no_content",
        content="Question?",
        msg_time=datetime(2025, 1, 15, 10, 0, 0),
    )

    # Create event without content
    mock_empty_event = MagicMock()
    mock_empty_event.is_final_response = MagicMock(return_value=True)
    mock_empty_event.author = ANALYSIS_AGENT_NAME  # Correct agent name
    mock_empty_event.content = None

    mock_rewrite_event = MagicMock()
    mock_rewrite_event.is_final_response = MagicMock(return_value=True)
    mock_rewrite_event.author = "query_rewrite_agent"  # Correct agent name
    mock_rewrite_event.content = Content(parts=[Part(text='{"overall_query": "question", "sub_queries": []}')])

    with patch("veaiops.agents.chatops.proactive.run.Runner") as mock_runner_class:
        with patch("veaiops.utils.kb.EnhancedVikingKBService"):
            with patch("veaiops.agents.chatops.proactive.run.embedding_create") as mock_embedding:
                mock_runner = MagicMock()
                mock_runner.run_async = MagicMock(
                    return_value=create_async_iterator([mock_empty_event, mock_rewrite_event])
                )
                mock_runner_class.return_value = mock_runner

                mock_emb_obj = MagicMock()
                mock_emb_obj.embedding = [0.2] * 768
                mock_embedding.return_value = [mock_emb_obj]

                # Act
                await run_proactive_reply_agent(bot=test_bot, msg=test_message)

                # Assert - processed without errors
                saved_msg = await Message.get(test_message.id)
                assert saved_msg is not None


@pytest.mark.asyncio
async def test_run_proactive_agent_event_with_empty_parts(test_bot, test_messages):
    """Test handling of events with empty parts."""
    # Arrange
    test_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_empty_parts",
        content="Question?",
        msg_time=datetime(2025, 1, 15, 10, 0, 0),
    )

    # Create event with empty parts
    mock_empty_parts_event = MagicMock()
    mock_empty_parts_event.is_final_response = MagicMock(return_value=True)
    mock_empty_parts_event.author = ANALYSIS_AGENT_NAME  # Correct agent name
    mock_empty_parts_event.content = Content(parts=[])

    mock_rewrite_event = MagicMock()
    mock_rewrite_event.is_final_response = MagicMock(return_value=True)
    mock_rewrite_event.author = "query_rewrite_agent"  # Correct agent name
    mock_rewrite_event.content = Content(parts=[Part(text='{"overall_query": "question", "sub_queries": []}')])

    with patch("veaiops.agents.chatops.proactive.run.Runner") as mock_runner_class:
        with patch("veaiops.utils.kb.EnhancedVikingKBService"):
            with patch("veaiops.agents.chatops.proactive.run.embedding_create") as mock_embedding:
                mock_runner = MagicMock()
                mock_runner.run_async = MagicMock(
                    return_value=create_async_iterator([mock_empty_parts_event, mock_rewrite_event])
                )
                mock_runner_class.return_value = mock_runner

                mock_emb_obj = MagicMock()
                mock_emb_obj.embedding = [0.2] * 768
                mock_embedding.return_value = [mock_emb_obj]

                # Act
                await run_proactive_reply_agent(bot=test_bot, msg=test_message)

                # Assert
                saved_msg = await Message.get(test_message.id)
                assert saved_msg is not None


@pytest.mark.asyncio
async def test_run_proactive_agent_is_answerable_false(test_bot, test_messages):
    """Test when analysis agent returns is_answerable=false."""
    # Arrange
    test_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_not_answerable",
        content="Out of scope question?",
        msg_time=datetime(2025, 1, 15, 10, 0, 0),
    )

    mock_analysis_event = MagicMock()
    mock_analysis_event.is_final_response = MagicMock(return_value=True)
    mock_analysis_event.author = ANALYSIS_AGENT_NAME  # Correct agent name
    mock_analysis_event.content = Content(
        parts=[Part(text='{"thinking": "Cannot answer", "is_answerable": false, "answer": null}')]
    )

    mock_rewrite_event = MagicMock()
    mock_rewrite_event.is_final_response = MagicMock(return_value=True)
    mock_rewrite_event.author = "query_rewrite_agent"  # Correct agent name
    mock_rewrite_event.content = Content(parts=[Part(text='{"overall_query": "out of scope", "sub_queries": []}')])

    with patch("veaiops.agents.chatops.proactive.run.Runner") as mock_runner_class:
        with patch("veaiops.utils.kb.EnhancedVikingKBService"):
            with patch("veaiops.agents.chatops.proactive.run.embedding_create") as mock_embedding:
                with patch("veaiops.agents.chatops.proactive.run.send_bot_notification") as mock_send:
                    mock_runner = MagicMock()
                    mock_runner.run_async = MagicMock(
                        return_value=create_async_iterator([mock_analysis_event, mock_rewrite_event])
                    )
                    mock_runner_class.return_value = mock_runner

                    mock_emb_obj = MagicMock()
                    mock_emb_obj.embedding = [0.2] * 768
                    mock_embedding.return_value = [mock_emb_obj]

                    # Act
                    await run_proactive_reply_agent(bot=test_bot, msg=test_message)

                    # Assert - no notification (is_answerable=false)
                    mock_send.assert_not_called()
