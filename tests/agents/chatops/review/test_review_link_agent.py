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

from datetime import datetime
from unittest.mock import patch

import pytest

# fixture handles message creation
from veaiops.agents.chatops.review.review_link_agent import run_review_external_link


@pytest.mark.asyncio
async def test_run_review_external_link_no_urls(test_bot, test_messages):
    """Test review external link agent with message containing no URLs."""
    # Arrange
    test_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_no_links",
        content="这是一条没有链接的消息",
        msg_time=datetime(2025, 1, 15, 10, 0, 0),
    )

    # Act
    await run_review_external_link(bot=test_bot, msg=test_message)


@pytest.mark.asyncio
async def test_run_review_external_link_with_urls(test_bot, test_messages):
    """Test review external link agent with message containing URLs."""
    from veaiops.schema.documents.chatops.kb import VeKB
    from veaiops.schema.types import KBType

    # Create AutoDoc type VeKB for this test
    test_vekb = await VeKB(
        bot_id=test_bot.bot_id,
        channel=test_bot.channel,
        kb_type=KBType.AutoDoc,
        collection_name="test_collection",
        project="test_project",
        bucket_name="test_bucket",
    ).insert()

    # Arrange
    test_message = await test_messages(
        bot_id=test_bot.bot_id,
        chat_id="test_chat_with_links",
        content="请参考这个文档 https://example.com/docs 和 https://test.com/guide",
        msg_time=datetime(2025, 1, 15, 10, 0, 0),
    )

    # Mock add_from_text to return an async function
    async def mock_add_from_text(*args, **kwargs):
        return True

    # Mock link_reader to return empty list (no links extracted)
    async def mock_link_reader(*args, **kwargs):
        return []

    with patch(
        "veaiops.agents.chatops.review.review_link_agent.link_reader",
        side_effect=mock_link_reader,
    ):
        with patch("veaiops.agents.chatops.review.review_link_agent.VeAIOpsKBManager") as mock_kb_manager:
            mock_kb_instance = mock_kb_manager.return_value
            mock_kb_instance.add_from_text = mock_add_from_text

            # Act
            await run_review_external_link(bot=test_bot, msg=test_message)

    # Cleanup
    await test_vekb.delete()


@pytest.mark.asyncio
async def test_run_review_external_link_url_extraction():
    """Test that URLs are properly extracted from messages."""
    # Arrange
    from urlextract import URLExtract

    extractor = URLExtract()
    test_content = "Check out https://example.com and https://test.org/path?query=1"

    # Act
    urls = extractor.find_urls(text=test_content, only_unique=True)

    # Assert
    assert len(urls) >= 2
    assert any("example.com" in url for url in urls)
    assert any("test.org" in url for url in urls)
