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

from unittest.mock import Mock

from veaiops.agents.chatops.validate import validate_state_result


def test_validate_state_result_key_not_found():
    """Test when state key is not found in session."""
    # Arrange
    ctx = Mock()
    ctx.session.state = {}
    state_key = "missing_key"
    agent_name = "TestAgent"

    # Act
    result = validate_state_result(ctx, state_key, agent_name)

    # Assert
    assert result is False


def test_validate_state_result_value_is_none():
    """Test when state key exists but value is None."""
    # Arrange
    ctx = Mock()
    state_key = "test_key"
    ctx.session.state = {state_key: None}
    agent_name = "TestAgent"

    # Act
    result = validate_state_result(ctx, state_key, agent_name)

    # Assert
    assert result is False


def test_validate_state_result_value_is_empty_string():
    """Test when state key exists but value is empty string."""
    # Arrange
    ctx = Mock()
    state_key = "test_key"
    ctx.session.state = {state_key: ""}
    agent_name = "TestAgent"

    # Act
    result = validate_state_result(ctx, state_key, agent_name)

    # Assert
    assert result is False


def test_validate_state_result_value_is_empty_list():
    """Test when state key exists but value is empty list."""
    # Arrange
    ctx = Mock()
    state_key = "test_key"
    ctx.session.state = {state_key: []}
    agent_name = "TestAgent"

    # Act
    result = validate_state_result(ctx, state_key, agent_name)

    # Assert
    assert result is False


def test_validate_state_result_value_is_zero():
    """Test when state key exists but value is zero (falsy but valid)."""
    # Arrange
    ctx = Mock()
    state_key = "test_key"
    ctx.session.state = {state_key: 0}
    agent_name = "TestAgent"

    # Act
    result = validate_state_result(ctx, state_key, agent_name)

    # Assert
    assert result is False


def test_validate_state_result_success_with_string():
    """Test successful validation with string value."""
    # Arrange
    ctx = Mock()
    state_key = "test_key"
    ctx.session.state = {state_key: "valid_value"}
    agent_name = "TestAgent"

    # Act
    result = validate_state_result(ctx, state_key, agent_name)

    # Assert
    assert result is True


def test_validate_state_result_success_with_dict():
    """Test successful validation with dict value."""
    # Arrange
    ctx = Mock()
    state_key = "test_key"
    ctx.session.state = {state_key: {"data": "value"}}
    agent_name = "TestAgent"

    # Act
    result = validate_state_result(ctx, state_key, agent_name)

    # Assert
    assert result is True


def test_validate_state_result_success_with_list():
    """Test successful validation with non-empty list value."""
    # Arrange
    ctx = Mock()
    state_key = "test_key"
    ctx.session.state = {state_key: ["item1", "item2"]}
    agent_name = "TestAgent"

    # Act
    result = validate_state_result(ctx, state_key, agent_name)

    # Assert
    assert result is True
