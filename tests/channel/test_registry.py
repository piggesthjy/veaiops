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

"""Tests for channel registry."""

import pytest

from veaiops.channel.lark.lark import LarkChannel
from veaiops.channel.registry import REGISTRY, register_channel
from veaiops.channel.webhook import WebhookChannel
from veaiops.schema.types import ChannelType


@pytest.fixture(autouse=True)
def clear_registry():
    """Fixture to clear the registry before and after each test."""
    original_registry = REGISTRY.copy()
    REGISTRY.clear()
    yield
    REGISTRY.clear()
    REGISTRY.update(original_registry)


def test_register_channel_success():
    """Test successful registration of a channel."""
    # Register LarkChannel manually since registry is cleared by fixture
    register_channel()(LarkChannel)
    assert ChannelType.Lark in REGISTRY
    assert REGISTRY[ChannelType.Lark] == LarkChannel


def test_register_channel_duplicate():
    """Test that registering duplicate channel raises ValueError."""
    # Register LarkChannel first
    register_channel()(LarkChannel)
    # Try to register LarkChannel again
    with pytest.raises(ValueError, match="already registered"):
        register_channel()(LarkChannel)


def test_register_channel_not_subclass():
    """Test that registering non-BaseChannel class raises TypeError."""
    with pytest.raises(TypeError, match="must inherit from BaseChannel"):
        register_channel()(object)


def test_register_multiple_different_channels():
    """Test registering multiple different channels successfully."""
    # Register both channels manually since registry is cleared by fixture
    register_channel()(LarkChannel)
    register_channel()(WebhookChannel)
    assert ChannelType.Lark in REGISTRY
    assert ChannelType.Webhook in REGISTRY
    assert REGISTRY[ChannelType.Lark] == LarkChannel
    assert REGISTRY[ChannelType.Webhook] == WebhookChannel
    assert len(REGISTRY) >= 2


def test_registry_is_dict():
    """Test that REGISTRY is a dictionary."""
    assert isinstance(REGISTRY, dict)


def test_registry_clear_works():
    """Test that clearing registry removes all entries."""
    # Register a channel first
    register_channel()(LarkChannel)
    assert len(REGISTRY) > 0

    REGISTRY.clear()
    assert len(REGISTRY) == 0
