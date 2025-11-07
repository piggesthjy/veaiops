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
from typing import Annotated, Optional

from beanie import Indexed, Insert, Replace, Update, before_event
from lark_oapi.core.token.manager import TokenManager
from pydantic import Field, SecretStr
from pymongo import IndexModel

from veaiops.cache import get_bot_client
from veaiops.schema.base.config import AgentCfg, VolcCfg
from veaiops.schema.documents.config.base import BaseConfigDocument, BaseDocument
from veaiops.schema.types import AttributeKey, ChannelType
from veaiops.utils.client import AsyncClientWithCtx
from veaiops.utils.crypto import decrypt_secret_value
from veaiops.utils.log import logger


class BotAttribute(BaseDocument):
    """BotAttribute data model."""

    channel: ChannelType = Field(..., description="Message source channel")
    bot_id: Annotated[str, Indexed()] = Field(..., description="BotID")

    name: AttributeKey = Field(..., description="Attribute name, for project, customer, product, etc.")
    value: str = Field(..., description="Attribute value")

    class Settings:
        """Create compound index for idempotence using bot_id + channel."""

        indexes = [
            IndexModel(["channel", "bot_id", "name", "value"], unique=True),
        ]
        name = "veaiops__config_bot_attribute"

    @before_event(Insert, Update, Replace)
    async def check_bot_exist(self):
        """Check if bot exists in database.

        Returns:
            None

        Raises:
            ValueError: If the bot is not found in the database.
        """
        bot = await Bot.find_one({"channel": self.channel, "bot_id": self.bot_id})
        if not bot:
            logger.warning(f"Bot {self.channel, self.bot_id} not found")
            raise ValueError(f"Bot {self.channel, self.bot_id} not found")


class Bot(BaseConfigDocument):
    """Bot data model."""

    channel: ChannelType  # Message source channel
    bot_id: Annotated[str, Indexed()]  # BotID
    open_id: Optional[str] = None  # OpenID, auto-generated from bot_id

    name: Optional[str] = "Unknown Bot"  # Bot name
    secret: SecretStr

    volc_cfg: VolcCfg = Field(default_factory=VolcCfg)
    agent_cfg: AgentCfg = Field(default_factory=AgentCfg)

    class Settings:
        """Create compound index for idempotence using bot_id + channel."""

        name = "veaiops__config_bot"
        indexes = [IndexModel(["bot_id", "channel"], unique=True)]

    @before_event(Insert, Replace)
    async def generate_open_id(self):
        """Auto-generate open_id based on bot_id if not provided."""
        match self.channel:
            case ChannelType.Lark:
                # Decrypt the secret
                secret_value = decrypt_secret_value(self.secret)

                cli = await get_bot_client(bot_id=self.bot_id, channel=ChannelType.Lark, secret=secret_value)
                if not cli:
                    logger.error(f"bot_id: {self.bot_id} client for lark not exist, can not generate open_id")
                    return

                ak = TokenManager.get_self_tenant_token(cli._config)

                async with AsyncClientWithCtx() as client:
                    resp = await client.post(
                        url="https://open.larkoffice.com/open-apis/bot/v3/info",
                        headers={
                            "Authorization": f"Bearer {ak}",
                            "Content-Type": "application/json; charset=utf-8",
                        },
                    )
                    if not resp.is_success:
                        logger.error(f"Failed to fetch bot info from channel={self.channel}: {resp.text}")
                        resp.raise_for_status()
                bot_detail = resp.json()["bot"]

                # Set bot details
                self.open_id = bot_detail.get("open_id", "")
                self.name = bot_detail.get("app_name", "Unknown Bot")
            case _:
                raise NotImplementedError(f"Auto-generating open_id for channel {self.channel} not implemented.")

    async def get_bot_attributes(self, name: AttributeKey) -> list[str]:
        """Query Bot attributes for given bot_id and tag_key.

        Args:
            name(AttributeKey): Project/Product/Customer, etc.

        Returns: list of BotAttribute
        """
        query_conditions = {"channel": self.channel, "bot_id": self.bot_id, "name": name}
        query = BotAttribute.find(query_conditions)
        attributes = await query.to_list()
        if len(attributes) == 0:
            return []
        logger.debug("bot attributes fetched", extra={"bot_id": self.bot_id, "name": name, "count": len(attributes)})
        values = []
        for attribute in attributes:
            values.append(attribute.value)
        return values

    async def add_attributes(self, name: AttributeKey, values: list[str]) -> bool:
        """Add attributes to given bot_id and tag_key.

        Args:
            name: AttributeKey
            values: list[str]
            name: AttributeKey
            values: list[str]

        Returns:
            if added successfully
        """
        if len(values) > 0:
            existing = await BotAttribute.find(
                {
                    "channel": self.channel,
                    "bot_id": self.bot_id,
                    "name": name,
                    "value": {"$in": values},
                }
            ).to_list()
            existing_values = {a.value for a in existing}
            new_values = [v for v in values if v not in existing_values]
            if new_values:
                await BotAttribute.insert_many(
                    [
                        BotAttribute(
                            channel=self.channel,
                            bot_id=self.bot_id,
                            name=name,
                            value=v,
                            created_user=None,
                            updated_user=None,
                        )
                        for v in new_values
                    ]
                )
        return True
