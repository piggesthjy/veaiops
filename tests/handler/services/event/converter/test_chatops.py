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

import pytest

from veaiops.handler.services.event.converter.chatops import (
    convert_interest_to_event,
    convert_proactive_to_event,
    convert_reactive_to_event,
)
from veaiops.schema.documents import AgentNotification, Bot, Event
from veaiops.schema.documents.chatops import InterestAgentResp
from veaiops.schema.models.chatops import AgentReplyResp
from veaiops.schema.types import AgentType, ChannelType, EventLevel, EventStatus, InterestActionType


@pytest.mark.asyncio
async def test_convert_interest_to_event_no_data(mocker):
    """Test convert_interest_to_event with no data in notification."""
    notification = AgentNotification(
        bot_id="test_bot",
        channel=ChannelType.Lark,
        msg_id="test_msg",
        chat_id="test_chat",
        agent_type=AgentType.CHATOPS_INTEREST,
        data=[],
    )
    result = await convert_interest_to_event(notification)
    assert result is None


@pytest.mark.asyncio
async def test_convert_interest_to_event_no_matched(mocker):
    """Test convert_interest_to_event with no matched interests."""
    mock_data = mocker.MagicMock(spec=InterestAgentResp)
    mock_data.is_satisfied = False
    notification = AgentNotification(
        bot_id="test_bot",
        channel=ChannelType.Lark,
        msg_id="test_msg",
        chat_id="test_chat",
        agent_type=AgentType.CHATOPS_INTEREST,
        data=[mock_data],
    )

    mock_bot = mocker.MagicMock()
    mock_bot.get_bot_attributes = mocker.AsyncMock(return_value=[])
    mocker.patch.object(Bot, "find_one", mocker.AsyncMock(return_value=mock_bot))

    result = await convert_interest_to_event(notification)
    assert result.status == EventStatus.CHATOPS_NOT_MATCHED


@pytest.mark.asyncio
async def test_convert_interest_to_event_filtered(mocker):
    """Test convert_interest_to_event with filtered interests."""
    mock_data = mocker.MagicMock(spec=InterestAgentResp)
    mock_data.is_satisfied = True
    mock_data.action_category = InterestActionType.Filter
    notification = AgentNotification(
        bot_id="test_bot",
        channel=ChannelType.Lark,
        msg_id="test_msg",
        chat_id="test_chat",
        agent_type=AgentType.CHATOPS_INTEREST,
        data=[mock_data],
    )

    mock_bot = mocker.MagicMock()
    mock_bot.get_bot_attributes = mocker.AsyncMock(return_value=[])
    mocker.patch.object(Bot, "find_one", mocker.AsyncMock(return_value=mock_bot))

    result = await convert_interest_to_event(notification)
    assert result.status == EventStatus.CHATOPS_RULE_FILTERED


@pytest.mark.asyncio
async def test_convert_interest_to_event_restrained(mocker):
    """Test convert_interest_to_event with restrained interests."""
    mock_data = mocker.MagicMock(spec=InterestAgentResp)
    mock_data.is_satisfied = True
    mock_data.action_category = InterestActionType.Detect
    mock_data.silence_delta = timedelta(minutes=10)
    mock_data.level = EventLevel.P1
    notification = AgentNotification(
        bot_id="test_bot",
        channel=ChannelType.Lark,
        chat_id="test_chat",
        msg_id="test_msg",
        agent_type=AgentType.CHATOPS_INTEREST,
        data=[mock_data],
    )

    mocker.patch.object(Event, "find_one", mocker.AsyncMock(return_value=mocker.MagicMock()))
    mock_bot = mocker.MagicMock()
    mock_bot.get_bot_attributes = mocker.AsyncMock(return_value=[])
    mocker.patch.object(Bot, "find_one", mocker.AsyncMock(return_value=mock_bot))

    result = await convert_interest_to_event(notification)
    assert result.status == EventStatus.CHATOPS_RULE_RESTRAINED


@pytest.mark.asyncio
async def test_convert_interest_to_event_success(mocker):
    """Test convert_interest_to_event with successful conversion."""
    mock_data = mocker.MagicMock(spec=InterestAgentResp)
    mock_data.is_satisfied = True
    mock_data.action_category = InterestActionType.Detect
    mock_data.silence_delta = timedelta(minutes=10)
    mock_data.level = EventLevel.P1
    notification = AgentNotification(
        bot_id="test_bot",
        channel=ChannelType.Lark,
        chat_id="test_chat",
        msg_id="test_msg",
        agent_type=AgentType.CHATOPS_INTEREST,
        data=[mock_data],
    )

    mocker.patch.object(Event, "find_one", mocker.AsyncMock(return_value=None))
    mock_bot = mocker.MagicMock()
    mocker.patch.object(Bot, "find_one", mocker.AsyncMock(return_value=mock_bot))
    mock_bot.get_bot_attributes = mocker.AsyncMock(side_effect=[["product1"], ["project1"], ["customer1"]])

    result = await convert_interest_to_event(notification)
    assert result.status == EventStatus.INITIAL
    assert result.agent_type == AgentType.CHATOPS_INTEREST
    assert result.event_level == EventLevel.P1
    assert result.product == ["product1"]
    assert result.project == ["project1"]
    assert result.customer == ["customer1"]


@pytest.mark.asyncio
async def test_convert_reactive_to_event(mocker):
    """Test convert_reactive_to_event."""
    notification = AgentNotification(
        bot_id="test_bot",
        channel=ChannelType.Lark,
        msg_id="test_msg",
        chat_id="test_chat",
        agent_type=AgentType.CHATOPS_REACTIVE_REPLY,
        data=mocker.MagicMock(spec=AgentReplyResp),
        level=EventLevel.P0,
    )
    result = await convert_reactive_to_event(notification)
    assert result.agent_type == AgentType.CHATOPS_REACTIVE_REPLY
    assert result.event_level == EventLevel.P0
    assert result.status == EventStatus.INITIAL


@pytest.mark.asyncio
async def test_convert_proactive_to_event(mocker):
    """Test convert_proactive_to_event."""
    notification = AgentNotification(
        bot_id="test_bot",
        channel=ChannelType.Lark,
        msg_id="test_msg",
        chat_id="test_chat",
        agent_type=AgentType.CHATOPS_PROACTIVE_REPLY,
        data=mocker.MagicMock(spec=AgentReplyResp),
        level=EventLevel.P2,
    )
    result = await convert_proactive_to_event(notification)
    assert result.agent_type == AgentType.CHATOPS_PROACTIVE_REPLY
    assert result.event_level == EventLevel.P2
    assert result.status == EventStatus.INITIAL
