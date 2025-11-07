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

from unittest.mock import MagicMock

import pytest
from fastapi import Request

from veaiops.handler.routers.apis.v1.system_config.global_config import (
    GlobalConfig,
    get_global_config,
)


@pytest.mark.asyncio
async def test_get_global_config_success():
    """Test getting global configuration successfully."""
    # Arrange
    mock_request = MagicMock(spec=Request)

    # Act
    response = await get_global_config(request=mock_request)

    # Assert
    assert response.message == "Global config retrieved successfully"
    assert response.data is not None
    assert isinstance(response.data, GlobalConfig)
