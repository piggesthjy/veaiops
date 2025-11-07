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


import asyncio
import json
from typing import List, Optional
from urllib.parse import urlparse

import httpx
import tldextract
from google.adk.tools import ToolContext
from lark_oapi.api.docs.v1 import GetContentRequest, GetContentResponse
from lark_oapi.api.drive.v1 import BatchQueryMetaRequest, BatchQueryMetaResponse, MetaRequest, RequestDoc
from tenacity import retry, stop_after_attempt, wait_exponential
from urlextract import URLExtract

from veaiops.cache import get_bot_client
from veaiops.schema.models.chatops import LinkContent
from veaiops.schema.types import ChannelType
from veaiops.utils.client import AsyncClientWithCtx
from veaiops.utils.log import logger


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=10))
async def fetch_url(url: str, api_key: str) -> dict:
    """Fetch content from a URL using the specified engine.

    Args:
        url (str): The URL to fetch content from.
        api_key (str): The API key for authentication.

    Raises:
        NotImplementedError: If the specified engine is not supported.

    Returns:
        dict: The fetched content from the URL.
    """
    endpoint = "https://ark.cn-beijing.volces.com/api/v3/tools/execute"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "action_name": "LinkReader",
        "tool_name": "LinkReader",
        "parameters": {"url_list": [url]},
    }

    try:
        async with AsyncClientWithCtx() as client:
            response = await client.post(endpoint, headers=headers, json=payload)
            response.raise_for_status()  # Raise an exception for HTTP errors
            data_object = response.json().get("data", {}).get("ark_web_data_list")[0]

        data = data_object["content"]
        file_name = data_object["title"]
        if not file_name:
            parsed_url = urlparse(url)
            file_name = parsed_url.netloc.replace(".", "_") + parsed_url.path.replace("/", "__")
        url = data_object["url"]
    except httpx.HTTPError as e:
        logger.error(f"Error executing tool LinkReader.LinkReader: {str(e)}")
        return {"error": str(e)}

    return {"data": data, "file_name": file_name, "url": url}


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10),
    reraise=True,
)
async def fetch_lark_meta(doc_token: str, doc_type: str, bot_id: str) -> dict:
    """Fetch metadata for a Lark document.

    Args:
        doc_token (str): The token of the document.
        doc_type (str): The type of the document.
        bot_id (str): The bot ID to use for fetching the document.

    Raises:
        ValueError: If no metadata is found for the given doc_token and doc_type.
        e: If an error occurs while fetching the metadata.

    Returns:
        dict: The metadata of the document.
    """
    cli = await get_bot_client(bot_id=bot_id, channel=ChannelType.Lark)

    if not cli:
        logger.error(f"bot_id: {bot_id} client for lark not exist, can not fetch lark doc meta")
        raise ValueError("Lark client not found")
    request: BatchQueryMetaRequest = (
        BatchQueryMetaRequest.builder()
        .user_id_type("open_id")
        .request_body(
            MetaRequest.builder()
            .request_docs([RequestDoc.builder().doc_token(doc_token).doc_type(doc_type).build()])
            .with_url(True)
            .build()
        )
        .build()
    )

    # 发起请求
    response: BatchQueryMetaResponse = await cli.drive.v1.meta.abatch_query(request)

    # 处理失败返回
    if not response.success():
        logger.error(
            f"client.drive.v1.meta.batch_query failed, code: {response.code}, msg: {response.msg}, ",
            f"log_id: {response.get_log_id()}, resp: \n{response.raw.content}",
        )
        raise Exception(f"Failed to fetch lark doc meta: {response.msg}")

    data_object = json.loads(response.raw.content)["data"]
    lark_meta = data_object["metas"][0]
    return lark_meta


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10),
)
async def fetch_lark_doc(doc_token: str, doc_type: str, bot_id: str) -> str:
    """Fetch content from a Lark document.

    Args:
        doc_token (str): The token of the document.
        doc_type (str): The type of the document.
        bot_id (str): The bot ID to use for fetching the document.

    Raises:
        e: If an error occurs while fetching the document.

    Returns:
        str: The content of the document.
    """
    cli = await get_bot_client(bot_id=bot_id, channel=ChannelType.Lark)
    if not cli:
        logger.error(f"bot_id: {bot_id} client for lark not exist, can not fetch lark doc")
        raise ValueError("Lark client not found")

    request: GetContentRequest = (
        GetContentRequest.builder().doc_token(doc_token).doc_type(doc_type).content_type("markdown").build()
    )

    response: GetContentResponse = await cli.docs.v1.content.aget(request)

    if not response.success():
        logger.error(
            f"client.docs.v1.content.get failed, code: {response.code}, ",
            f"msg: {response.msg}, log_id: {response.get_log_id()}, resp: \n{response.raw.content}",
        )

    data_object = json.loads(response.raw.content).get("data", {})
    return data_object["content"]


async def read_from_lark_url(url: str, bot_id: str) -> LinkContent:
    """Get lark url context.

    Args:
        url (str): Lark url
        bot_id (str): A bot reader

    Returns:
        str: Lark document context.
    """
    parsed_url = urlparse(url)
    parts = [p for p in parsed_url.path.split("/") if p]
    if len(parts) < 2:
        logger.error(f"Invalid Lark document URL: {url}")
        return LinkContent(url=url)

    doc_type = parts[0]
    doc_token = parts[1]
    metadata = await fetch_lark_meta(doc_token=doc_token, doc_type=doc_type, bot_id=bot_id)

    doc_type = metadata["doc_type"]
    doc_title = metadata["title"]
    url = metadata["url"]
    doc_token = metadata["doc_token"]

    data = await fetch_lark_doc(doc_token=doc_token, doc_type=doc_type, bot_id=bot_id)

    logger.info(f"Get lark doc success: url = {url}, bot = {bot_id}")

    return LinkContent(url=url, title=doc_title, text=data)


async def read_from_url(url: str, api_key: str) -> LinkContent:
    """Read context from general url.

    Args:
        url (str): Target url
        api_key (str): Volc Linkreader ark api key

    Returns:
        LinkContent: The content of the link.
    """
    url_data_obj = await fetch_url(url=url, api_key=api_key)

    if (
        not isinstance(url_data_obj, dict)
        or "data" not in url_data_obj
        or "file_name" not in url_data_obj
        or "url" not in url_data_obj
    ):
        logger.error(f"Fetch url data error: {url_data_obj}")
        return LinkContent(url=url)

    logger.info(f"Add url success: url = {url}")
    return LinkContent(url=url, title=url_data_obj["file_name"], text=url_data_obj["data"])


async def link_reader(text: str, tool_context: ToolContext = None, **kwargs) -> Optional[List[LinkContent]]:  # noqa
    """Read link context.

    Args:
        text (str): Message that contains a url.

    Returns:
        Optional[List[ExternalLinkReviewResult]]: A list of external link review results or None if no links are found.
    """
    extractor = URLExtract()
    urls = extractor.find_urls(text=text.replace("\\n", " "), only_unique=True)
    if not urls:
        logger.info("No external links found.")
        return None

    tasks = []
    for url in urls:
        logger.info(f"[Review Link Agent] Found URL: {url}")
        if isinstance(url, str):
            tld = tldextract.extract(url)
            if tld.domain in ["feishu", "larkoffice"] and tld.subdomain:
                BOT_ID = (
                    tool_context.state.get("BOT_ID")
                    if isinstance(tool_context, ToolContext)
                    else None or kwargs.get("bot_id")
                )
                if not BOT_ID:
                    logger.error("BOT_ID not found in tool context state with reading Lark document.")
                    continue
                logger.info(f"Adding lark link: {url}")
                tasks.append(read_from_lark_url(url=url, bot_id=BOT_ID))
            else:
                logger.info(f"Adding external link: {url}")
                AGENT_API_KEY = (
                    tool_context.state.get("AGENT_API_KEY")
                    if isinstance(tool_context, ToolContext)
                    else None or kwargs.get("agent_api_key")
                )
                if not AGENT_API_KEY:
                    logger.error("AGENT_API_KEY not found in tool context state with reading external link.")
                    continue
                tasks.append(read_from_url(url=url, api_key=AGENT_API_KEY))
        else:
            logger.warning(f"Invalid URL found: {url}")

    task_rets = await asyncio.gather(*tasks, return_exceptions=True)

    reader_results = []
    for task_ret, url in zip(task_rets, urls):
        if isinstance(task_ret, LinkContent):
            logger.info(f"Review external link {url} success.")
            reader_results.append(task_ret)
        elif isinstance(task_ret, Exception):
            logger.error(f"Error adding external link: {task_ret}")
            reader_results.append(LinkContent(url=url))
        else:
            reader_results.append(LinkContent(url=url))

    return reader_results
