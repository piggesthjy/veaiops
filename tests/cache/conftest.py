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

"""Shared fixtures for cache tests.

Design principles:
- Keep only reusable factory fixtures that are used in multiple tests
- Specific response mocks should be created in the test function
- Use factory fixtures to simplify complex mock creation
"""

from unittest.mock import AsyncMock

import pytest


@pytest.fixture
def setup_mock_aiohttp_session(mocker):
    """Fixture to setup and return a mock aiohttp session response.

    This fixture automatically patches aiohttp.ClientSession and returns
    the mock response object for convenient configuration in tests.

    Usage:
        async def test_something(setup_mock_aiohttp_session):
            mock_response_obj = setup_mock_aiohttp_session
            mock_response_obj.json = AsyncMock(return_value={"key": "value"})
            mock_response_obj.status = 200

            # Test code that uses aiohttp.ClientSession...
    """
    mock_session = mocker.MagicMock()
    mock_response = mocker.MagicMock()
    mock_response.status = 200
    mock_response.json = AsyncMock(return_value={})

    mock_session.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session.__aexit__ = AsyncMock(return_value=None)
    mock_session.post = mocker.MagicMock()
    mock_session.post.return_value.__aenter__ = AsyncMock(return_value=mock_response)
    mock_session.post.return_value.__aexit__ = AsyncMock(return_value=None)

    mocker.patch("aiohttp.ClientSession", return_value=mock_session)

    return mock_response


@pytest.fixture
def mock_aiohttp_client_factory(mocker):
    """Factory fixture to create mock aiohttp sessions with configurable responses.

    This is the primary fixture - it handles all HTTP client mocking needs.

    Usage:
        def test_something(mock_aiohttp_client_factory):
            # With specific response data
            mock_session, mock_response = mock_aiohttp_client_factory(
                response_data={"status": "ok"}
            )

            # With failed response
            mock_session, mock_response = mock_aiohttp_client_factory(
                response_data=None,
                status=500,
                raise_error=Exception("API Error")
            )

            mocker.patch("aiohttp.ClientSession", return_value=mock_session)
    """

    def create_mock_session(response_data=None, status=200, raise_error=None):
        """Create a mock aiohttp session.

        Args:
            response_data: Dict to return from json() call, defaults to {}
            status: HTTP status code, defaults to 200
            raise_error: Exception to raise on raise_for_status(), defaults to None

        Returns:
            Tuple of (mock_session, mock_response)
        """
        if response_data is None:
            response_data = {}

        mock_session = mocker.MagicMock()
        mock_response = mocker.MagicMock()
        mock_response.status = status
        mock_response.json = AsyncMock(return_value=response_data)

        if raise_error:
            mock_response.raise_for_status = mocker.MagicMock(side_effect=raise_error)
        else:
            mock_response.raise_for_status = mocker.MagicMock()

        mock_session.__aenter__ = AsyncMock(return_value=mock_session)
        mock_session.__aexit__ = AsyncMock(return_value=None)
        mock_session.post = mocker.MagicMock()
        mock_session.post.return_value.__aenter__ = AsyncMock(return_value=mock_response)
        mock_session.post.return_value.__aexit__ = AsyncMock(return_value=None)

        return mock_session, mock_response

    return create_mock_session
