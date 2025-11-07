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

"""Tests for logging utilities."""

import logging
import uuid

from veaiops.utils.log import HealthzFilter, MessageContextFilter


def test_message_context_filter_with_full_context(mocker):
    """Test MessageContextFilter with complete context available."""
    # Arrange
    record = {"extra": {}}
    request_id = uuid.uuid4().hex
    msg_id = "test_msg_id"
    bot_id = "test_bot_id"
    chat_id = "test_chat_id"
    channel = "test_channel"

    # Mock the starlette_context.context.get method
    mock_context_get = mocker.patch("veaiops.utils.log.context.get")
    mock_context_get.side_effect = lambda key, default=None: {
        "X-Request-ID": request_id,
        "msg_id": msg_id,
        "bot_id": bot_id,
        "chat_id": chat_id,
        "channel": channel,
    }.get(key, default)

    filtrator = MessageContextFilter()

    # Act
    result = filtrator(record)

    # Assert
    assert result is True
    assert record["extra"]["request_id"] == request_id
    assert record["extra"]["msg_id"] == msg_id
    assert record["extra"]["bot_id"] == bot_id
    assert record["extra"]["chat_id"] == chat_id
    assert record["extra"]["channel"] == channel


def test_message_context_filter_without_context():
    """Test MessageContextFilter when no context exists."""
    # Arrange
    record = {"extra": {}}
    filtrator = MessageContextFilter()

    # Act
    result = filtrator(record)

    # Assert
    assert result is True
    assert "request_id" in record["extra"]
    assert record["extra"]["msg_id"] == "N/A"
    assert record["extra"]["bot_id"] == "N/A"
    assert record["extra"]["chat_id"] == "N/A"
    assert record["extra"]["channel"] == "N/A"


def test_message_context_filter_partial_context(mocker):
    """Test MessageContextFilter with partial context (some fields missing)."""
    # Arrange
    record = {"extra": {}}
    request_id = uuid.uuid4().hex
    msg_id = "test_msg_id"

    # Mock to provide only some context values
    mock_context_get = mocker.patch("veaiops.utils.log.context.get")
    mock_context_get.side_effect = lambda key, default=None: {
        "X-Request-ID": request_id,
        "msg_id": msg_id,
    }.get(key, default)

    filtrator = MessageContextFilter()

    # Act
    result = filtrator(record)

    # Assert
    assert result is True
    assert record["extra"]["request_id"] == request_id
    assert record["extra"]["msg_id"] == msg_id
    assert record["extra"]["bot_id"] == "N/A"
    assert record["extra"]["chat_id"] == "N/A"
    assert record["extra"]["channel"] == "N/A"


def test_healthz_filter_excludes_healthz():
    """Test that HealthzFilter filters out healthz endpoint logs."""
    # Arrange
    health_filter = HealthzFilter()
    record = logging.LogRecord(
        name="test",
        level=logging.INFO,
        pathname="",
        lineno=0,
        msg="GET /healthz HTTP/1.1",
        args=(),
        exc_info=None,
    )

    # Act
    result = health_filter.filter(record)

    # Assert
    assert result is False


def test_healthz_filter_allows_other_endpoints():
    """Test that HealthzFilter allows non-healthz endpoint logs."""
    # Arrange
    health_filter = HealthzFilter()
    record = logging.LogRecord(
        name="test",
        level=logging.INFO,
        pathname="",
        lineno=0,
        msg="GET /api/v1/users HTTP/1.1",
        args=(),
        exc_info=None,
    )

    # Act
    result = health_filter.filter(record)

    # Assert
    assert result is True
