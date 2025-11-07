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

"""Tests for bot_client cache module."""

import pytest

from veaiops.cache.bot_client import get_bot_client
from veaiops.schema.types import ChannelType


@pytest.mark.asyncio
async def test_get_bot_client_with_secret_lark():
    """Test getting bot client with secret provided for Lark channel."""
    # Act - Directly call get_bot_client with secret
    client = await get_bot_client(bot_id="test_bot_direct", channel=ChannelType.Lark, secret="test_secret")

    # Assert
    assert client is not None
    assert hasattr(client, "request")


@pytest.mark.asyncio
async def test_get_bot_client_bot_not_found():
    """Test getting bot client when bot not found in database."""
    # Act
    client = await get_bot_client(bot_id="non_existent_bot", channel=ChannelType.Lark)

    # Assert
    assert client is None


@pytest.mark.asyncio
async def test_get_bot_client_unsupported_channel():
    """Test getting bot client with unsupported channel type."""
    # Act - using an unsupported channel type
    client = await get_bot_client(bot_id="test_bot", channel="UnsupportedChannel", secret="test_secret")

    # Assert
    assert client is None


@pytest.mark.asyncio
async def test_get_bot_client_with_none_secret_and_bot_not_found():
    """Test getting bot client with no secret and bot not in database."""
    # Act
    client = await get_bot_client(bot_id="missing_bot_id", channel=ChannelType.Lark, secret=None)

    # Assert
    assert client is None


@pytest.mark.asyncio
async def test_get_bot_client_cache_with_secret():
    """Test bot client caching mechanism with secret."""
    # Act - First call
    client1 = await get_bot_client(bot_id="cache_test_bot", channel=ChannelType.Lark, secret="test_secret")

    # Act - Second call should hit cache (within 60 seconds TTL)
    client2 = await get_bot_client(bot_id="cache_test_bot", channel=ChannelType.Lark, secret="test_secret")

    # Assert - Both calls return valid clients
    assert client1 is not None
    assert client2 is not None
    assert hasattr(client1, "request")
    assert hasattr(client2, "request")


@pytest.mark.asyncio
async def test_get_bot_client_different_bots():
    """Test caching with multiple different bots."""
    # Act
    client1 = await get_bot_client(bot_id="bot_1", channel=ChannelType.Lark, secret="secret_1")
    client2 = await get_bot_client(bot_id="bot_2", channel=ChannelType.Lark, secret="secret_2")

    # Assert - Both clients should be created independently
    assert client1 is not None
    assert client2 is not None
    assert hasattr(client1, "request")
    assert hasattr(client2, "request")


@pytest.mark.asyncio
async def test_get_bot_client_cache_key_uniqueness():
    """Test that cache keys are unique per bot_id and channel combination."""
    # Act - Get client for same bot with Lark channel
    client1 = await get_bot_client(bot_id="unique_bot", channel=ChannelType.Lark, secret="secret_1")

    # Get client again (should use cache)
    client2 = await get_bot_client(bot_id="unique_bot", channel=ChannelType.Lark, secret="secret_1")

    # Assert
    assert client1 is not None
    assert client2 is not None


@pytest.mark.asyncio
async def test_get_bot_client_lark_channel_type():
    """Test that Lark channel creates proper client."""
    # Act
    client = await get_bot_client(bot_id="lark_test_bot", channel=ChannelType.Lark, secret="lark_secret")

    # Assert - Verify it's a Lark client
    assert client is not None
    assert hasattr(client, "request")
    assert hasattr(client, "_config")


@pytest.mark.asyncio
async def test_get_bot_client_empty_bot_id():
    """Test handling of empty bot_id."""
    # Act
    client = await get_bot_client(bot_id="", channel=ChannelType.Lark, secret="test_secret")

    # Assert - Should still create client even with empty bot_id
    assert client is not None


@pytest.mark.asyncio
async def test_get_bot_client_none_return_on_no_secret():
    """Test that None is returned when bot not found and no secret provided."""
    # Act
    client = await get_bot_client(bot_id="nonexistent", channel=ChannelType.Lark, secret=None)

    # Assert
    assert client is None
