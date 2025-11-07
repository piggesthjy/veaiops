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

"""Tests for configuration models (AgentCfg and VolcCfg)."""

from unittest.mock import MagicMock

import pytest
import pytest_asyncio

from veaiops.schema.base.config import AgentCfg, VolcCfg
from veaiops.utils.crypto import EncryptedSecretStr


@pytest_asyncio.fixture
async def volc_config():
    """Create a VolcCfg instance for testing."""
    return VolcCfg(
        ak=EncryptedSecretStr("test_ak_12345"),
        sk=EncryptedSecretStr("test_sk_12345"),
        tos_region="us-east-1",
        tos_endpoint="https://tos.volcengine.com",
    )


@pytest_asyncio.fixture
async def agent_config():
    """Create an AgentCfg instance for testing."""
    return AgentCfg(
        provider="openai",
        name="gpt-4",
        embedding_name="text-embedding-3-small",
        api_base="https://api.openai.com/v1",
        api_key=EncryptedSecretStr("sk-test-key-12345"),
    )


# ============================================================================
# VolcCfg Tests
# ============================================================================


@pytest.mark.asyncio
async def test_volc_cfg_do_check_success(mocker, volc_config):
    """Test VolcCfg.do_check() successfully validates TOS credentials."""
    # Mock TOS client and response
    mock_bucket = MagicMock()
    mock_bucket.name = "test-bucket"
    mock_bucket.location = "us-east-1"
    mock_bucket.creation_date = "2025-01-01"

    mock_response = MagicMock()
    mock_response.buckets = [mock_bucket]

    mock_client = MagicMock()
    mock_client.list_buckets.return_value = mock_response

    # Mock TosClientV2
    mocker.patch("tos.TosClientV2", return_value=mock_client)

    # Call do_check - should not raise
    await volc_config.do_check()

    # Verify TosClientV2 was called
    assert mock_client.list_buckets.called


@pytest.mark.asyncio
async def test_volc_cfg_do_check_empty_ak(volc_config):
    """Test VolcCfg.do_check() returns None when AK is empty."""
    volc_config.ak = EncryptedSecretStr("")

    result = await volc_config.do_check()

    assert result is None


@pytest.mark.asyncio
async def test_volc_cfg_do_check_empty_sk(volc_config):
    """Test VolcCfg.do_check() returns None when SK is empty."""
    volc_config.sk = EncryptedSecretStr("")

    result = await volc_config.do_check()

    assert result is None


@pytest.mark.asyncio
async def test_volc_cfg_do_check_client_error(mocker, volc_config):
    """Test VolcCfg.do_check() handles TosClientError."""

    # Create a custom TosClientError exception class
    class TosClientError(Exception):
        def __init__(self):
            self.message = "Invalid credentials"
            self.cause = "Access denied"

    mock_client = MagicMock()
    mock_client.list_buckets.side_effect = TosClientError()

    # Mock tos module with proper exception hierarchy
    mock_tos = MagicMock()
    mock_tos.TosClientV2.return_value = mock_client

    # Set up exceptions module with the right exception classes
    mock_tos.exceptions = MagicMock()
    mock_tos.exceptions.TosClientError = TosClientError

    mocker.patch.dict("sys.modules", {"tos": mock_tos})

    # Should raise TosClientError
    with pytest.raises(TosClientError):
        await volc_config.do_check()


@pytest.mark.asyncio
async def test_volc_cfg_do_check_server_error(mocker, volc_config):
    """Test VolcCfg.do_check() handles TosServerError."""

    # Create a custom TosServerError exception class
    class TosClientError(Exception):
        def __init__(self):
            self.message = "Client error"
            self.cause = "Access denied"

    class TosServerError(Exception):
        def __init__(self):
            self.code = "ServiceUnavailable"
            self.request_id = "req-123"
            self.message = "Service temporarily unavailable"
            self.status_code = 503

    mock_client = MagicMock()
    mock_client.list_buckets.side_effect = TosServerError()

    # Mock tos module with proper exception hierarchy
    mock_tos = MagicMock()
    mock_tos.TosClientV2.return_value = mock_client

    # Set up exceptions module with the right exception classes
    mock_tos.exceptions = MagicMock()
    mock_tos.exceptions.TosClientError = TosClientError
    mock_tos.exceptions.TosServerError = TosServerError

    mocker.patch.dict("sys.modules", {"tos": mock_tos})

    # Should raise TosServerError
    with pytest.raises(TosServerError):
        await volc_config.do_check()


@pytest.mark.asyncio
async def test_volc_cfg_do_check_unknown_error(mocker, volc_config):
    """Test VolcCfg.do_check() handles unknown errors."""
    mock_client = MagicMock()
    mock_client.list_buckets.side_effect = RuntimeError("Unexpected error")

    mocker.patch("tos.TosClientV2", return_value=mock_client)

    # Should raise RuntimeError
    with pytest.raises(RuntimeError):
        await volc_config.do_check()


# ============================================================================
# AgentCfg Tests
# ============================================================================


@pytest.mark.asyncio
async def test_agent_cfg_do_check_success(mocker, agent_config):
    """Test AgentCfg.do_check() successfully validates API key."""
    # Mock Agent
    mock_agent = MagicMock()
    mock_agent.run = mocker.AsyncMock(return_value="success")

    mock_veadk = MagicMock()
    mock_veadk.Agent.return_value = mock_agent

    mocker.patch.dict("sys.modules", {"veadk": mock_veadk})

    # Call do_check
    await agent_config.do_check()

    # Verify Agent was created and run was called
    mock_veadk.Agent.assert_called_once()
    mock_agent.run.assert_called_once_with("echo what i said.")


@pytest.mark.asyncio
async def test_agent_cfg_do_check_empty_api_key(agent_config):
    """Test AgentCfg.do_check() returns None when API key is empty."""
    agent_config.api_key = EncryptedSecretStr("")

    result = await agent_config.do_check()

    assert result is None


@pytest.mark.asyncio
async def test_agent_cfg_do_check_agent_creation_error(mocker, agent_config):
    """Test AgentCfg.do_check() handles errors during Agent creation."""
    mock_veadk = MagicMock()
    mock_veadk.Agent.side_effect = ValueError("Invalid API key")

    mocker.patch.dict("sys.modules", {"veadk": mock_veadk})

    # Should raise ValueError wrapped in ValueError
    with pytest.raises(ValueError, match="API key check failed"):
        await agent_config.do_check()


@pytest.mark.asyncio
async def test_agent_cfg_do_check_agent_run_error(mocker, agent_config):
    """Test AgentCfg.do_check() handles errors during agent.run()."""
    mock_agent = MagicMock()
    mock_agent.run = mocker.AsyncMock(side_effect=RuntimeError("Agent execution error"))

    mock_veadk = MagicMock()
    mock_veadk.Agent.return_value = mock_agent

    mocker.patch.dict("sys.modules", {"veadk": mock_veadk})

    # Should raise ValueError
    with pytest.raises(ValueError, match="API key check failed"):
        await agent_config.do_check()
