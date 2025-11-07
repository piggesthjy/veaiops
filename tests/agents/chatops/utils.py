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

from typing import Optional
from unittest.mock import MagicMock


def create_async_iterator(events):
    """Helper to create an async iterator from a list of events."""

    async def async_gen():
        for event in events:
            yield event

    return async_gen()


def create_mock_runner_with_response(response_text: str, agent_name: Optional[str] = None):
    """创建带有响应的 mock runner.

    Args:
        response_text: JSON 格式的响应文本
        agent_name: Agent 名称 (可选)

    Returns:
        tuple: (mock_runner, mock_event)
    """
    mock_runner = MagicMock()
    mock_event = MagicMock()
    mock_event.is_final_response.return_value = True
    mock_event.content.parts = [MagicMock(text=response_text)]
    if agent_name:
        mock_event.author = agent_name
    mock_runner.run_async.return_value = create_async_iterator([mock_event])
    return mock_runner, mock_event
