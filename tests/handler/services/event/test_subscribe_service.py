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
from beanie import PydanticObjectId

from veaiops.handler.services.event.subscribe import create_notice_details, find_subscriptions, subscription_matching
from veaiops.schema.documents import AgentNotification, Event, EventNoticeDetail, Subscribe
from veaiops.schema.types import AgentType, ChannelType, EventStatus


@pytest.mark.asyncio
async def test_find_subscriptions_basic(mocker):
    """Test find_subscriptions function with basic event."""
    # Mock the event object
    mock_event = mocker.MagicMock()
    mock_event.id = PydanticObjectId()
    mock_event.agent_type = AgentType.CHATOPS_INTEREST
    mock_event.product = None
    mock_event.project = None
    mock_event.customer = None

    # Mock Subscribe.find
    mock_subscribe1 = mocker.MagicMock()
    mock_subscribe2 = mocker.MagicMock()
    mock_subscribes = [mock_subscribe1, mock_subscribe2]

    mock_find = mocker.MagicMock()
    mock_find.to_list = mocker.AsyncMock(return_value=mock_subscribes)
    mocker.patch.object(Subscribe, "find", return_value=mock_find)

    # Call the function
    result = await find_subscriptions(mock_event)

    # Verify the result
    assert result == mock_subscribes
    assert len(result) == 2

    # Verify Subscribe.find was called with the correct conditions
    Subscribe.find.assert_called_once()


@pytest.mark.asyncio
async def test_find_subscriptions_with_product_project_customer(mocker):
    """Test find_subscriptions function with product, project and customer filters."""
    # Mock the event object
    mock_event = mocker.MagicMock()
    mock_event.id = PydanticObjectId()
    mock_event.agent_type = AgentType.CHATOPS_INTEREST
    mock_event.product = ["product1", "product2"]
    mock_event.project = ["project1"]
    mock_event.customer = ["customer1"]

    # Mock Subscribe.find
    mock_subscribe = mocker.MagicMock()
    mock_subscribes = [mock_subscribe]

    mock_find = mocker.MagicMock()
    mock_find.to_list = mocker.AsyncMock(return_value=mock_subscribes)
    mocker.patch.object(Subscribe, "find", return_value=mock_find)

    # Call the function
    result = await find_subscriptions(mock_event)

    # Verify the result
    assert result == mock_subscribes
    assert len(result) == 1

    # Verify Subscribe.find was called
    Subscribe.find.assert_called_once()


@pytest.mark.asyncio
async def test_find_subscriptions_empty_result(mocker):
    """Test find_subscriptions function with no matching subscriptions."""
    # Mock the event object
    mock_event = mocker.MagicMock()
    mock_event.id = PydanticObjectId()
    mock_event.agent_type = AgentType.CHATOPS_INTEREST

    # Mock Subscribe.find to return empty list
    mock_find = mocker.MagicMock()
    mock_find.to_list = mocker.AsyncMock(return_value=[])
    mocker.patch.object(Subscribe, "find", return_value=mock_find)

    # Call the function
    result = await find_subscriptions(mock_event)

    # Verify the result is empty
    assert result == []
    assert len(result) == 0


@pytest.mark.asyncio
async def test_create_notice_details_with_webhook(mocker):
    """Test create_notice_details function with webhook enabled."""
    # Mock the event object
    mock_event = mocker.MagicMock()
    mock_event.id = PydanticObjectId()

    # Mock subscribe with webhook enabled
    mock_strategy = mocker.MagicMock()
    mock_strategy.channel = ChannelType.Lark
    mock_strategy.chat_ids = ["chat1", "chat2"]
    mock_strategy.bot_id = "bot1"

    mock_subscribe = mocker.MagicMock()
    mock_subscribe.enable_webhook = True
    mock_subscribe.webhook_endpoint = "https://example.com/webhook"
    mock_subscribe.webhook_headers = {"Authorization": "Bearer token"}
    mock_subscribe.inform_strategy_ids = [mock_strategy]

    # Call the function
    result = await create_notice_details(mock_event, [mock_subscribe])

    # Verify the result
    assert len(result) == 3  # 1 webhook + 2 chat notifications

    # Check webhook notice detail
    webhook_detail = result[0]
    assert webhook_detail.event_main_id == mock_event.id
    assert webhook_detail.notice_channel == ChannelType.Webhook
    assert webhook_detail.target == "https://example.com/webhook"
    assert webhook_detail.extra == {"headers": {"Authorization": "Bearer token"}}
    assert webhook_detail.status == EventStatus.INITIAL

    # Check chat notice details
    assert result[1].notice_channel == ChannelType.Lark
    assert result[1].target == "chat1"
    assert result[2].notice_channel == ChannelType.Lark
    assert result[2].target == "chat2"


@pytest.mark.asyncio
async def test_create_notice_details_without_webhook(mocker):
    """Test create_notice_details function with webhook disabled."""
    # Mock the event object
    mock_event = mocker.MagicMock()
    mock_event.id = PydanticObjectId()

    # Mock subscribe with webhook disabled
    mock_strategy = mocker.MagicMock()
    mock_strategy.channel = ChannelType.Lark
    mock_strategy.chat_ids = ["chat1"]
    mock_strategy.bot_id = "bot1"

    mock_subscribe = mocker.MagicMock()
    mock_subscribe.enable_webhook = False
    mock_subscribe.webhook_endpoint = None
    mock_subscribe.inform_strategy_ids = [mock_strategy]

    # Call the function
    result = await create_notice_details(mock_event, [mock_subscribe])

    # Verify the result
    assert len(result) == 1  # Only 1 chat notification
    assert result[0].notice_channel == ChannelType.Lark
    assert result[0].target == "chat1"


@pytest.mark.asyncio
async def test_create_notice_details_empty_subscribes(mocker):
    """Test create_notice_details function with empty subscriptions list."""
    # Mock the event object
    mock_event = mocker.MagicMock()
    mock_event.id = PydanticObjectId()

    # Call the function with empty subscriptions
    result = await create_notice_details(mock_event, [])

    # Verify the result is empty
    assert result == []


@pytest.mark.asyncio
async def test_subscription_matching_chatops_reply(mocker):
    """Test subscription_matching function with chatops reply agent type."""
    # Mock the event object for chatops reply
    mock_event = mocker.MagicMock()
    mock_event.id = PydanticObjectId()
    mock_event.agent_type = AgentType.CHATOPS_REACTIVE_REPLY
    mock_event.set = mocker.AsyncMock()

    # Mock raw_data as AgentNotification
    mock_raw_data = mocker.MagicMock(spec=AgentNotification)
    mock_raw_data.channel = ChannelType.Lark
    mock_raw_data.chat_id = "test-chat-id"
    mock_raw_data.bot_id = "test-bot-id"
    mock_raw_data.msg_id = "test-msg-id"
    mock_event.raw_data = mock_raw_data

    mocker.patch.object(EventNoticeDetail, "insert_many", mocker.AsyncMock())

    # Call the function
    await subscription_matching(mock_event)

    # Verify EventNoticeDetail.insert_many was called
    EventNoticeDetail.insert_many.assert_called_once()
    mock_event.set.assert_called_once_with({Event.status: EventStatus.SUBSCRIBED})


@pytest.mark.asyncio
async def test_subscription_matching_other_agent_type(mocker):
    """Test subscription_matching function with other agent type."""
    # Mock the event object
    mock_event = mocker.MagicMock()
    mock_event.id = PydanticObjectId()
    mock_event.agent_type = AgentType.CHATOPS_INTEREST
    mock_event.set = mocker.AsyncMock()

    # Mock find_subscriptions and create_notice_details
    mocker.patch(
        "veaiops.handler.services.event.subscribe.find_subscriptions",
        mocker.AsyncMock(return_value=[mocker.MagicMock()]),
    )
    mocker.patch(
        "veaiops.handler.services.event.subscribe.create_notice_details",
        mocker.AsyncMock(return_value=[mocker.MagicMock()]),
    )
    mocker.patch.object(EventNoticeDetail, "insert_many", mocker.AsyncMock())

    # Call the function
    await subscription_matching(mock_event)

    # Verify the functions were called
    EventNoticeDetail.insert_many.assert_called_once()
    mock_event.set.assert_called_once_with({Event.status: EventStatus.SUBSCRIBED})


@pytest.mark.asyncio
async def test_subscription_matching_no_notice_details(mocker):
    """Test subscription_matching function with no notice details created."""
    # Mock the event object
    mock_event = mocker.MagicMock()
    mock_event.id = PydanticObjectId()
    mock_event.agent_type = AgentType.CHATOPS_INTEREST
    mock_event.set = mocker.AsyncMock()

    # Mock find_subscriptions and create_notice_details to return empty lists
    mocker.patch("veaiops.handler.services.event.subscribe.find_subscriptions", mocker.AsyncMock(return_value=[]))
    mocker.patch("veaiops.handler.services.event.subscribe.create_notice_details", mocker.AsyncMock(return_value=[]))
    mocker.patch.object(EventNoticeDetail, "insert_many", mocker.AsyncMock())

    # Call the function
    await subscription_matching(mock_event)

    # Verify EventNoticeDetail.insert_many was not called
    EventNoticeDetail.insert_many.assert_not_called()
    mock_event.set.assert_called_once_with({Event.status: EventStatus.NONE_DISPATCH})
