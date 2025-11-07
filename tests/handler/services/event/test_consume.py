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

from veaiops.handler.services.event.consume import consume_event
from veaiops.schema.types import EventStatus


@pytest.mark.asyncio
async def test_consume_event_success(mocker):
    """Test consume_event function with a new event."""
    # Mock the event object
    mock_event = mocker.MagicMock()
    mock_event.id = "test-event-id"
    mock_event.status = EventStatus.INITIAL

    # Mock the dependency functions
    mock_subscription_matching = mocker.patch(
        "veaiops.handler.services.event.consume.subscription_matching", return_value=None
    )
    mock_message_card_build = mocker.patch(
        "veaiops.handler.services.event.consume.message_card_build", return_value=None
    )
    mock_notification_dispatch = mocker.patch(
        "veaiops.handler.services.event.consume.notification_dispatch", return_value=None
    )

    # Call the function
    await consume_event(mock_event)

    # Verify the functions were called
    mock_subscription_matching.assert_called_once_with(mock_event)
    mock_message_card_build.assert_called_once_with(mock_event)
    mock_notification_dispatch.assert_called_once_with(mock_event)


@pytest.mark.asyncio
async def test_consume_event_already_processed(mocker):
    """Test consume_event function with an event that already has a status >= CHATOPS_NOT_MATCHED."""
    # Mock the event object with a status that should be skipped
    mock_event = mocker.MagicMock()
    mock_event.id = "test-event-id"
    mock_event.status = EventStatus.CHATOPS_NOT_MATCHED

    # Mock the dependency functions
    mock_subscription_matching = mocker.patch(
        "veaiops.handler.services.event.consume.subscription_matching", return_value=None
    )
    mock_message_card_build = mocker.patch(
        "veaiops.handler.services.event.consume.message_card_build", return_value=None
    )
    mock_notification_dispatch = mocker.patch(
        "veaiops.handler.services.event.consume.notification_dispatch", return_value=None
    )

    # Call the function
    await consume_event(mock_event)

    # Verify the functions were not called
    mock_subscription_matching.assert_not_called()
    mock_message_card_build.assert_not_called()
    mock_notification_dispatch.assert_not_called()


@pytest.mark.asyncio
async def test_consume_event_dispatched_status(mocker):
    """Test consume_event function with an event that already has DISPATCHED status."""
    # Mock the event object with DISPATCHED status
    mock_event = mocker.MagicMock()
    mock_event.id = "test-event-id"
    mock_event.status = EventStatus.DISPATCHED

    # Mock the dependency functions
    mock_subscription_matching = mocker.patch(
        "veaiops.handler.services.event.consume.subscription_matching", return_value=None
    )
    mock_message_card_build = mocker.patch(
        "veaiops.handler.services.event.consume.message_card_build", return_value=None
    )
    mock_notification_dispatch = mocker.patch(
        "veaiops.handler.services.event.consume.notification_dispatch", return_value=None
    )

    # Call the function
    await consume_event(mock_event)

    # Verify the functions were not called
    mock_subscription_matching.assert_not_called()
    mock_message_card_build.assert_not_called()
    mock_notification_dispatch.assert_not_called()


@pytest.mark.asyncio
async def test_consume_event_exception_handling(mocker):
    """Test consume_event function handles exceptions properly."""
    # Mock the event object
    mock_event = mocker.MagicMock()
    mock_event.id = "test-event-id"
    mock_event.status = EventStatus.INITIAL

    # Mock subscription_matching to raise an exception
    mock_subscription_matching = mocker.patch(
        "veaiops.handler.services.event.consume.subscription_matching", side_effect=Exception("Mock exception")
    )

    # Call the function and expect it to raise the exception
    with pytest.raises(Exception, match="Mock exception"):
        await consume_event(mock_event)

    # Verify subscription_matching was called and the others were not
    mock_subscription_matching.assert_called_once_with(mock_event)
