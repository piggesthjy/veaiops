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

from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest

from veaiops.agents.chatops.tools.linkreader_tools import (
    fetch_lark_doc,
    fetch_lark_meta,
    fetch_url,
    link_reader,
    read_from_lark_url,
    read_from_url,
)
from veaiops.schema.models.chatops import LinkContent

# ==================== Tests for fetch_url ====================


@pytest.mark.asyncio
@patch("veaiops.agents.chatops.tools.linkreader_tools.AsyncClientWithCtx")
async def test_fetch_url_success(mock_client_ctx):
    """Test successful URL fetch."""
    # Arrange
    url = "https://example.com/article"
    api_key = "test_api_key"

    mock_response = MagicMock()
    mock_response.json.return_value = {
        "data": {
            "ark_web_data_list": [
                {
                    "content": "Article content here",
                    "title": "Example Article",
                    "url": url,
                }
            ]
        }
    }
    mock_response.raise_for_status = MagicMock()

    mock_client = AsyncMock()
    mock_client.post = AsyncMock(return_value=mock_response)
    mock_client_ctx.return_value.__aenter__.return_value = mock_client

    # Act
    result = await fetch_url(url=url, api_key=api_key)

    # Assert
    assert result["data"] == "Article content here"
    assert result["file_name"] == "Example Article"
    assert result["url"] == url
    mock_client.post.assert_called_once()
    call_args = mock_client.post.call_args
    assert call_args[0][0] == "https://ark.cn-beijing.volces.com/api/v3/tools/execute"
    assert call_args[1]["headers"]["Authorization"] == f"Bearer {api_key}"


@pytest.mark.asyncio
@patch("veaiops.agents.chatops.tools.linkreader_tools.AsyncClientWithCtx")
async def test_fetch_url_http_error(mock_client_ctx):
    """Test URL fetch with various edge cases."""
    # Test 1: HTTP error
    url = "https://example.com/article"
    api_key = "test_api_key"

    mock_client = AsyncMock()
    mock_client.post = AsyncMock(side_effect=httpx.HTTPError("Connection failed"))
    mock_client_ctx.return_value.__aenter__.return_value = mock_client

    result = await fetch_url(url=url, api_key=api_key)
    assert "error" in result
    assert "Connection failed" in result["error"]

    # Test 2: Empty title
    url = "https://example.com/path/to/article"
    mock_response = MagicMock()
    mock_response.json.return_value = {
        "data": {
            "ark_web_data_list": [
                {
                    "content": "Article content",
                    "title": "",
                    "url": url,
                }
            ]
        }
    }
    mock_response.raise_for_status = MagicMock()

    mock_client = AsyncMock()
    mock_client.post = AsyncMock(return_value=mock_response)
    mock_client_ctx.return_value.__aenter__.return_value = mock_client

    result = await fetch_url(url=url, api_key=api_key)
    assert result["data"] == "Article content"
    assert "example_com" in result["file_name"]

    # Test 3: None title
    url = "https://test.example.com/page"
    mock_response = MagicMock()
    mock_response.json.return_value = {
        "data": {
            "ark_web_data_list": [
                {
                    "content": "Page content",
                    "title": None,
                    "url": url,
                }
            ]
        }
    }
    mock_response.raise_for_status = MagicMock()

    mock_client = AsyncMock()
    mock_client.post = AsyncMock(return_value=mock_response)
    mock_client_ctx.return_value.__aenter__.return_value = mock_client

    result = await fetch_url(url=url, api_key=api_key)
    assert result["data"] == "Page content"
    assert "test_example_com" in result["file_name"]


# ==================== Tests for fetch_lark_meta ====================


@pytest.mark.asyncio
@patch("veaiops.agents.chatops.tools.linkreader_tools.get_bot_client")
async def test_fetch_lark_meta_success(mock_get_bot_client):
    """Test successful Lark metadata fetch."""
    # Arrange
    doc_token = "test_doc_token"
    doc_type = "docx"
    bot_id = "test_bot_id"

    mock_response = MagicMock()
    mock_response.success.return_value = True
    mock_response.raw.content = (
        '{"data": {"metas": [{"doc_type": "docx", "title": "Test Doc", '
        '"url": "https://feishu.cn/doc", "doc_token": "test_doc_token"}]}}'
    )

    mock_client = MagicMock()
    mock_client.drive.v1.meta.abatch_query = AsyncMock(return_value=mock_response)
    mock_get_bot_client.return_value = mock_client

    # Act
    result = await fetch_lark_meta(doc_token=doc_token, doc_type=doc_type, bot_id=bot_id)

    # Assert
    assert result["doc_type"] == "docx"
    assert result["title"] == "Test Doc"
    assert result["url"] == "https://feishu.cn/doc"
    assert result["doc_token"] == "test_doc_token"
    mock_get_bot_client.assert_called_once()


@pytest.mark.asyncio
@patch("veaiops.agents.chatops.tools.linkreader_tools.get_bot_client")
async def test_fetch_lark_meta_failure(mock_get_bot_client):
    """Test Lark metadata fetch failure."""
    # Arrange
    doc_token = "test_doc_token"
    doc_type = "docx"
    bot_id = "test_bot_id"

    mock_response = MagicMock()
    mock_response.success.return_value = False
    mock_response.code = 403
    mock_response.msg = "Permission denied"
    mock_response.get_log_id.return_value = "log_123"
    mock_response.raw.content = b"Error content"

    mock_client = MagicMock()
    mock_client.drive.v1.meta.abatch_query = AsyncMock(return_value=mock_response)
    mock_get_bot_client.return_value = mock_client

    # Act & Assert
    with pytest.raises(Exception) as exc_info:
        await fetch_lark_meta(doc_token=doc_token, doc_type=doc_type, bot_id=bot_id)

    assert "Failed to fetch lark doc meta" in str(exc_info.value)
    assert "Permission denied" in str(exc_info.value)


# ==================== Tests for fetch_lark_doc ====================


@pytest.mark.asyncio
@patch("veaiops.agents.chatops.tools.linkreader_tools.get_bot_client")
async def test_fetch_lark_doc_success(mock_get_bot_client):
    """Test successful Lark document content fetch."""
    # Arrange
    doc_token = "test_doc_token"
    doc_type = "docx"
    bot_id = "test_bot_id"

    mock_response = MagicMock()
    mock_response.success.return_value = True
    mock_response.raw.content = '{"data": {"content": "# Document Content\\nThis is the document."}}'

    mock_client = MagicMock()
    mock_client.docs.v1.content.aget = AsyncMock(return_value=mock_response)
    mock_get_bot_client.return_value = mock_client

    # Act
    result = await fetch_lark_doc(doc_token=doc_token, doc_type=doc_type, bot_id=bot_id)

    # Assert
    assert result == "# Document Content\nThis is the document."
    mock_get_bot_client.assert_called_once()


@pytest.mark.asyncio
@patch("veaiops.agents.chatops.tools.linkreader_tools.get_bot_client")
async def test_fetch_lark_doc_failure(mock_get_bot_client):
    """Test Lark document fetch with error response."""
    # Arrange
    doc_token = "test_doc_token"
    doc_type = "docx"
    bot_id = "test_bot_id"

    mock_response = MagicMock()
    mock_response.success.return_value = False
    mock_response.code = 404
    mock_response.msg = "Document not found"
    mock_response.get_log_id.return_value = "log_456"
    mock_response.raw.content = '{"data": {"content": ""}}'

    mock_client = MagicMock()
    mock_client.docs.v1.content.aget = AsyncMock(return_value=mock_response)
    mock_get_bot_client.return_value = mock_client

    # Act
    result = await fetch_lark_doc(doc_token=doc_token, doc_type=doc_type, bot_id=bot_id)

    # Assert
    assert result == ""


# ==================== Tests for read_from_lark_url ====================


@pytest.mark.asyncio
@patch("veaiops.agents.chatops.tools.linkreader_tools.fetch_lark_doc")
@patch("veaiops.agents.chatops.tools.linkreader_tools.fetch_lark_meta")
async def test_read_from_lark_url_success(mock_fetch_meta, mock_fetch_doc):
    """Test successful reading from Lark URL."""
    # Arrange
    url = "https://feishu.cn/docx/test_token"
    bot_id = "test_bot"

    mock_fetch_meta.return_value = {
        "doc_type": "docx",
        "title": "Test Document",
        "url": "https://feishu.cn/docx/test_token",
        "doc_token": "test_token",
    }
    mock_fetch_doc.return_value = "Document content here"

    # Act
    result = await read_from_lark_url(url=url, bot_id=bot_id)

    # Assert
    assert isinstance(result, LinkContent)
    assert result.url == "https://feishu.cn/docx/test_token"
    assert result.title == "Test Document"
    assert result.text == "Document content here"
    mock_fetch_meta.assert_called_once_with(doc_token="test_token", doc_type="docx", bot_id=bot_id)
    mock_fetch_doc.assert_called_once_with(doc_token="test_token", doc_type="docx", bot_id=bot_id)


@pytest.mark.asyncio
async def test_read_from_lark_url_invalid_url():
    """Test reading from invalid/empty Lark URLs."""
    # Test 1: Invalid URL
    url = "https://feishu.cn/invalid"
    bot_id = "test_bot"

    result = await read_from_lark_url(url=url, bot_id=bot_id)
    assert isinstance(result, LinkContent)
    assert result.url == url
    assert result.title is None
    assert result.text is None

    # Test 2: Empty path
    url = "https://feishu.cn/"
    result = await read_from_lark_url(url=url, bot_id=bot_id)
    assert isinstance(result, LinkContent)
    assert result.url == url


# ==================== Tests for read_from_url ====================


@pytest.mark.asyncio
@patch("veaiops.agents.chatops.tools.linkreader_tools.fetch_url")
async def test_read_from_url_success(mock_fetch_url):
    """Test successful reading from general URL."""
    # Arrange
    url = "https://example.com/article"
    api_key = "test_api_key"

    mock_fetch_url.return_value = {
        "data": "Article text content",
        "file_name": "Example Article",
        "url": url,
    }

    # Act
    result = await read_from_url(url=url, api_key=api_key)

    # Assert
    assert isinstance(result, LinkContent)
    assert result.url == url
    assert result.title == "Example Article"
    assert result.text == "Article text content"
    mock_fetch_url.assert_called_once_with(url=url, api_key=api_key)


@pytest.mark.asyncio
@patch("veaiops.agents.chatops.tools.linkreader_tools.fetch_url")
async def test_read_from_url_invalid_response(mock_fetch_url):
    """Test reading from URL with various error cases."""
    # Test 1: Invalid response (no error field)
    url = "https://example.com/article"
    api_key = "test_api_key"

    mock_fetch_url.return_value = {"error": "Failed to fetch"}

    result = await read_from_url(url=url, api_key=api_key)
    assert isinstance(result, LinkContent)
    assert result.url == url
    assert result.title is None
    assert result.text is None

    # Test 2: Missing fields
    mock_fetch_url.return_value = {
        "data": "Content",
    }

    result = await read_from_url(url=url, api_key=api_key)
    assert isinstance(result, LinkContent)
    assert result.url == url
    assert result.title is None
    assert result.text is None

    # Test 3: Non-dict response
    mock_fetch_url.return_value = "Invalid response"

    result = await read_from_url(url=url, api_key=api_key)
    assert isinstance(result, LinkContent)
    assert result.url == url
    assert result.title is None
    assert result.text is None


# ==================== Tests for link_reader ====================


@pytest.mark.asyncio
async def test_link_reader_no_urls():
    """Test link_reader with text containing no URLs."""
    # Arrange
    text = "This is just plain text without any links."

    # Act
    result = await link_reader(text=text)

    # Assert
    assert result is None


@pytest.mark.asyncio
@patch("veaiops.agents.chatops.tools.linkreader_tools.read_from_url")
async def test_link_reader_single_external_url(mock_read_from_url):
    """Test link_reader with single external URL."""
    # Arrange
    text = "Check out this article: https://example.com/article"

    mock_read_from_url.return_value = LinkContent(
        url="https://example.com/article",
        title="Article Title",
        text="Article content",
    )

    # Act
    result = await link_reader(text=text, agent_api_key="test_api_key")

    # Assert
    assert result is not None
    assert len(result) == 1
    assert result[0].url == "https://example.com/article"
    assert result[0].title == "Article Title"
    mock_read_from_url.assert_called_once()


@pytest.mark.asyncio
@patch("veaiops.agents.chatops.tools.linkreader_tools.read_from_lark_url")
async def test_link_reader_lark_url_larkoffice(mock_read_from_lark):
    """Test link_reader with different Lark URL formats."""
    # Test 1: Feishu URL
    text = "See this doc: https://example.feishu.cn/docx/test_token"

    mock_read_from_lark.return_value = LinkContent(
        url="https://example.feishu.cn/docx/test_token",
        title="Lark Document",
        text="Document content",
    )

    result = await link_reader(text=text, bot_id="test_bot_id")
    assert result is not None
    assert len(result) == 1
    assert result[0].title == "Lark Document"
    mock_read_from_lark.assert_called_once()

    # Test 2: Larkoffice URL
    mock_read_from_lark.reset_mock()
    text = "Check: https://company.larkoffice.com/docs/test"

    mock_read_from_lark.return_value = LinkContent(
        url="https://company.larkoffice.com/docs/test",
        title="Office Doc",
        text="Doc content",
    )

    result = await link_reader(text=text, bot_id="test_bot_id")
    assert result is not None
    assert len(result) == 1
    assert result[0].title == "Office Doc"


@pytest.mark.asyncio
@patch("veaiops.agents.chatops.tools.linkreader_tools.read_from_url")
@patch("veaiops.agents.chatops.tools.linkreader_tools.read_from_lark_url")
async def test_link_reader_mixed_urls(mock_read_from_lark, mock_read_from_url):
    """Test link_reader with mixed Lark and external URLs."""
    # Arrange
    text = "Lark: https://example.feishu.cn/docx/token and external: https://example.com/page"

    mock_read_from_lark.return_value = LinkContent(
        url="https://example.feishu.cn/docx/token",
        title="Lark Doc",
        text="Lark content",
    )
    mock_read_from_url.return_value = LinkContent(
        url="https://example.com/page",
        title="External Page",
        text="External content",
    )

    # Act
    result = await link_reader(text=text, bot_id="test_bot_id", agent_api_key="test_api_key")

    # Assert
    assert result is not None
    assert len(result) == 2
    assert result[0].title == "Lark Doc"
    assert result[1].title == "External Page"
    mock_read_from_lark.assert_called_once()
    mock_read_from_url.assert_called_once()


@pytest.mark.asyncio
async def test_link_reader_missing_api_key():
    """Test link_reader with missing required parameters."""
    # Test 1: Missing bot_id for Lark URL
    text = "See: https://example.feishu.cn/docx/token"
    result = await link_reader(text=text)
    assert result is not None
    assert len(result) == 0

    # Test 2: Missing api_key for external URL
    text = "Check: https://example.com/article"
    result = await link_reader(text=text)
    assert result is not None
    assert len(result) == 0


@pytest.mark.asyncio
@patch("veaiops.agents.chatops.tools.linkreader_tools.read_from_lark_url")
async def test_link_reader_lark_with_kwargs(mock_read_from_lark):
    """Test link_reader with Lark URL using kwargs for bot_id."""
    # Arrange
    text = "Doc: https://example.feishu.cn/docx/token"

    mock_read_from_lark.return_value = LinkContent(
        url="https://example.feishu.cn/docx/token",
        title="Kwargs Doc",
        text="Content",
    )

    # Act
    result = await link_reader(
        text=text,
        bot_id="kwargs_bot_id",
    )

    # Assert
    assert result is not None
    assert len(result) == 1
    assert result[0].title == "Kwargs Doc"
    mock_read_from_lark.assert_called_once()


@pytest.mark.asyncio
async def test_link_reader_invalid_url_type():
    """Test link_reader with invalid URL type (not string)."""
    # Arrange - This tests the warning case for non-string URLs
    text = "https://example.com/valid"

    # Patch URLExtract to return a non-string
    with patch("veaiops.agents.chatops.tools.linkreader_tools.URLExtract") as mock_extractor_class:
        mock_extractor = MagicMock()
        mock_extractor.find_urls.return_value = [123]  # Invalid non-string URL
        mock_extractor_class.return_value = mock_extractor

        # Act
        result = await link_reader(text=text, agent_api_key="test_api_key")

        # Assert
        assert result is not None
        assert len(result) == 0  # Invalid URL type should be skipped


@pytest.mark.asyncio
@patch("veaiops.agents.chatops.tools.linkreader_tools.read_from_url")
async def test_link_reader_multiple_same_urls(mock_read_from_url):
    """Test link_reader with multiple instances of same URL (only_unique=True)."""
    # Arrange
    text = "URL1: https://example.com/page URL2: https://example.com/page"

    mock_read_from_url.return_value = LinkContent(
        url="https://example.com/page",
        title="Page",
        text="Content",
    )

    # Act
    result = await link_reader(text=text, agent_api_key="test_api_key")

    # Assert
    # URLExtract with only_unique=True should return only one URL
    assert result is not None
    mock_read_from_url.assert_called_once()


# ==================== Tests for LinkContent model ====================


def test_link_content_creation():
    """Test LinkContent creation with all fields."""
    # Arrange & Act
    link = LinkContent(
        url="https://example.com",
        title="Example",
        text="Content",
    )

    # Assert
    assert link.url == "https://example.com"
    assert link.title == "Example"
    assert link.text == "Content"


def test_link_content_creation_minimal():
    """Test LinkContent creation with only URL."""
    # Arrange & Act
    link = LinkContent(url="https://example.com")

    # Assert
    assert link.url == "https://example.com"
    assert link.title is None
    assert link.text is None


def test_link_content_creation_without_text():
    """Test LinkContent creation without text."""
    # Arrange & Act
    link = LinkContent(url="https://example.com", title="Title Only")

    # Assert
    assert link.url == "https://example.com"
    assert link.title == "Title Only"
    assert link.text is None
