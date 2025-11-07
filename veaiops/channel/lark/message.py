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

import base64
import uuid
from io import BytesIO
from typing import Any, Dict, Literal, Optional

import json_repair
from lark_oapi import Client
from lark_oapi.api.im.v1 import (
    CreateMessageRequest,
    CreateMessageRequestBody,
    CreateMessageResponse,
    GetMessageRequest,
    GetMessageResourceRequest,
    GetMessageResourceResponse,
    GetMessageResponse,
    MergeForwardMessageRequest,
    MergeForwardMessageRequestBody,
    MergeForwardMessageResponse,
    ReplyMessageRequest,
    ReplyMessageRequestBody,
    ReplyMessageResponse,
)
from lark_oapi.core.token import TokenManager
from PIL import Image
from pydantic import BaseModel
from tenacity import retry, stop_after_attempt, wait_exponential

from veaiops.cache import get_bot_client
from veaiops.schema.types import ChannelType
from veaiops.utils.client import AsyncClientWithCtx
from veaiops.utils.log import logger


class CardData(BaseModel):
    """Lark card data.

    Attributes:
        template_id: The template id of the card.
        template_variable: The template variable of the card.
    """

    template_id: str
    template_variable: Any


class Card(BaseModel):
    """Lark card.

    Attributes:
        data: The card data.
        type: The card type, should be "template".
    """

    data: CardData
    type: str = "template"


class WebEventToast(BaseModel):
    """Lark web event toast."""

    type: str = "info"
    content: str


class WebEventResp(BaseModel, extra="allow"):
    """WebEvent Response for Lark."""

    toast: Optional[WebEventToast]
    card: Optional[Card]


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10),
    retry_error_callback=lambda retry_state: None,
)
async def get_lark_msg(bot_id: str, msg_id: str) -> Dict[str, Any]:
    """Fetch a Lark message by its ID.

    Args:
        bot_id (str): The ID of the bot.
        msg_id (str): The ID of the message to fetch.

    Returns:
        Dict[str, Any]: The message data.
    """
    cli = await get_bot_client(bot_id=bot_id, channel=ChannelType.Lark)
    if not cli:
        logger.error(f"bot_id: {bot_id} client for lark not exist, can not fetch lark message")
        raise ValueError("Lark client not found")

    request: GetMessageRequest = GetMessageRequest.builder().message_id(msg_id).user_id_type("open_id").build()

    response: GetMessageResponse = await cli.im.v1.message.aget(request)

    if not response.success():
        logger.error(
            f"client.im.v1.message.get failed, code: {response.code},",
            f"msg: {response.msg}, log_id: {response.get_log_id()}, resp: \n{response.raw.content}",
        )
        raise Exception(f"client.im.v1.message.get failed, msg: {response.msg}, {response.raw.content} ")

    return json_repair.loads(response.raw.content)["data"]


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10),
    retry_error_callback=lambda retry_state: None,
)
async def get_img_base64(bot_id: str, image_key: str, message_id: str, file_type: Literal["file", "image"]) -> str:
    """Fetch image resource as base64 string.

    Args:
        bot_id (str): The ID of the bot.
        image_key (str): The key of the image resource.
        message_id (str): The ID of the message containing the image.
        file_type (Literal["file", "image"]): The type of the file.

    Returns:
        str: The base64-encoded image string.
    """
    cli = await get_bot_client(bot_id=bot_id, channel=ChannelType.Lark)
    if not cli:
        logger.error(f"bot_id: {bot_id} client for lark not exist, can not fetch lark image")
        raise ValueError("Lark client not found")

    request: GetMessageResourceRequest = (
        GetMessageResourceRequest.builder().message_id(message_id).file_key(image_key).type(file_type).build()
    )

    response: GetMessageResourceResponse = await cli.im.v1.message_resource.aget(request)

    if not response.success():
        logger.error(
            f"client.im.v1.message_resource.get failed, code: {response.code},",
            f"msg: {response.msg}, log_id: {response.get_log_id()}, resp: \n{response.raw.content}",
        )
        raise Exception(f"client.im.v1.message_resource.get failed, msg: {response.msg}, {response.raw.content} ")

    image_bytes = response.raw.content
    with Image.open(BytesIO(image_bytes)) as img:
        # Multi-frame formats: MPO, GIF, TIFF (only use the first frame)
        if getattr(img, "is_animated", False):
            img.seek(0)

        img = img.convert("RGB")

        img.format = "JPEG"
        img_format = img.format
        original_width, original_height = img.size
        max_dimension = 1600
        # 0. If the original file is already small enough, return directly
        if original_width > max_dimension or original_height > max_dimension:
            scale = max_dimension / max(original_width, original_height)
            new_height = int(original_height * scale)
            new_width = int(original_width * scale)

            # Resize using high-quality LANCZOS algorithm
            img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)

        buffer = BytesIO()
        img.save(buffer, format=img_format, quality=80, optimize=True)
        buffer.seek(0)

    image64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

    return image64


async def reply_message(cli: Client, card_content: str, msg_id: str) -> str:
    """Reply a Lark Message.

    Args:
        cli (Client): Lark Client.
        card_content (str): Card content in json string.
        msg_id (str): The ID of the message to reply.

    Raises:
        Exception: If the reply fails.

    Returns:
        str: The ID of the replied message.
    """
    request: ReplyMessageRequest = (
        ReplyMessageRequest.builder()
        .message_id(msg_id)
        .request_body(
            ReplyMessageRequestBody.builder()
            .content(card_content)
            .msg_type("interactive")
            .reply_in_thread(False)
            .uuid(str(uuid.uuid4()))
            .build()
        )
        .build()
    )

    response: ReplyMessageResponse = await cli.im.v1.message.areply(request)

    logger.info(f"send lark message response: {response}")

    if not response.success() or response.data is None:
        logger.error(f"Reply Message failed, code: {response.code}, error: {response.error}")
        raise Exception(f"Reply Message failed, code: {response.code}, error: {response.error}")

    return response.data.message_id


async def forward_message(
    cli: Client,
    msg_id: str,
    receive_id: str,
) -> str:
    """Forward a Lark message.

    Args:
        cli (Client): Lark Client.
        msg_id (str): The ID of the message to forward.
        receive_id (str): The ID of the user or chat to forward the message to.

    Raises:
        Exception: If the forwarding fails.

    Returns:
        str: The ID of the forwarded message.
    """
    logger.info(f"send lark message to {receive_id}")

    request: MergeForwardMessageRequest = (
        MergeForwardMessageRequest.builder()
        .receive_id_type("chat_id")
        .request_body(MergeForwardMessageRequestBody.builder().receive_id(receive_id).message_id_list([msg_id]).build())
        .uuid(str(uuid.uuid4()))
        .build()
    )

    response: MergeForwardMessageResponse = cli.im.v1.message.merge_forward(request)

    if not response.success():
        raise Exception(f"Reply Message failed, code: {response.code}, error: {response.error}")

    return response.data.message.message_id


async def reply_ephemeral_message(cli: Client, card_content: dict, chat_id: str, user_id: str) -> Optional[str]:
    """Send a Lark message card by template card.

    Args:
        cli (Client): Lark Client.
        card_content (dict): Card content in json string.
        chat_id (str): The chat ID to send the message to.
        user_id (str): The user ID to send, make sure user_id in the group chat.

    Returns:
        str: The output message id.
    """
    ak = TokenManager.get_self_tenant_token(cli._config)

    async with AsyncClientWithCtx() as client:
        resp = await client.post(
            url="https://open.larkoffice.com/open-apis/ephemeral/v1/send",
            headers={
                "Authorization": f"Bearer {ak}",
                "Content-Type": "application/json; charset=utf-8",
            },
            json={
                "msg_type": "interactive",
                "chat_id": chat_id,
                "open_id": user_id,
                "card": card_content,
                "uuid": str(uuid.uuid4()),
            },
        )
        if not resp.is_success:
            logger.error(f"Failed to fetch bot info from: {resp.text}")
            resp.raise_for_status()
    return resp.json()["data"]["message_id"]


async def delete_ephemeral_message(cli: Client, message_id: str) -> Optional[str]:
    """Delete a Lark message card by template card.

    Args:
        cli (Client): The cli of bot Client.
        message_id (str): The message ID to delete.

    Returns:
        str: The output message.
    """
    ak = TokenManager.get_self_tenant_token(cli._config)

    async with AsyncClientWithCtx() as client:
        resp = await client.post(
            url="https://open.larkoffice.com/open-apis/ephemeral/v1/delete",
            headers={
                "Authorization": f"Bearer {ak}",
                "Content-Type": "application/json; charset=utf-8",
            },
            json={"message_id": message_id},
        )
        if not resp.is_success:
            logger.error(f"Failed to delete ephemeral message: {resp.text}")
            resp.raise_for_status()
    logger.info(f"delete ephemeral message {message_id} response: {resp.json()}")
    return resp.json()["msg"]


async def send_message(cli: Client, card_content: str, chat_id: str) -> str:
    """Send a Lark message card by template card.

    Args:
        cli (Client): Lark Client.
        card_content (str): Card content in json string.
        chat_id (str): The ID of group chat to send the message to.

    Raises:
        Exception: If the reply fails.

    Returns:
        str: The ID of the replied message.
    """
    logger.info(f"send lark message to {chat_id} with {card_content}")
    request: CreateMessageRequest = (
        CreateMessageRequest.builder()
        .receive_id_type("chat_id")
        .request_body(
            CreateMessageRequestBody.builder()
            .receive_id(chat_id)
            .msg_type("interactive")
            .content(card_content)
            .uuid(str(uuid.uuid4()))
            .build()
        )
        .build()
    )
    response: CreateMessageResponse = await cli.im.v1.message.acreate(request)
    logger.info(f"send lark message response: {response}")
    if not response.success() or response.data is None:
        logger.error(f"Send Message failed, code: {response.code}, error: {response.error}")
        raise Exception(f"Send Message failed, code: {response.code}, error: {response.error}")
    logger.debug(f"send lark message success, message_id: {response.data.message_id}")
    return response.data.message_id
