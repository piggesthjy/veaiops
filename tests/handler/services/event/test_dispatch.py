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

from veaiops.handler.services.event.dispatch import notification_dispatch
from veaiops.schema.base import TemplateVariable
from veaiops.schema.base.template_card import ChannelMsg
from veaiops.schema.documents import Event, EventNoticeDetail
from veaiops.schema.types import ChannelType, EventStatus


@pytest.mark.asyncio
async def test_notification_dispatch_success(mocker):
    """Test notification_dispatch function with successful message sending."""
    # Mock the event object
    mock_event = mocker.MagicMock()
    mock_event.id = "test-event-id"
    mock_event.agent_type = "test-agent-type"
    mock_event.set = mocker.AsyncMock()

    template_vars = TemplateVariable(
        chat_id="test-chat-id",
        event_id="test-event-id",
        button_name="test-button",
        button_action="redirect",
        analysis="test-analysis",
    )
    mock_event.channel_msg = {
        ChannelType.Lark: ChannelMsg(
            channel=ChannelType.Lark, template_id="test-template-id", template_variables=template_vars
        )
    }

    # Mock EventNoticeDetail.find
    mock_notice_detail = mocker.MagicMock()
    mock_notice_detail.id = "test-notice-id"
    mock_notice_detail.notice_channel = ChannelType.Lark
    mock_notice_detail.target = "test-target"
    mock_notice_detail.extra = {"extra_key": "extra_value"}
    mock_notice_details = [mock_notice_detail]

    mock_find = mocker.MagicMock()
    mock_find.to_list = mocker.AsyncMock(return_value=mock_notice_details)
    mocker.patch.object(EventNoticeDetail, "find", return_value=mock_find)

    # Mock the channel registry
    mock_channel_class = mocker.MagicMock()
    mock_adapter = mocker.MagicMock()
    mock_adapter.send_message = mocker.AsyncMock(return_value=["msg-123"])
    mock_channel_class.return_value = mock_adapter

    mocker.patch("veaiops.handler.services.event.dispatch.REGISTRY", {ChannelType.Lark: mock_channel_class})

    # Mock EventNoticeDetail.get and save
    mock_event_notice_detail_get = mocker.MagicMock()
    mock_event_notice_detail_get.out_message_ids = None
    mock_event_notice_detail_get.save = mocker.AsyncMock()
    mocker.patch.object(EventNoticeDetail, "get", mocker.AsyncMock(return_value=mock_event_notice_detail_get))

    # Call the function
    await notification_dispatch(mock_event)

    # Verify the adapter.send_message was called correctly
    mock_adapter.send_message.assert_called_once_with(
        content=template_vars,
        agent_type="test-agent-type",
        target="test-target",
        template_id="test-template-id",
        **{"extra_key": "extra_value"},
    )

    # Verify the event notice detail was updated
    mock_event_notice_detail_get.save.assert_called_once()
    assert mock_event_notice_detail_get.out_message_ids == ["msg-123"]

    # Verify the event status was updated
    mock_event.set.assert_called_once_with({Event.status: EventStatus.DISPATCHED})


@pytest.mark.asyncio
async def test_notification_dispatch_unknown_channel(mocker):
    """Test notification_dispatch function with unknown channel."""
    # Mock the event object
    mock_event = mocker.MagicMock()
    mock_event.id = "test-event-id"
    mock_event.agent_type = "test-agent-type"
    mock_event.channel_msg = {}
    mock_event.set = mocker.AsyncMock()

    # Mock EventNoticeDetail.find
    mock_notice_detail = mocker.MagicMock()
    mock_notice_detail.id = "test-notice-id"
    mock_notice_detail.notice_channel = "unknown-channel"
    mock_notice_detail.target = "test-target"
    mock_notice_detail.extra = {}
    mock_notice_details = [mock_notice_detail]

    mock_find = mocker.MagicMock()
    mock_find.to_list = mocker.AsyncMock(return_value=mock_notice_details)
    mocker.patch.object(EventNoticeDetail, "find", return_value=mock_find)

    # Mock the channel registry with no unknown-channel
    mocker.patch("veaiops.handler.services.event.dispatch.REGISTRY", {})

    # Call the function
    await notification_dispatch(mock_event)

    # Verify the event status was updated even though the channel was unknown
    mock_event.set.assert_called_once_with({Event.status: EventStatus.DISPATCHED})


@pytest.mark.asyncio
async def test_notification_dispatch_missing_channel_msg(mocker):
    """Test notification_dispatch function with missing channel message."""
    # Mock the event object
    mock_event = mocker.MagicMock()
    mock_event.id = "test-event-id"
    mock_event.agent_type = "test-agent-type"
    mock_event.channel_msg = {}
    mock_event.set = mocker.AsyncMock()

    # Mock EventNoticeDetail.find
    mock_notice_detail = mocker.MagicMock()
    mock_notice_detail.id = "test-notice-id"
    mock_notice_detail.notice_channel = ChannelType.Lark
    mock_notice_detail.target = "test-target"
    mock_notice_detail.extra = {}
    mock_notice_details = [mock_notice_detail]

    mock_find = mocker.MagicMock()
    mock_find.to_list = mocker.AsyncMock(return_value=mock_notice_details)
    mocker.patch.object(EventNoticeDetail, "find", return_value=mock_find)

    # Mock the channel registry
    mocker.patch("veaiops.handler.services.event.dispatch.REGISTRY", {ChannelType.Lark: mocker.MagicMock()})

    # Call the function
    await notification_dispatch(mock_event)

    # Verify the event status was updated
    mock_event.set.assert_called_once_with({Event.status: EventStatus.DISPATCHED})


@pytest.mark.asyncio
async def test_notification_dispatch_send_exception(mocker):
    """Test notification_dispatch function when send_message raises an exception."""
    # Mock the event object
    mock_event = mocker.MagicMock()
    mock_event.id = "test-event-id"
    mock_event.agent_type = "test-agent-type"
    mock_event.set = mocker.AsyncMock()
    template_vars = TemplateVariable(
        chat_id="test-chat-id",
        event_id="test-event-id",
        button_name="test-button",
        button_action="redirect",
        analysis="test-analysis",
    )
    mock_event.channel_msg = {
        ChannelType.Lark: ChannelMsg(
            channel=ChannelType.Lark, template_id="test-template-id", template_variables=template_vars
        )
    }

    # Mock EventNoticeDetail.find
    mock_notice_detail = mocker.MagicMock()
    mock_notice_detail.id = "test-notice-id"
    mock_notice_detail.notice_channel = ChannelType.Lark
    mock_notice_detail.target = "test-target"
    mock_notice_detail.extra = {}
    mock_notice_details = [mock_notice_detail]

    mock_find = mocker.MagicMock()
    mock_find.to_list = mocker.AsyncMock(return_value=mock_notice_details)
    mocker.patch.object(EventNoticeDetail, "find", return_value=mock_find)

    # Mock the channel registry
    mock_channel_class = mocker.MagicMock()
    mock_adapter = mocker.MagicMock()
    mock_adapter.send_message = mocker.AsyncMock(side_effect=Exception("Mock send error"))
    mock_channel_class.return_value = mock_adapter

    mocker.patch("veaiops.handler.services.event.dispatch.REGISTRY", {ChannelType.Lark: mock_channel_class})

    # Call the function
    await notification_dispatch(mock_event)

    # Verify the event status was updated
    mock_event.set.assert_called_once_with({Event.status: EventStatus.DISPATCHED})


@pytest.mark.asyncio
async def test_notification_dispatch_none_message_id(mocker):
    """Test notification_dispatch function when send_message returns None."""
    # Mock the event object
    mock_event = mocker.MagicMock()
    mock_event.id = "test-event-id"
    mock_event.agent_type = "test-agent-type"
    mock_event.set = mocker.AsyncMock()
    template_vars = TemplateVariable(
        chat_id="test-chat-id",
        event_id="test-event-id",
        button_name="test-button",
        button_action="redirect",
        analysis="test-analysis",
    )
    mock_event.channel_msg = {
        ChannelType.Lark: ChannelMsg(
            channel=ChannelType.Lark, template_id="test-template-id", template_variables=template_vars
        )
    }

    # Mock EventNoticeDetail.find
    mock_notice_detail = mocker.MagicMock()
    mock_notice_detail.id = "test-notice-id"
    mock_notice_detail.notice_channel = ChannelType.Lark
    mock_notice_detail.target = "test-target"
    mock_notice_detail.extra = {}
    mock_notice_details = [mock_notice_detail]

    mock_find = mocker.MagicMock()
    mock_find.to_list = mocker.AsyncMock(return_value=mock_notice_details)
    mocker.patch.object(EventNoticeDetail, "find", return_value=mock_find)

    # Mock the channel registry
    mock_channel_class = mocker.MagicMock()
    mock_adapter = mocker.MagicMock()
    mock_adapter.send_message = mocker.AsyncMock(return_value=None)
    mock_channel_class.return_value = mock_adapter

    mocker.patch("veaiops.handler.services.event.dispatch.REGISTRY", {ChannelType.Lark: mock_channel_class})

    # Call the function
    await notification_dispatch(mock_event)

    # Verify the event status was updated
    mock_event.set.assert_called_once_with({Event.status: EventStatus.DISPATCHED})


@pytest.mark.asyncio
async def test_notification_dispatch_empty_notice_details(mocker):
    """Test notification_dispatch function with no notice details."""
    # Mock the event object
    mock_event = mocker.MagicMock()
    mock_event.id = "test-event-id"
    mock_event.set = mocker.AsyncMock()

    # Mock EventNoticeDetail.find to return an empty list
    mock_find = mocker.MagicMock()
    mock_find.to_list = mocker.AsyncMock(return_value=[])
    mocker.patch.object(EventNoticeDetail, "find", return_value=mock_find)

    # Call the function
    await notification_dispatch(mock_event)

    # Verify the event status was updated
    mock_event.set.assert_called_once_with({Event.status: EventStatus.DISPATCHED})
