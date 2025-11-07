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

from veaiops.utils.embedding import embedding_create


@pytest.mark.asyncio
async def test_embedding_create_success(mocker):
    """Test successful embedding creation."""
    # Mock the OpenAI client
    mock_embedding = mocker.MagicMock()
    mock_embedding.embedding = [0.1, 0.2, 0.3]
    mock_embedding.index = 0

    mock_response = mocker.MagicMock()
    mock_response.data = [mock_embedding]

    mock_embeddings = mocker.MagicMock()
    mock_embeddings.create = mocker.AsyncMock(return_value=mock_response)

    mock_client = mocker.MagicMock()
    mock_client.embeddings = mock_embeddings
    mock_client.__aenter__ = mocker.AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = mocker.AsyncMock(return_value=None)

    mocker.patch("veaiops.utils.embedding.openai.AsyncOpenAI", return_value=mock_client)

    # Test
    result = await embedding_create(
        api_key="test-api-key", base_url="https://api.test.com", model="text-embedding-3-small", raw_input=["test text"]
    )

    # Verify
    assert result == [mock_embedding]
    mock_embeddings.create.assert_called_once_with(
        model="text-embedding-3-small", input=["test text"], encoding_format="float"
    )


@pytest.mark.asyncio
async def test_embedding_create_multiple_inputs(mocker):
    """Test embedding creation with multiple text inputs."""
    # Mock embeddings for multiple inputs
    mock_embedding1 = mocker.MagicMock()
    mock_embedding1.embedding = [0.1, 0.2, 0.3]
    mock_embedding1.index = 0

    mock_embedding2 = mocker.MagicMock()
    mock_embedding2.embedding = [0.4, 0.5, 0.6]
    mock_embedding2.index = 1

    mock_response = mocker.MagicMock()
    mock_response.data = [mock_embedding1, mock_embedding2]

    mock_embeddings = mocker.MagicMock()
    mock_embeddings.create = mocker.AsyncMock(return_value=mock_response)

    mock_client = mocker.MagicMock()
    mock_client.embeddings = mock_embeddings
    mock_client.__aenter__ = mocker.AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = mocker.AsyncMock(return_value=None)

    mocker.patch("veaiops.utils.embedding.openai.AsyncOpenAI", return_value=mock_client)

    # Test
    result = await embedding_create(
        api_key="test-key",
        base_url="https://api.test.com",
        model="text-embedding-ada-002",
        raw_input=["text1", "text2"],
    )

    # Verify
    assert len(result) == 2
    assert result == [mock_embedding1, mock_embedding2]


@pytest.mark.asyncio
async def test_embedding_create_empty_input(mocker):
    """Test embedding creation with empty input list."""
    mock_response = mocker.MagicMock()
    mock_response.data = []

    mock_embeddings = mocker.MagicMock()
    mock_embeddings.create = mocker.AsyncMock(return_value=mock_response)

    mock_client = mocker.MagicMock()
    mock_client.embeddings = mock_embeddings
    mock_client.__aenter__ = mocker.AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = mocker.AsyncMock(return_value=None)

    mocker.patch("veaiops.utils.embedding.openai.AsyncOpenAI", return_value=mock_client)

    # Test
    result = await embedding_create(
        api_key="test-key", base_url="https://api.test.com", model="test-model", raw_input=[]
    )

    # Verify
    assert result == []
