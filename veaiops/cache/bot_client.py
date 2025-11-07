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

from aiocache import Cache, cached
from lark_oapi import Client

from veaiops.schema.types import ChannelType
from veaiops.utils.crypto import decrypt_secret_value
from veaiops.utils.log import logger


@cached(
    ttl=60,
    cache=Cache.MEMORY,
    key_builder=lambda f, bot_id, channel, secret=None: f"ak:{channel}_{bot_id}",
    skip_cache_func=lambda r: r is None,
)
async def get_bot_client(bot_id: str, channel: ChannelType, secret: Optional[str] = None) -> Optional[Client]:
    """Fetch the bot's client.

    Args:
        bot_id (str): The ID of the bot.
        channel (ChannelType): The channel type of the bot.
        secret (str): The secret of the bot.

    Returns:
        client: The client for the bot.
    """
    from veaiops.schema.documents import Bot

    logger.info(f"Fetching AK for bot_id={bot_id}...")

    if secret is None:
        bot = await Bot.find_one(Bot.bot_id == bot_id, Bot.channel == channel)
        if not bot:
            logger.error(f"Bot with bot_id {bot_id} not found.")
            return None
        # Decrypt the secret
        secret = decrypt_secret_value(bot.secret)

    if channel == ChannelType.Lark:
        import lark_oapi

        client = lark_oapi.Client.builder().app_id(bot_id).app_secret(secret).build()
    else:
        logger.error(f"Unsupported channel type: {channel}")
        return None

    return client
