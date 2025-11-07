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

"""Common test utilities shared across all test modules."""

import uuid
from datetime import datetime
from typing import Optional
from unittest.mock import MagicMock

from google.genai.types import Part

from veaiops.schema.documents.chatops.message import Message
from veaiops.schema.types import ChannelType, ChatType, MsgSenderType


async def create_message(
    chat_id: str,
    content: str,
    msg_time: datetime,
    bot_id: str = "test_bot",
    sender_id: str = "user1",
    channel: ChannelType = ChannelType.Lark,
    is_mentioned: bool = False,
    proactive_reply: Optional[dict] = None,
) -> Message:
    """Create a test message and insert into database.

    Args:
        chat_id: Chat/session ID
        content: Message content
        msg_time: Message timestamp
        bot_id: Bot ID (default: "test_bot")
        sender_id: Sender user ID (default: "user1")
        channel: Channel type (default: ChannelType.Lark)
        is_mentioned: Whether bot is mentioned in message (default: False)
        proactive_reply: Optional ProactiveReply data as dict

    Returns:
        Message: Created message document inserted into database
    """
    message = Message(
        channel=channel,
        bot_id=bot_id,
        chat_id=chat_id,
        chat_type=ChatType.Group,
        msg=content,
        msg_id=str(uuid.uuid4()),
        msg_time=msg_time,
        msg_sender_id=sender_id,
        msg_sender_type=MsgSenderType.USER,
        msg_llm_compatible=[Part(text=content)],
        is_mentioned=is_mentioned,
    )
    await message.insert()

    # Add ProactiveReply if provided
    if proactive_reply:
        from veaiops.schema.models.chatops import ProactiveReply

        message.proactive_reply = ProactiveReply(**proactive_reply)
        await message.save()

    return message


def get_test_base_time() -> datetime:
    """获取标准测试基准时间.

    Returns:
        datetime: 标准测试时间 (2025-01-15 10:00:00)
    """
    return datetime(2025, 1, 15, 10, 0, 0)


def create_mock_viking_kb_service(point_id: str = "test_point_123"):
    """创建 mock Viking KB service 和 collection.

    Args:
        point_id: Point ID for mocked add_point result

    Returns:
        tuple: (mock_viking_instance, mock_collection)
    """
    from volcengine.viking_knowledgebase import VikingKnowledgeBaseService

    from veaiops.utils.kb import EnhancedCollection

    mock_collection = MagicMock(spec=EnhancedCollection)
    mock_result = MagicMock()
    mock_result.point_id = point_id
    mock_collection.add_point = MagicMock(return_value=mock_result)
    mock_collection.get_doc = MagicMock(return_value=MagicMock())

    mock_viking_instance = MagicMock(spec=VikingKnowledgeBaseService)
    mock_viking_instance.get_collection.return_value = mock_collection

    return mock_viking_instance, mock_collection


def create_mock_timeseries_data(
    name: str = "test_metric",
    timestamps: Optional[list[int]] = None,
    values: Optional[list[float]] = None,
    labels: Optional[dict[str, str]] = None,
):
    """Create mock time series data for testing.

    Args:
        name: Metric name
        timestamps: List of timestamps
        values: List of values
        labels: Labels dictionary

    Returns:
        InputTimeSeries dict
    """
    from veaiops.metrics.base import generate_unique_key
    from veaiops.metrics.timeseries import InputTimeSeries

    if timestamps is None:
        timestamps = [1672531260, 1672531320]
    if values is None:
        values = [10.0, 11.0]
    if labels is None:
        labels = {"host": "server1"}

    unique_key = generate_unique_key(name, labels)

    return InputTimeSeries(
        name=name,
        timestamps=timestamps,
        values=values,
        labels=labels,
        unique_key=unique_key,
    )


def create_async_iterator(events):
    """Helper to create an async iterator from a list of events."""

    async def async_gen():
        for event in events:
            yield event

    return async_gen()


def create_mock_runner_with_response(response_text: str, agent_name: Optional[str] = None):
    """创建带有响应的 mock runner.

    Args:
        response_text: JSON 格式的响应文本
        agent_name: Agent 名称 (可选)

    Returns:
        tuple: (mock_runner, mock_event)
    """
    mock_runner = MagicMock()
    mock_event = MagicMock()
    mock_event.is_final_response.return_value = True
    mock_event.content.parts = [MagicMock(text=response_text)]
    if agent_name:
        mock_event.author = agent_name
    mock_runner.run_async.return_value = create_async_iterator([mock_event])
    return mock_runner, mock_event
