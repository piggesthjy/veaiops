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
from unittest.mock import AsyncMock, patch

import pytest

# fixture handles message creation
from veaiops.agents.chatops.review.run import REVIEW_MINUTES_DELTA, run_review_agent
from veaiops.schema.documents import AgentNotification, Event, EventNoticeFeedback
from veaiops.schema.models.chatops import AgentReplyResp, ProactiveReply
from veaiops.schema.types import AgentType, ChannelType, EventLevel, FeedbackActionType


@pytest.mark.asyncio
async def test_run_review_agent_no_candidates(test_bot, test_messages):
    """Test run_review_agent when no candidate messages are found."""
    # Arrange
    test_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_no_candidates",
        content="Test message without links",
        msg_time=datetime(2025, 1, 15, 10, 0, 0),
    )

    # Act - run_review_agent will run review_link but won't find any URLs
    # No mocking needed - let it run naturally, just won't find candidates
    await run_review_agent(bot=test_bot, msg=test_message)


@pytest.mark.asyncio
async def test_run_review_agent_with_pending_query_message(test_bot, test_messages):
    """Test run_review_agent with a pending query message."""
    # Arrange
    current_time = datetime(2025, 1, 15, 10, 30, 0)
    test_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_pending_query",
        content="Current message",
        msg_time=current_time,
    )

    # Create a candidate message that needs review (older than REVIEW_MINUTES_DELTA)
    candidate_time = current_time - timedelta(minutes=REVIEW_MINUTES_DELTA + 5)
    candidate_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_pending_query",
        content="Candidate query",
        msg_time=candidate_time,
    )
    candidate_message.proactive_reply = ProactiveReply(
        rewrite_query="查询内容",
        answer="",
        is_first_query=True,
        is_first_answer=False,
        review_status="pending",
    )
    await candidate_message.save()

    # Only mock the external Runner execution to avoid actual LLM calls
    with patch("veaiops.agents.chatops.review.review_query_agent.Runner") as mock_runner_class:
        mock_runner = AsyncMock()
        mock_runner_class.return_value = mock_runner

        # Act - let real logic run except for actual LLM execution
        await run_review_agent(bot=test_bot, msg=test_message)

        # Assert - Runner should have been initialized (query review ran)
        assert mock_runner_class.called


@pytest.mark.asyncio
async def test_run_review_agent_with_pending_answer_message(test_bot, test_messages):
    """Test run_review_agent with a pending answer message."""
    # Arrange
    current_time = datetime(2025, 1, 15, 10, 30, 0)
    test_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_pending_answer",
        content="Current message",
        msg_time=current_time,
    )

    # Create a candidate message with answer that needs review
    candidate_time = current_time - timedelta(minutes=REVIEW_MINUTES_DELTA + 5)
    candidate_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_pending_answer",
        content="Candidate answer",
        msg_time=candidate_time,
    )
    candidate_message.proactive_reply = ProactiveReply(
        rewrite_query="查询内容",
        answer="这是一个答案",
        is_first_answer=True,
        is_first_query=False,
        review_status="pending",
    )
    await candidate_message.save()

    # Only mock the external Runner execution to avoid actual LLM calls
    with patch("veaiops.agents.chatops.review.review_answer_agent.Runner") as mock_runner_class:
        mock_runner = AsyncMock()
        mock_runner_class.return_value = mock_runner

        # Act - let real logic run except for actual LLM execution
        await run_review_agent(bot=test_bot, msg=test_message)

        # Assert - Runner should have been initialized (answer review ran)
        assert mock_runner_class.called


@pytest.mark.asyncio
async def test_run_review_agent_with_positive_feedback(test_bot, test_messages):
    """Test that run_review_agent processes messages with positive feedback."""
    # Arrange
    current_time = datetime(2025, 1, 15, 10, 30, 0)
    test_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_feedback",
        content="Current message",
        msg_time=current_time,
    )

    # Create an old message with pending answer review and positive feedback
    old_time = current_time - timedelta(minutes=REVIEW_MINUTES_DELTA + 5)
    old_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_feedback",
        content="Old answer",
        msg_time=old_time,
    )
    old_message.proactive_reply = ProactiveReply(
        rewrite_query="改写查询", answer="答案", is_first_answer=True, review_status="pending"
    )
    await old_message.save()

    # Create a notification and event for the feedback
    test_notification = AgentNotification(
        bot_id=test_bot.bot_id,
        channel=ChannelType.Lark,
        msg_id=old_message.msg_id,
        chat_id=old_message.chat_id,
        agent_type=AgentType.CHATOPS_PROACTIVE_REPLY,
        data=AgentReplyResp(response="test response"),
    )
    await test_notification.insert()

    test_event = Event(
        agent_type=AgentType.CHATOPS_PROACTIVE_REPLY,
        event_level=EventLevel.P2,
        datasource_type=None,
        raw_data=test_notification,
    )
    await test_event.insert()

    assert test_event.id is not None
    test_feedback = EventNoticeFeedback(
        event_main_id=test_event.id,
        notice_channel=ChannelType.Lark,
        out_message_id="test_out_msg_id",
        action=FeedbackActionType.Like,  # Positive feedback
    )
    await test_feedback.insert()

    # Mock only the Runner, let real logic handle feedback checking
    with patch("veaiops.agents.chatops.review.review_answer_agent.Runner") as mock_runner_class:
        mock_runner_class.return_value = AsyncMock()

        # Act
        await run_review_agent(bot=test_bot, msg=test_message)

        # Assert - should NOT call answer review because positive feedback means user was satisfied
        assert not mock_runner_class.called


@pytest.mark.asyncio
async def test_run_review_agent_with_like_feedback(test_bot, test_messages):
    """Test that messages with Like feedback are marked as 'keep'."""
    # Arrange
    current_time = datetime(2025, 1, 15, 10, 30, 0)
    test_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_like_feedback",
        content="Current message",
        msg_time=current_time,
    )

    # Create a candidate message
    candidate_time = current_time - timedelta(minutes=REVIEW_MINUTES_DELTA + 5)
    candidate_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_like_feedback",
        content="Candidate with like",
        msg_time=candidate_time,
    )
    candidate_message.proactive_reply = ProactiveReply(
        rewrite_query="查询内容",
        answer="答案内容",
        is_first_query=True,
        review_status="pending",
    )
    await candidate_message.save()

    # Create notification, event and Like feedback
    test_notification = AgentNotification(
        bot_id=test_bot.bot_id,
        channel=ChannelType.Lark,
        msg_id=candidate_message.msg_id,
        chat_id=candidate_message.chat_id,
        agent_type=AgentType.CHATOPS_PROACTIVE_REPLY,
        data=AgentReplyResp(response="test response"),
    )
    await test_notification.insert()

    test_event = Event(
        agent_type=AgentType.CHATOPS_PROACTIVE_REPLY,
        event_level=EventLevel.P2,
        datasource_type=None,
        raw_data=test_notification,
    )
    await test_event.insert()

    assert test_event.id is not None
    test_feedback = EventNoticeFeedback(
        event_main_id=test_event.id,
        notice_channel=ChannelType.Lark,
        out_message_id="test_out_msg_id",
        action=FeedbackActionType.Like,
    )
    await test_feedback.insert()

    # Mock only the Runner, let real logic handle feedback checking
    with patch("veaiops.agents.chatops.review.review_query_agent.Runner") as mock_runner_class:
        mock_runner_class.return_value = AsyncMock()

        # Act
        await run_review_agent(bot=test_bot, msg=test_message)

        # Assert - query review should NOT be called because of Like feedback
        assert not mock_runner_class.called

    # Reload and verify status
    await candidate_message.sync()
    assert candidate_message.proactive_reply.review_status == "keep"


@pytest.mark.asyncio
async def test_run_review_agent_with_multiple_candidates(test_bot, test_messages):
    """Test run_review_agent with multiple candidate messages (mix of queries and answers)."""
    # Arrange
    current_time = datetime(2025, 1, 15, 10, 30, 0)
    test_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_multiple",
        content="Current message",
        msg_time=current_time,
    )

    # Create multiple candidates
    candidate_time = current_time - timedelta(minutes=REVIEW_MINUTES_DELTA + 5)

    # Query candidate
    query_candidate = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_multiple",
        content="Query candidate",
        msg_time=candidate_time,
    )
    query_candidate.proactive_reply = ProactiveReply(
        rewrite_query="查询1", answer="", is_first_query=True, review_status="pending"
    )
    await query_candidate.save()

    # Answer candidate
    answer_candidate = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_multiple",
        content="Answer candidate",
        msg_time=candidate_time - timedelta(minutes=1),
    )
    answer_candidate.proactive_reply = ProactiveReply(
        rewrite_query="查询2", answer="答案2", is_first_answer=True, review_status="pending"
    )
    await answer_candidate.save()

    # Only mock the external Runner execution to avoid actual LLM calls
    with patch("veaiops.agents.chatops.review.review_query_agent.Runner") as mock_query_runner:
        with patch("veaiops.agents.chatops.review.review_answer_agent.Runner") as mock_answer_runner:
            mock_query_runner.return_value = AsyncMock()
            mock_answer_runner.return_value = AsyncMock()

            # Act - let real logic run except for actual LLM execution
            await run_review_agent(bot=test_bot, msg=test_message)

            # Assert - both Runners should be called
            assert mock_query_runner.called
            assert mock_answer_runner.called


@pytest.mark.asyncio
async def test_run_review_agent_with_negative_feedback(test_bot, test_messages):
    """Test that messages with negative feedback are still reviewed."""
    # Arrange
    current_time = datetime(2025, 1, 15, 10, 30, 0)
    test_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_negative_feedback",
        content="Current message",
        msg_time=current_time,
    )

    # Create a candidate message
    candidate_time = current_time - timedelta(minutes=REVIEW_MINUTES_DELTA + 5)
    candidate_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_negative_feedback",
        content="Candidate with negative feedback",
        msg_time=candidate_time,
    )
    candidate_message.proactive_reply = ProactiveReply(
        rewrite_query="查询内容",
        answer="答案内容",
        is_first_answer=True,
        review_status="pending",
    )
    await candidate_message.save()

    # Create notification, event with negative feedback (Dislike)
    test_notification = AgentNotification(
        bot_id=test_bot.bot_id,
        channel=ChannelType.Lark,
        msg_id=candidate_message.msg_id,
        chat_id=candidate_message.chat_id,
        agent_type=AgentType.CHATOPS_PROACTIVE_REPLY,
        data=AgentReplyResp(response="test response"),
    )
    await test_notification.insert()

    test_event = Event(
        agent_type=AgentType.CHATOPS_PROACTIVE_REPLY,
        event_level=EventLevel.P2,
        datasource_type=None,
        raw_data=test_notification,
    )
    await test_event.insert()

    assert test_event.id is not None
    test_feedback = EventNoticeFeedback(
        event_main_id=test_event.id,
        notice_channel=ChannelType.Lark,
        out_message_id="test_out_msg_id",
        action=FeedbackActionType.Dislike,
        feedback="Not helpful",
    )
    await test_feedback.insert()

    # Only mock the external Runner execution to avoid actual LLM calls
    with patch("veaiops.agents.chatops.review.review_answer_agent.Runner") as mock_runner_class:
        mock_runner_class.return_value = AsyncMock()

        # Act - let real logic run, it should find the negative feedback and still review
        await run_review_agent(bot=test_bot, msg=test_message)

        # Assert - Runner should be called (answer review ran despite negative feedback)
        assert mock_runner_class.called


@pytest.mark.asyncio
async def test_run_review_agent_filters_by_time(test_bot, test_messages):
    """Test that only messages older than REVIEW_MINUTES_DELTA are reviewed."""
    # Arrange
    current_time = datetime(2025, 1, 15, 10, 30, 0)
    test_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_time_filter",
        content="Current message",
        msg_time=current_time,
    )

    # Create a message that's too recent (should not be reviewed)
    recent_time = current_time - timedelta(minutes=REVIEW_MINUTES_DELTA - 5)
    recent_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_time_filter",
        content="Recent message",
        msg_time=recent_time,
    )
    recent_message.proactive_reply = ProactiveReply(
        rewrite_query="查询内容",
        answer="答案内容",
        is_first_answer=True,
        review_status="pending",
    )
    await recent_message.save()

    # Only mock Runner to verify it's NOT called (message too recent)
    with patch("veaiops.agents.chatops.review.review_answer_agent.Runner") as mock_runner_class:
        mock_runner_class.return_value = AsyncMock()

        # Act - let real logic run, should filter out recent message
        await run_review_agent(bot=test_bot, msg=test_message)

        # Assert - Runner should NOT be called (message is too recent)
        assert not mock_runner_class.called


@pytest.mark.asyncio
async def test_run_review_agent_filters_by_chat_id(test_bot, test_messages):
    """Test that only messages from the same chat are reviewed."""
    # Arrange
    current_time = datetime(2025, 1, 15, 10, 30, 0)
    test_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_filter_1",
        content="Current message",
        msg_time=current_time,
    )

    # Create a message in a different chat
    candidate_time = current_time - timedelta(minutes=REVIEW_MINUTES_DELTA + 5)
    other_chat_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_filter_2",  # Different chat
        content="Other chat message",
        msg_time=candidate_time,
    )
    other_chat_message.proactive_reply = ProactiveReply(
        rewrite_query="查询内容",
        answer="答案内容",
        is_first_answer=True,
        review_status="pending",
    )
    await other_chat_message.save()

    # Only mock Runner to verify it's NOT called (different chat)
    with patch("veaiops.agents.chatops.review.review_answer_agent.Runner") as mock_runner_class:
        mock_runner_class.return_value = AsyncMock()

        # Act - let real logic run, should filter out different chat message
        await run_review_agent(bot=test_bot, msg=test_message)

        # Assert - Runner should NOT be called (message from different chat)
        assert not mock_runner_class.called


@pytest.mark.asyncio
async def test_run_review_agent_handles_exceptions(test_bot, test_messages):
    """Test that run_review_agent handles exceptions from review agents gracefully."""
    # Arrange
    current_time = datetime(2025, 1, 15, 10, 30, 0)
    test_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_exception",
        content="Current message",
        msg_time=current_time,
    )

    # Create candidates that will trigger exceptions
    candidate_time = current_time - timedelta(minutes=REVIEW_MINUTES_DELTA + 5)

    query_candidate = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_exception",
        content="Query candidate",
        msg_time=candidate_time,
    )
    query_candidate.proactive_reply = ProactiveReply(
        rewrite_query="查询1", answer="", is_first_query=True, review_status="pending"
    )
    await query_candidate.save()

    answer_candidate = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_exception",
        content="Answer candidate",
        msg_time=candidate_time - timedelta(minutes=1),
    )
    answer_candidate.proactive_reply = ProactiveReply(
        rewrite_query="查询2", answer="答案2", is_first_answer=True, review_status="pending"
    )
    await answer_candidate.save()

    # Mock Runner to raise exceptions
    with patch("veaiops.agents.chatops.review.review_query_agent.Runner") as mock_query_runner:
        with patch("veaiops.agents.chatops.review.review_answer_agent.Runner") as mock_answer_runner:
            mock_query_runner.side_effect = Exception("Query review error")
            mock_answer_runner.side_effect = Exception("Answer review error")

            # Act - should not raise exception (exceptions are caught by asyncio.gather)
            await run_review_agent(bot=test_bot, msg=test_message)

            # The function completes without raising despite internal exceptions
