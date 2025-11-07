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
from veaiops.schema.documents import Bot

from .default_interest_agent import set_default_interest_agents
from .default_knowledgebase import set_default_knowledgebase


async def set_default_bot(bot: Bot):
    """Set bot with default interest rules and knowledge base.

    Args:
        bot (Bot): Bot
    """
    await set_default_interest_agents(bot_id=bot.bot_id, channel=bot.channel)
    await set_default_knowledgebase(bot=bot)
