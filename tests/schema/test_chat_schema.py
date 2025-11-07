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

"""Tests for Chat document model and set_chat_link functionality."""

from unittest.mock import MagicMock

import pytest
import pytest_asyncio

from veaiops.schema.documents.chatops.chat import Chat
from veaiops.schema.types import ChannelType


@pytest_asyncio.fixture
async def test_chat_data():
    """Provide test data for chat creation."""
    return {
        "channel": ChannelType.Lark,
        "bot_id": "test_bot_id",
        "chat_id": "test_chat_id",
        "name": "Test Chat",
    }


@pytest.mark.asyncio
async def test_set_chat_link_api_failure(mocker, test_chat_data):
    """Test Chat.set_chat_link handles API failure gracefully."""
    chat = Chat(**test_chat_data)

    # Mock get_bot_client
    mock_client = MagicMock()

    # Mock failed response from Lark API
    mock_response = MagicMock()
    mock_response.success.return_value = False
    mock_response.code = "40001"
    mock_response.msg = "Invalid request"

    mock_client.im.v1.chat.link = MagicMock(return_value=mock_response)

    mocker.patch("veaiops.schema.documents.chatops.chat.get_bot_client", return_value=mock_client)

    # Call set_chat_link - should not raise
    await chat.set_chat_link()

    # Verify chat_link was not set (remains None)
    assert chat.chat_link is None


@pytest.mark.asyncio
async def test_set_chat_link_client_not_exist(mocker, test_chat_data):
    """Test Chat.set_chat_link handles missing bot client."""
    chat = Chat(**test_chat_data)

    # Mock get_bot_client to return None
    mocker.patch("veaiops.schema.documents.chatops.chat.get_bot_client", return_value=None)

    # Call set_chat_link - should not raise
    await chat.set_chat_link()

    # Verify chat_link was not set
    assert chat.chat_link is None
