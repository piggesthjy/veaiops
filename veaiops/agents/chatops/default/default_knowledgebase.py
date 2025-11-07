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


import tos

from veaiops.agents.chatops.kb.volckb import VeAIOpsKBManager
from veaiops.schema.base.config import VEAIOPS_TAG
from veaiops.schema.documents import Bot, VeKB
from veaiops.schema.types import KBType
from veaiops.utils.crypto import decrypt_secret_value
from veaiops.utils.kb import EnhancedVikingKBService
from veaiops.utils.log import logger


async def set_default_knowledgebase(bot: Bot):
    """Set bot with default knowledge base.

    Args:
        bot (Bot): Bot
    """
    ak = decrypt_secret_value(bot.volc_cfg.ak)
    sk = decrypt_secret_value(bot.volc_cfg.sk)
    if not ak or not sk:
        logger.info(f"Bot {bot.bot_id} missing volc credentials, can not create default knowledge base.")
        return
    VIKING_KB = EnhancedVikingKBService(
        ak=ak,
        sk=sk,
    )
    TOS_CLIENT = tos.TosClientV2(
        ak=ak,
        sk=sk,
        endpoint=bot.volc_cfg.tos_endpoint,
        region=bot.volc_cfg.tos_region,
    )

    for kb_type in [KBType.AutoDoc, KBType.AutoQA]:
        _name = str(f"veaiops-{kb_type}-{bot.bot_id}-{bot.volc_cfg.ak.get_secret_value()[-10:]}").lower()
        try:
            TOS_CLIENT.create_bucket(
                _name.replace("_", "-"),
                acl=tos.ACLType.ACL_Private,
                storage_class=tos.StorageClassType.Storage_Class_Standard,
                az_redundancy=tos.AzRedundancyType.Az_Redundancy_Multi_Az,
            )
            logger.info(f"Created bucket {_name} in TOS for bot_id={bot.bot_id}")
        except Exception as e:
            logger.error(f"Error creating bucket {_name} in TOS: {e}")
            raise e
        try:
            TOS_CLIENT.put_bucket_tagging(_name.replace("_", "-"), VEAIOPS_TAG)
            logger.info(f"Put bucket {_name} tagging(provider=veaiops) in TOS for bot_id={bot.bot_id}")
        except Exception as e:
            logger.error(f"Error Put bucket {_name} tagging(provider=veaiops) in TOS: {e}")
        vekb = VeKB(
            bot_id=bot.bot_id,
            channel=bot.channel,
            collection_name=_name.replace("-", "_"),
            kb_type=kb_type,
            bucket_name=_name.replace("_", "-"),
        )
        if not await VeKB.find_one(VeKB.bot_id == bot.bot_id, VeKB.kb_type == kb_type, VeKB.channel == bot.channel):
            logger.info(f"{kb_type} knowledge base already exists for bot_id={bot.bot_id}, skipping...")
            await vekb.save()
        logger.info(f"Created {kb_type} knowledge base for bot_id={bot.bot_id}")
        kb = VeAIOpsKBManager(
            bot_id=bot.bot_id,
            collection_name=vekb.collection_name,
            project=vekb.project,
            kb_type=vekb.kb_type,
            bucket_name=vekb.bucket_name,
            tos_client=TOS_CLIENT,
            vikingkb=VIKING_KB,
        )
        logger.info(f"Initialized {kb.collection_name} knowledge base for bot_id={bot.bot_id}")
        if kb_type == KBType.AutoDoc:
            await kb.add_from_text(
                text="You are VeAIOps Bot.",
                file_name="veaiops",
                metadata={"source": "https://github.com/volcengine/veaiops", "file_name": "veaiops"},
            )
        if kb_type == KBType.AutoQA:
            import os

            current_dir = os.path.dirname(os.path.abspath(__file__))
            await kb.add_from_text(
                text=f"{current_dir}/../kb/Q&A问答对.faq.xlsx",
                file_name="index_helper",
                metadata={"source": "", "file_name": "index_helper", "doc_id": ""},
                data_type="faq.xlsx",
            )
