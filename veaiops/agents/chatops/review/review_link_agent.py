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

import tos
from urlextract import URLExtract

from veaiops.agents.chatops.default.default_knowledgebase import set_default_knowledgebase
from veaiops.agents.chatops.kb.volckb import VeAIOpsKBManager
from veaiops.agents.chatops.tools import link_reader
from veaiops.schema.documents import Bot, Message, VeKB
from veaiops.schema.models.chatops import ExternalLinkReviewResult
from veaiops.schema.types import KBType
from veaiops.utils.crypto import decrypt_secret_value
from veaiops.utils.kb import EnhancedVikingKBService
from veaiops.utils.log import logger


async def run_review_external_link(bot: Bot, msg: Message) -> None:
    """Reviews external links in the message.

    Args:
        bot (Bot): The bot object.
        msg (Message): The message object containing the content to review.
    """
    bot_id = msg.bot_id
    extractor = URLExtract()
    urls = extractor.find_urls(text=msg.msg, only_unique=True)
    if not urls:
        logger.info("No external links found.")
        return

    vekb = await VeKB.find_one(VeKB.bot_id == bot_id, VeKB.channel == msg.channel, VeKB.kb_type == KBType.AutoDoc)

    TOS_CLIENT = tos.TosClientV2(
        ak=decrypt_secret_value(bot.volc_cfg.ak),
        sk=decrypt_secret_value(bot.volc_cfg.sk),
        endpoint=bot.volc_cfg.tos_endpoint,
        region=bot.volc_cfg.tos_region,
    )

    if not vekb:
        await set_default_knowledgebase(bot=bot)
        vekb = await VeKB.find_one(VeKB.bot_id == bot_id, VeKB.channel == msg.channel, VeKB.kb_type == KBType.AutoDoc)

    VIKING_KB = EnhancedVikingKBService(
        ak=decrypt_secret_value(bot.volc_cfg.ak),
        sk=decrypt_secret_value(bot.volc_cfg.sk),
    )

    kb = VeAIOpsKBManager(
        bot_id=bot_id,
        collection_name=vekb.collection_name,
        project=vekb.project,
        kb_type=vekb.kb_type,
        bucket_name=vekb.bucket_name,
        tos_client=TOS_CLIENT,
        vikingkb=VIKING_KB,
    )

    links = await link_reader(
        msg.msg, bot_id=bot_id, agent_api_key=decrypt_secret_value(bot.agent_cfg.api_key), tool_context=None
    )
    tasks = []
    external_link_review_results = []
    pending_links = []
    for link in links or []:
        if link.text and link.title:
            tasks.append(
                kb.add_from_text(
                    text=link.text, file_name=link.title, metadata={"source": link.url, "file_name": link.title}
                )
            )
            pending_links.append(link)
        else:
            external_link_review_results.append(
                ExternalLinkReviewResult(url=link.url, status="failure", message="Failed to read content from link.")
            )

    task_rets = await asyncio.gather(*tasks, return_exceptions=True)

    for task_ret, link in zip(task_rets, pending_links):
        if task_ret is True:
            logger.info(f"Review external link {link} success.")
            external_link_review_results.append(
                ExternalLinkReviewResult(url=link.url, status="success", message="Reviewed successfully.")
            )
        elif isinstance(task_ret, Exception):
            logger.error(f"Error reviewing external link {link.url}: {task_ret}")
            external_link_review_results.append(
                ExternalLinkReviewResult(url=link.url, status="failure", message=f"Error occurred: {str(task_ret)}")
            )
        else:
            external_link_review_results.append(
                ExternalLinkReviewResult(url=link.url, status="failure", message="Failed to read content from link.")
            )

    await msg.set({Message.extracted_links: external_link_review_results})
    logger.info(f"Reviewed {len(external_link_review_results)} external links.")
