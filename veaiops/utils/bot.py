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
import json

from lark_oapi.api.im.v1 import ListChatRequest, ListChatResponse

from veaiops.cache import get_bot_client
from veaiops.schema.documents import Bot, Chat
from veaiops.schema.types import ChannelType
from veaiops.utils.crypto import decrypt_secret_value
from veaiops.utils.log import logger


async def refresh_lark_bot_group_chat(bot_id: str, channel: ChannelType = ChannelType.Lark):
    """Refresh the group chat list for a Lark bot.

    Args:
        bot_id (str): The ID of the bot.
        channel (ChannelType, optional): The channel type. Defaults to ChannelType.Lark.
    """
    items = []
    page_token = ""
    bot = await Bot.find_one(Bot.bot_id == bot_id, Bot.channel == channel)
    if not bot:
        logger.warning(f"Cannot reload bot group chat. Bot with id {bot_id} and channel {channel} not found.")
        return
    # Decrypt the secret
    secret_value = decrypt_secret_value(bot.secret)

    cli = await get_bot_client(bot_id=bot_id, channel=channel, secret=secret_value)
    if not cli:
        logger.error(f"bot_id: {bot_id} client for lark not exist, can not reload group chat")
        return

    while True:
        request: ListChatRequest = (
            ListChatRequest.builder().sort_type("ByCreateTimeAsc").page_size(100).page_token(page_token).build()
        )
        resp: ListChatResponse = await cli.im.v1.chat.alist(request)

        if not resp.success():
            logger.error(f"Failed to fetch chat list from channel={channel}: {resp.msg}, log_id={resp.get_log_id()}")
            raise Exception(f"Failed to fetch chat list from channel={channel}: {resp.msg}, log_id={resp.get_log_id()}")

        data = json.loads(resp.raw.content)["data"]
        chat_items = data.get("items", [])
        items.extend(chat_items)
        if data["has_more"]:
            logger.warning("More one-on-one chats exist, pagination not implemented yet.")
            page_token = data.get("page_token", "")
        else:
            break

    logger.info(f"Fetched {len(items)} one-on-one chats for bot_id={bot_id}")

    # logic delete not exist chat_ids
    exist_chat_id_list = [i["chat_id"] for i in items]

    for item in items:
        chat = await Chat.find_one({"bot_id": bot_id, "chat_id": item["chat_id"], "channel": channel})

        if not chat:
            chat = Chat(
                channel=channel,
                bot_id=bot_id,
                chat_id=item["chat_id"],
                name=item["name"],
            )
            await chat.insert()
        else:
            if not chat.chat_link:
                chat.chat_link = await chat.set_chat_link()
            chat.name = item["name"]
            await chat.save()

        logger.info(f"Update chat group name successfully for bot={bot_id} chat_id={item['chat_id']}")
    if exist_chat_id_list:
        query = {
            "bot_id": bot_id,
            "channel": channel,
            "chat_id": {"$nin": exist_chat_id_list},
        }
        update_data = {
            "$set": {
                "is_active": False,
            }
        }
        await Chat.find(query).update_many(update_data)


async def reload_bot_group_chat(bot_id: str, channel: ChannelType):
    """Reload group chat sessions for the bot.

    Args:
        bot_id (str): Bot ID
        channel (ChannelType): Channel Type

    Raises:
        NotImplementedError: If the channel type is not supported
    """
    bot = await Bot.find_one(Bot.bot_id == bot_id, Bot.channel == channel)
    if not bot:
        logger.warning(f"Cannot reload bot group chat. Bot with id {bot_id} and channel {channel} not found.")
        return
    match bot.channel:
        case ChannelType.Lark:
            await refresh_lark_bot_group_chat(bot_id=bot.bot_id, channel=bot.channel)

        case _:
            raise NotImplementedError(f"One-on-one chat reload not implemented for channel {bot.channel}")


async def check_bot_configuration(app_id: str, app_secret: str, channel: ChannelType = ChannelType.Lark) -> None:
    """Check bot configuration if necessary."""
    match channel:
        case ChannelType.Lark:
            import lark_oapi
            from lark_oapi.api.application.v6 import ListScopeRequest

            cli = lark_oapi.Client.builder().app_id(app_id).app_secret(app_secret).build()
            request = ListScopeRequest.builder().build()
            response = cli.application.v6.scope.list(request)
            if not response.success():
                logger.warning(f"list permission denied for bot {app_id} on {channel}.")
                raise PermissionError(f"list permission denied for bot {app_id} on {channel}.")
            if response.data is None or len(response.data.scopes) == 0:
                logger.warning(
                    f"Bot Permission is not set for bot {app_id} on {channel}, "
                    f"You should Set Permissions on Lark Open Platform."
                )
                raise PermissionError(
                    f"Bot Permission is not set for bot {app_id} on {channel}, "
                    f"You should Set Permissions on Lark Open Platform."
                )
        case _:
            raise NotImplementedError(f"bot_configuration_check for channel {channel} is not implemented.")
