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
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from google.genai.types import Content, Part
from veadk.memory.short_term_memory import ShortTermMemory

from tests.agents.chatops.utils import create_async_iterator
from veaiops.agents.chatops.reactive.run import run_reactive_reply_agent


@pytest.mark.asyncio
async def test_run_reactive_reply_not_mentioned(test_bot, test_messages):
    """Test that reactive agent skips processing when bot is not mentioned."""
    # Arrange
    test_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_not_mentioned",
        content="Just a normal message",
        msg_time=datetime(2025, 1, 15, 10, 0, 0),
        is_mentioned=False,
    )

    with patch("veaiops.agents.chatops.reactive.run.send_bot_notification") as mock_send:
        # Act
        await run_reactive_reply_agent(bot=test_bot, msg=test_message)

        # Assert - notification should not be sent when bot is not mentioned
        mock_send.assert_not_called()


@pytest.mark.asyncio
async def test_run_reactive_reply_only_mention_fallback_to_summary(test_bot, test_messages, dummy_ltm_backend):
    """Test that reactive agent falls back to summary when only bot is mentioned."""
    # Arrange - message that only mentions the bot without additional content
    from veaiops.schema.models.chatops.message import Mention

    test_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_only_mention",
        content=f"@{test_bot.name}",
        msg_time=datetime(2025, 1, 15, 10, 0, 0),
        is_mentioned=True,
    )
    # Add mentions to simulate bot being mentioned
    test_message.mentions = [Mention(name=test_bot.name, id=test_bot.bot_id)]
    test_message.msg_llm_compatible = [Part(text=f"@{test_bot.name}")]

    # Mock the runner to return a summary response
    mock_event = MagicMock()
    mock_event.is_final_response = MagicMock(return_value=True)
    mock_event.content = Content(parts=[Part(text="This is a summary of recent conversation.")])

    async def mock_init_ltm(bot):
        return dummy_ltm_backend

    async def mock_init_stm(app_name, user_id, session_id, state=None):
        return ShortTermMemory(backend="local")

    with patch("veaiops.agents.chatops.reactive.reactive_agent.init_ltm", side_effect=mock_init_ltm):
        with patch("veaiops.agents.chatops.reactive.reactive_agent.init_stm", side_effect=mock_init_stm):
            with patch("veaiops.agents.chatops.reactive.run.Runner") as mock_runner_class:
                with patch("veaiops.agents.chatops.reactive.run.send_bot_notification") as mock_send:
                    mock_runner = MagicMock()
                    mock_runner.run_async = MagicMock(return_value=create_async_iterator([mock_event]))
                    mock_runner.save_session_to_long_term_memory = AsyncMock()
                    mock_runner_class.return_value = mock_runner

                    # Act
                    await run_reactive_reply_agent(bot=test_bot, msg=test_message)

                    # Assert - should have called runner with summary message
                    mock_runner.run_async.assert_called_once()
                    call_args = mock_runner.run_async.call_args
                    assert "Please summarize the recent conversation" in call_args.kwargs["new_message"].parts[0].text

                    # Should send notification
                    mock_send.assert_called_once()


@pytest.mark.asyncio
async def test_run_reactive_reply_with_question(test_bot, test_messages, dummy_ltm_backend):
    """Test reactive agent with a question message."""
    # Arrange
    test_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_question",
        content=f"@{test_bot.name} What is the current CPU usage?",
        msg_time=datetime(2025, 1, 15, 10, 0, 0),
        is_mentioned=True,
    )

    # Mock the runner to return an answer
    mock_event = MagicMock()
    mock_event.is_final_response = MagicMock(return_value=True)
    mock_event.content = Content(parts=[Part(text="The current CPU usage is 45%.")])

    async def mock_init_ltm(bot):
        return dummy_ltm_backend

    async def mock_init_stm(app_name, user_id, session_id, state=None):
        return ShortTermMemory(backend="local")

    with patch("veaiops.agents.chatops.reactive.reactive_agent.init_ltm", side_effect=mock_init_ltm):
        with patch("veaiops.agents.chatops.reactive.reactive_agent.init_stm", side_effect=mock_init_stm):
            with patch("veaiops.agents.chatops.reactive.run.construct_msg_with_kbs") as mock_construct:
                # Mock construct_msg_with_kbs to avoid VikingDB
                mock_construct.return_value = Content(
                    parts=[Part(text=f"@{test_bot.name} What is the current CPU usage?")], role="user"
                )
                with patch("veaiops.agents.chatops.reactive.run.Runner") as mock_runner_class:
                    with patch("veaiops.agents.chatops.reactive.run.send_bot_notification") as mock_send:
                        mock_runner = MagicMock()
                        mock_runner.run_async = MagicMock(return_value=create_async_iterator([mock_event]))
                        mock_runner.save_session_to_long_term_memory = AsyncMock()
                        mock_runner_class.return_value = mock_runner

                        # Act
                        await run_reactive_reply_agent(bot=test_bot, msg=test_message)

                        # Assert
                        mock_runner.run_async.assert_called_once()
                        mock_send.assert_called_once()

                        # Verify notification content
                        notification = mock_send.call_args[1]["data"]
                        assert notification.bot_id == test_bot.bot_id
                        assert notification.chat_id == test_message.chat_id
                        assert notification.data.response == "The current CPU usage is 45%."


@pytest.mark.asyncio
async def test_run_reactive_reply_no_final_response(test_bot, test_messages, dummy_ltm_backend):
    """Test reactive agent when no final response is received."""
    # Arrange
    test_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_no_response",
        content=f"@{test_bot.name} Can you help?",
        msg_time=datetime(2025, 1, 15, 10, 0, 0),
        is_mentioned=True,
    )

    # Mock the runner to return no final response
    mock_event = MagicMock()
    mock_event.is_final_response = MagicMock(return_value=False)

    async def mock_init_ltm(bot):
        return dummy_ltm_backend

    async def mock_init_stm(app_name, user_id, session_id, state=None):
        return ShortTermMemory(backend="local")

    with patch("veaiops.agents.chatops.reactive.reactive_agent.init_ltm", side_effect=mock_init_ltm):
        with patch("veaiops.agents.chatops.reactive.reactive_agent.init_stm", side_effect=mock_init_stm):
            with patch("veaiops.agents.chatops.reactive.run.construct_msg_with_kbs") as mock_construct:
                mock_construct.return_value = Content(parts=[Part(text=f"@{test_bot.name} Can you help?")], role="user")
                with patch("veaiops.agents.chatops.reactive.run.Runner") as mock_runner_class:
                    with patch("veaiops.agents.chatops.reactive.run.send_bot_notification") as mock_send:
                        mock_runner = MagicMock()
                        mock_runner.run_async = MagicMock(return_value=create_async_iterator([mock_event]))
                        mock_runner.save_session_to_long_term_memory = AsyncMock()
                        mock_runner_class.return_value = mock_runner

                        # Act
                        await run_reactive_reply_agent(bot=test_bot, msg=test_message)

                        # Assert - should use default reply
                        notification = mock_send.call_args[1]["data"]
                        assert notification.data.response == "抱歉，暂时无法回答该问题"


@pytest.mark.asyncio
async def test_run_reactive_reply_empty_response(test_bot, test_messages, dummy_ltm_backend):
    """Test reactive agent when response is empty string (treated as no valid response)."""
    # Arrange
    test_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_empty_response",
        content=f"@{test_bot.name} Empty response test",
        msg_time=datetime(2025, 1, 15, 10, 0, 0),
        is_mentioned=True,
    )

    # Mock the runner to return empty content
    mock_event = MagicMock()
    mock_event.is_final_response = MagicMock(return_value=True)
    mock_event.content = Content(parts=[Part(text="")])

    async def mock_init_ltm(bot):
        return dummy_ltm_backend

    async def mock_init_stm(app_name, user_id, session_id, state=None):
        return ShortTermMemory(backend="local")

    with patch("veaiops.agents.chatops.reactive.reactive_agent.init_ltm", side_effect=mock_init_ltm):
        with patch("veaiops.agents.chatops.reactive.reactive_agent.init_stm", side_effect=mock_init_stm):
            with patch("veaiops.agents.chatops.reactive.run.construct_msg_with_kbs") as mock_construct:
                mock_construct.return_value = Content(
                    parts=[Part(text=f"@{test_bot.name} Empty response test")], role="user"
                )
                with patch("veaiops.agents.chatops.reactive.run.Runner") as mock_runner_class:
                    with patch("veaiops.agents.chatops.reactive.run.send_bot_notification") as mock_send:
                        mock_runner = MagicMock()
                        mock_runner.run_async = MagicMock(return_value=create_async_iterator([mock_event]))
                        mock_runner.save_session_to_long_term_memory = AsyncMock()
                        mock_runner_class.return_value = mock_runner

                        # Act
                        await run_reactive_reply_agent(bot=test_bot, msg=test_message)

                        # Assert - empty string after strip is falsy, so default reply is used
                        notification = mock_send.call_args[1]["data"]
                        assert notification.data.response == "抱歉，暂时无法回答该问题"


@pytest.mark.asyncio
async def test_run_reactive_reply_multiple_events(test_bot, test_messages, dummy_ltm_backend):
    """Test reactive agent with multiple events, only final response is used."""
    # Arrange
    test_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_multiple_events",
        content=f"@{test_bot.name} Multiple events test",
        msg_time=datetime(2025, 1, 15, 10, 0, 0),
        is_mentioned=True,
    )

    # Mock multiple events
    mock_event1 = MagicMock()
    mock_event1.is_final_response = MagicMock(return_value=False)

    mock_event2 = MagicMock()
    mock_event2.is_final_response = MagicMock(return_value=False)

    mock_final_event = MagicMock()
    mock_final_event.is_final_response = MagicMock(return_value=True)
    mock_final_event.content = Content(parts=[Part(text="Final answer after processing.")])

    async def mock_init_ltm(bot):
        return dummy_ltm_backend

    async def mock_init_stm(app_name, user_id, session_id, state=None):
        return ShortTermMemory(backend="local")

    with patch("veaiops.agents.chatops.reactive.reactive_agent.init_ltm", side_effect=mock_init_ltm):
        with patch("veaiops.agents.chatops.reactive.reactive_agent.init_stm", side_effect=mock_init_stm):
            with patch("veaiops.agents.chatops.reactive.run.construct_msg_with_kbs") as mock_construct:
                mock_construct.return_value = Content(
                    parts=[Part(text=f"@{test_bot.name} Multiple events test")], role="user"
                )
                with patch("veaiops.agents.chatops.reactive.run.Runner") as mock_runner_class:
                    with patch("veaiops.agents.chatops.reactive.run.send_bot_notification") as mock_send:
                        mock_runner = MagicMock()
                        mock_runner.run_async = MagicMock(
                            return_value=create_async_iterator([mock_event1, mock_event2, mock_final_event])
                        )
                        mock_runner.save_session_to_long_term_memory = AsyncMock()
                        mock_runner_class.return_value = mock_runner

                        # Act
                        await run_reactive_reply_agent(bot=test_bot, msg=test_message)

                        # Assert - should use final response
                        notification = mock_send.call_args[1]["data"]
                        assert notification.data.response == "Final answer after processing."


@pytest.mark.asyncio
async def test_run_reactive_reply_with_whitespace_response(test_bot, test_messages, dummy_ltm_backend):
    """Test reactive agent strips whitespace from response."""
    # Arrange
    test_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_whitespace",
        content=f"@{test_bot.name} Whitespace test",
        msg_time=datetime(2025, 1, 15, 10, 0, 0),
        is_mentioned=True,
    )

    # Mock the runner to return response with whitespace
    mock_event = MagicMock()
    mock_event.is_final_response = MagicMock(return_value=True)
    mock_event.content = Content(parts=[Part(text="  Response with whitespace  \n")])

    async def mock_init_ltm(bot):
        return dummy_ltm_backend

    async def mock_init_stm(app_name, user_id, session_id, state=None):
        return ShortTermMemory(backend="local")

    with patch("veaiops.agents.chatops.reactive.reactive_agent.init_ltm", side_effect=mock_init_ltm):
        with patch("veaiops.agents.chatops.reactive.reactive_agent.init_stm", side_effect=mock_init_stm):
            with patch("veaiops.agents.chatops.reactive.run.construct_msg_with_kbs") as mock_construct:
                mock_construct.return_value = Content(
                    parts=[Part(text=f"@{test_bot.name} Whitespace test")], role="user"
                )
                with patch("veaiops.agents.chatops.reactive.run.Runner") as mock_runner_class:
                    with patch("veaiops.agents.chatops.reactive.run.send_bot_notification") as mock_send:
                        mock_runner = MagicMock()
                        mock_runner.run_async = MagicMock(return_value=create_async_iterator([mock_event]))
                        mock_runner.save_session_to_long_term_memory = AsyncMock()
                        mock_runner_class.return_value = mock_runner

                        # Act
                        await run_reactive_reply_agent(bot=test_bot, msg=test_message)

                        # Assert - whitespace should be stripped
                        notification = mock_send.call_args[1]["data"]
                        assert notification.data.response == "Response with whitespace"


@pytest.mark.asyncio
async def test_run_reactive_reply_saves_to_long_term_memory(test_bot, test_messages, dummy_ltm_backend):
    """Test that reactive agent saves session to long term memory."""
    # Arrange
    test_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_ltm",
        content=f"@{test_bot.name} LTM test",
        msg_time=datetime(2025, 1, 15, 10, 0, 0),
        is_mentioned=True,
    )

    # Mock the runner
    mock_event = MagicMock()
    mock_event.is_final_response = MagicMock(return_value=True)
    mock_event.content = Content(parts=[Part(text="Test response")])

    async def mock_init_ltm(bot):
        return dummy_ltm_backend

    async def mock_init_stm(app_name, user_id, session_id, state=None):
        return ShortTermMemory(backend="local")

    with patch("veaiops.agents.chatops.reactive.reactive_agent.init_ltm", side_effect=mock_init_ltm):
        with patch("veaiops.agents.chatops.reactive.reactive_agent.init_stm", side_effect=mock_init_stm):
            with patch("veaiops.agents.chatops.reactive.run.construct_msg_with_kbs") as mock_construct:
                mock_construct.return_value = Content(parts=[Part(text=f"@{test_bot.name} LTM test")], role="user")
                with patch("veaiops.agents.chatops.reactive.run.Runner") as mock_runner_class:
                    with patch("veaiops.agents.chatops.reactive.run.send_bot_notification"):
                        mock_runner = MagicMock()
                        mock_runner.run_async = MagicMock(return_value=create_async_iterator([mock_event]))
                        mock_runner.save_session_to_long_term_memory = AsyncMock()
                        mock_runner_class.return_value = mock_runner

                        # Act
                        await run_reactive_reply_agent(bot=test_bot, msg=test_message)

                        # Assert - should save to LTM
                        mock_runner.save_session_to_long_term_memory.assert_called_once_with(
                            session_id=test_message.chat_id
                        )


@pytest.mark.asyncio
async def test_run_reactive_reply_content_parts_none(test_bot, test_messages, dummy_ltm_backend):
    """Test reactive agent when content.parts is None."""
    # Arrange
    test_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_parts_none",
        content=f"@{test_bot.name} Parts none test",
        msg_time=datetime(2025, 1, 15, 10, 0, 0),
        is_mentioned=True,
    )

    # Mock the runner to return content with None parts
    mock_event = MagicMock()
    mock_event.is_final_response = MagicMock(return_value=True)
    mock_event.content = Content(parts=None)

    async def mock_init_ltm(bot):
        return dummy_ltm_backend

    async def mock_init_stm(app_name, user_id, session_id, state=None):
        return ShortTermMemory(backend="local")

    with patch("veaiops.agents.chatops.reactive.reactive_agent.init_ltm", side_effect=mock_init_ltm):
        with patch("veaiops.agents.chatops.reactive.reactive_agent.init_stm", side_effect=mock_init_stm):
            with patch("veaiops.agents.chatops.reactive.run.construct_msg_with_kbs") as mock_construct:
                mock_construct.return_value = Content(
                    parts=[Part(text=f"@{test_bot.name} Parts none test")], role="user"
                )
                with patch("veaiops.agents.chatops.reactive.run.Runner") as mock_runner_class:
                    with patch("veaiops.agents.chatops.reactive.run.send_bot_notification") as mock_send:
                        mock_runner = MagicMock()
                        mock_runner.run_async = MagicMock(return_value=create_async_iterator([mock_event]))
                        mock_runner.save_session_to_long_term_memory = AsyncMock()
                        mock_runner_class.return_value = mock_runner

                        # Act
                        await run_reactive_reply_agent(bot=test_bot, msg=test_message)

                        # Assert - should use default reply
                        notification = mock_send.call_args[1]["data"]
                        assert notification.data.response == "抱歉，暂时无法回答该问题"


@pytest.mark.asyncio
async def test_run_reactive_reply_content_none(test_bot, test_messages, dummy_ltm_backend):
    """Test reactive agent when content is None."""
    # Arrange
    test_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_content_none",
        content=f"@{test_bot.name} Content none test",
        msg_time=datetime(2025, 1, 15, 10, 0, 0),
        is_mentioned=True,
    )

    # Mock the runner to return None content
    mock_event = MagicMock()
    mock_event.is_final_response = MagicMock(return_value=True)
    mock_event.content = None

    async def mock_init_ltm(bot):
        return dummy_ltm_backend

    async def mock_init_stm(app_name, user_id, session_id, state=None):
        return ShortTermMemory(backend="local")

    with patch("veaiops.agents.chatops.reactive.reactive_agent.init_ltm", side_effect=mock_init_ltm):
        with patch("veaiops.agents.chatops.reactive.reactive_agent.init_stm", side_effect=mock_init_stm):
            with patch("veaiops.agents.chatops.reactive.run.construct_msg_with_kbs") as mock_construct:
                mock_construct.return_value = Content(
                    parts=[Part(text=f"@{test_bot.name} Content none test")], role="user"
                )
                with patch("veaiops.agents.chatops.reactive.run.Runner") as mock_runner_class:
                    with patch("veaiops.agents.chatops.reactive.run.send_bot_notification") as mock_send:
                        mock_runner = MagicMock()
                        mock_runner.run_async = MagicMock(return_value=create_async_iterator([mock_event]))
                        mock_runner.save_session_to_long_term_memory = AsyncMock()
                        mock_runner_class.return_value = mock_runner

                        # Act
                        await run_reactive_reply_agent(bot=test_bot, msg=test_message)

                        # Assert - should use default reply
                        notification = mock_send.call_args[1]["data"]
                        assert notification.data.response == "抱歉，暂时无法回答该问题"
