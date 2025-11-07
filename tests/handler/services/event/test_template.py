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


import pytest

from veaiops.handler.services.event.template import build_variables, get_card_templates, message_card_build
from veaiops.schema.base import LarkUrl, TemplateVariable
from veaiops.schema.base.intelligent_threshold import (
    AliyunAlarmNotification,
    VolcengineAlarmNotification,
    ZabbixAlarmNotification,
)
from veaiops.schema.documents import AgentNotification, AgentTemplate, Chat, Event
from veaiops.schema.models.chatops import AgentReplyResp
from veaiops.schema.types import AgentType, ChannelType, EventStatus


@pytest.mark.asyncio
async def test_get_card_templates_success(mocker):
    """Test get_card_templates function with successful retrieval."""
    # Mock AgentTemplate.find
    mock_template1 = mocker.MagicMock()
    mock_template1.channel = ChannelType.Lark
    mock_template1.template_id = "lark-template-id"

    mock_template2 = mocker.MagicMock()
    mock_template2.channel = ChannelType.DingTalk
    mock_template2.template_id = "dingtalk-template-id"

    mock_find = mocker.MagicMock()
    mock_find.to_list = mocker.AsyncMock(return_value=[mock_template1, mock_template2])
    mocker.patch.object(AgentTemplate, "find", return_value=mock_find)

    # Call the function
    result = await get_card_templates(AgentType.CHATOPS_INTEREST)

    # Verify the result
    assert len(result) == 2
    assert result[ChannelType.Lark] == "lark-template-id"
    assert result[ChannelType.DingTalk] == "dingtalk-template-id"

    # Verify AgentTemplate.find was called with the correct agent_type
    AgentTemplate.find.assert_called_once_with(AgentTemplate.agent_type == AgentType.CHATOPS_INTEREST)


@pytest.mark.asyncio
async def test_get_card_templates_empty_result(mocker):
    """Test get_card_templates function with no templates found."""
    # Mock AgentTemplate.find to return empty list
    mock_find = mocker.MagicMock()
    mock_find.to_list = mocker.AsyncMock(return_value=[])
    mocker.patch.object(AgentTemplate, "find", return_value=mock_find)

    # Call the function
    result = await get_card_templates(AgentType.CHATOPS_INTEREST)

    # Verify the result is empty
    assert result == {}


@pytest.mark.asyncio
async def test_get_card_templates_exception(mocker):
    """Test get_card_templates function handles exceptions properly."""
    # Mock AgentTemplate.find to raise an exception
    mocker.patch.object(AgentTemplate, "find", side_effect=Exception("Mock exception"))

    # Call the function
    result = await get_card_templates(AgentType.CHATOPS_INTEREST)

    # Verify the result is empty despite the exception
    assert result == {}


@pytest.mark.asyncio
async def test_message_card_build(mocker):
    """Test message_card_build function."""
    # Mock the event object
    mock_event = mocker.MagicMock()
    mock_event.id = "test-event-id"
    mock_event.agent_type = AgentType.CHATOPS_INTEREST
    mock_event.set = mocker.AsyncMock()

    # Mock get_card_templates
    mock_templates = {ChannelType.Lark: "lark-template-id", ChannelType.DingTalk: "dingtalk-template-id"}
    mocker.patch(
        "veaiops.handler.services.event.template.get_card_templates", mocker.AsyncMock(return_value=mock_templates)
    )

    # Mock build_variables
    mock_variables = TemplateVariable(
        background_color="red",
        class_title="Test Title",
        event_id="test-event-id",
        chat_id="test-chat-id",
        button_name="test-button",
        button_action="redirect",
        analysis="test-analysis",
    )
    mocker.patch(
        "veaiops.handler.services.event.template.build_variables", mocker.AsyncMock(return_value=mock_variables)
    )

    # Call the function
    await message_card_build(mock_event)

    # Verify event status and channel_msg were updated
    mock_event.set.assert_called_once()
    args, _ = mock_event.set.call_args
    assert args[0][Event.status] == EventStatus.CARD_BUILT
    # Check that channel_msg contains both predefined Webhook and template channels
    channel_msg = args[0][Event.channel_msg]
    assert ChannelType.Webhook in channel_msg
    assert ChannelType.Lark in channel_msg
    assert ChannelType.DingTalk in channel_msg


@pytest.mark.asyncio
async def test_build_variables_chatops_interest(mocker):
    """Test build_variables function for CHATOPS_INTEREST agent type."""
    # Mock Chat.find_one
    mock_chat = mocker.MagicMock()
    mock_chat.chat_link = "https://example.com/chat"
    mocker.patch.object(Chat, "find_one", mocker.AsyncMock(return_value=mock_chat))

    # Create mock data items
    mock_data_item1 = mocker.MagicMock()
    mock_data_item1.is_satisfied = True
    mock_data_item1.name = "Interest 1"
    mock_data_item1.thinking = "Thinking 1"

    mock_data_item2 = mocker.MagicMock()
    mock_data_item2.is_satisfied = True
    mock_data_item2.name = "Interest 2"
    mock_data_item2.thinking = "Thinking 2"

    # Create mock raw_data
    mock_raw_data = mocker.MagicMock(spec=AgentNotification)
    mock_raw_data.data = [mock_data_item1, mock_data_item2]
    mock_raw_data.chat_id = "test-chat-id"

    # Create mock event
    mock_event = mocker.MagicMock()
    mock_event.id = "test-event-id"
    mock_event.agent_type = AgentType.CHATOPS_INTEREST
    mock_event.raw_data = mock_raw_data

    # Call the function
    result = await build_variables(mock_event)

    # Verify the result
    assert isinstance(result, TemplateVariable)
    assert result.background_color == "red"
    assert result.class_title == "Interest 1|Interest 2"
    assert result.event_id == "test-event-id"
    assert result.chat_id == "test-chat-id"
    assert result.button_name == "群聊跳转"
    assert result.button_action == "redirect"
    assert result.analysis == "Thinking 1\nThinking 2"
    assert isinstance(result.button_link, LarkUrl)
    assert result.button_link.url == "https://example.com/chat"


@pytest.mark.asyncio
async def test_build_variables_chatops_reactive_reply(mocker):
    """Test build_variables function for CHATOPS_REACTIVE_REPLY agent type."""
    # Create mock citations
    mock_citation1 = mocker.MagicMock()
    mock_citation1.title = "Citation 1"
    mock_citation1.source = "https://example.com/citation1"

    mock_citation2 = mocker.MagicMock()
    mock_citation2.title = "Citation 2"
    mock_citation2.source = "https://example.com/citation2"

    # Create mock data as AgentReplyResp
    mock_data = mocker.MagicMock(spec=AgentReplyResp)
    mock_data.response = "Test response"
    mock_data.citations = [mock_citation1, mock_citation2]

    # Create mock raw_data
    mock_raw_data = mocker.MagicMock(spec=AgentNotification)
    mock_raw_data.data = mock_data
    mock_raw_data.chat_id = "test-chat-id"

    # Create mock event
    mock_event = mocker.MagicMock()
    mock_event.id = "test-event-id"
    mock_event.agent_type = AgentType.CHATOPS_REACTIVE_REPLY
    mock_event.raw_data = mock_raw_data

    # Call the function
    result = await build_variables(mock_event)

    # Verify the result
    assert isinstance(result, TemplateVariable)
    assert result.chat_id == "test-chat-id"
    assert result.event_id == "test-event-id"
    assert result.button_name == "采纳"
    assert result.button_action == "public"
    assert result.button_disable is True
    assert "Test response" in result.analysis
    assert "[Citation 1](https://example.com/citation1)" in result.analysis
    assert "[Citation 2](https://example.com/citation2)" in result.analysis


@pytest.mark.asyncio
async def test_build_variables_chatops_proactive_reply(mocker):
    """Test build_variables function for CHATOPS_PROACTIVE_REPLY agent type."""
    # Create mock data as AgentReplyResp without citations
    mock_data = mocker.MagicMock(spec=AgentReplyResp)
    mock_data.response = "Test proactive response"
    mock_data.citations = None

    # Create mock raw_data
    mock_raw_data = mocker.MagicMock(spec=AgentNotification)
    mock_raw_data.data = mock_data
    mock_raw_data.chat_id = "test-chat-id"

    # Create mock event
    mock_event = mocker.MagicMock()
    mock_event.id = "test-event-id"
    mock_event.agent_type = AgentType.CHATOPS_PROACTIVE_REPLY
    mock_event.raw_data = mock_raw_data

    # Call the function
    result = await build_variables(mock_event)

    # Verify the result
    assert isinstance(result, TemplateVariable)
    assert result.chat_id == "test-chat-id"
    assert result.event_id == "test-event-id"
    assert result.button_name == "采纳（转为所有人可见）"
    assert result.button_action == "public"
    assert result.analysis == "Test proactive response"


@pytest.mark.asyncio
async def test_build_variables_chatops_proactive_reply_with_citations(mocker):
    """Test build_variables function for CHATOPS_PROACTIVE_REPLY agent type with citations."""
    # Create mock citations
    mock_citation1 = mocker.MagicMock()
    mock_citation1.title = "Citation 1"
    mock_citation1.source = "https://example.com/citation1"

    # Create mock data as AgentReplyResp
    mock_data = mocker.MagicMock(spec=AgentReplyResp)
    mock_data.response = "Test proactive response"
    mock_data.citations = [mock_citation1]

    # Create mock raw_data
    mock_raw_data = mocker.MagicMock(spec=AgentNotification)
    mock_raw_data.data = mock_data
    mock_raw_data.chat_id = "test-chat-id"

    # Create mock event
    mock_event = mocker.MagicMock()
    mock_event.id = "test-event-id"
    mock_event.agent_type = AgentType.CHATOPS_PROACTIVE_REPLY
    mock_event.raw_data = mock_raw_data

    # Call the function
    result = await build_variables(mock_event)

    # Verify the result
    assert "Test proactive response" in result.analysis
    assert "[Citation 1](https://example.com/citation1)" in result.analysis


@pytest.mark.asyncio
async def test_build_variables_intelligent_threshold_volcengine(mocker):
    """Test build_variables function for INTELLIGENT_THRESHOLD agent type with VolcengineAlarmNotification."""
    # Create mock raw_data as VolcengineAlarmNotification
    mock_raw_data = mocker.MagicMock(spec=VolcengineAlarmNotification)
    mock_raw_data.rule_condition = "CPU > 90%"
    mock_raw_data.rule_name = "High CPU Usage"

    # Create mock event
    mock_event = mocker.MagicMock()
    mock_event.id = "test-event-id"
    mock_event.agent_type = AgentType.INTELLIGENT_THRESHOLD
    mock_event.raw_data = mock_raw_data

    # Call the function
    result = await build_variables(mock_event)

    # Verify the result
    assert isinstance(result, TemplateVariable)
    assert result.class_title == "火山引擎智能阈值告警"
    assert result.chat_id == ""
    assert result.event_id == "test-event-id"
    assert result.button_name == "告警屏蔽（告警聚合功能上线后生效）"
    assert result.button_disable is True
    assert result.button_action == "handle"
    assert result.analysis == "CPU > 90%\nHigh CPU Usage"


@pytest.mark.asyncio
async def test_build_variables_intelligent_threshold_aliyun(mocker):
    """Test build_variables function for INTELLIGENT_THRESHOLD agent type with AliyunAlarmNotification."""
    # Create mock raw_data as AliyunAlarmNotification
    mock_raw_data = mocker.MagicMock(spec=AliyunAlarmNotification)
    mock_raw_data.regionName = "cn-hangzhou"
    mock_raw_data.metricName = "CPUUtilization"
    mock_raw_data.dimensions = "instanceId=xxx"
    mock_raw_data.lastTime = "5m"
    mock_raw_data.curValue = "95%"

    # Create mock event
    mock_event = mocker.MagicMock()
    mock_event.id = "test-event-id"
    mock_event.agent_type = AgentType.INTELLIGENT_THRESHOLD
    mock_event.raw_data = mock_raw_data

    # Call the function
    result = await build_variables(mock_event)

    # Verify the result
    assert isinstance(result, TemplateVariable)
    assert result.class_title == "阿里云智能阈值告警"
    assert result.chat_id == ""
    assert result.event_id == "test-event-id"
    assert result.button_name == "告警屏蔽（告警聚合功能上线后生效）"
    assert result.button_disable is True
    assert result.button_action == "handle"
    assert "地域：cn-hangzhou" in result.analysis
    assert "指标名称：CPUUtilization" in result.analysis


@pytest.mark.asyncio
async def test_build_variables_intelligent_threshold_zabbix(mocker):
    """Test build_variables function for INTELLIGENT_THRESHOLD agent type with ZabbixAlarmNotification."""
    # Create mock raw_data as ZabbixAlarmNotification
    mock_raw_data = mocker.MagicMock(spec=ZabbixAlarmNotification)
    mock_raw_data.message = "Zabbix alert: Disk space is low"

    # Create mock event
    mock_event = mocker.MagicMock()
    mock_event.id = "test-event-id"
    mock_event.agent_type = AgentType.INTELLIGENT_THRESHOLD
    mock_event.raw_data = mock_raw_data

    # Call the function
    result = await build_variables(mock_event)

    # Verify the result
    assert isinstance(result, TemplateVariable)
    assert result.class_title == "Zabbix智能阈值告警"
    assert result.chat_id == ""
    assert result.event_id == "test-event-id"
    assert result.button_name == "告警屏蔽（告警聚合功能上线后生效）"
    assert result.button_disable is True
    assert result.button_action == "handle"
    assert result.analysis == "Zabbix alert: Disk space is low"


@pytest.mark.asyncio
async def test_build_variables_unknown_type(mocker):
    """Test build_variables function with unknown agent type or raw_data format."""
    # Create mock event with unknown agent type
    mock_event = mocker.MagicMock()
    mock_event.id = "test-event-id"
    mock_event.agent_type = "UNKNOWN_AGENT_TYPE"
    mock_event.raw_data = "unknown_raw_data"

    # Call the function and expect ValueError
    with pytest.raises(ValueError, match="Unknown agent type or raw_data format"):
        await build_variables(mock_event)
