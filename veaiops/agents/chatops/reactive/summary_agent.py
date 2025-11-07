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


from veadk import Agent

from veaiops.agents.chatops.tools import get_chat_history
from veaiops.schema.documents import Bot
from veaiops.utils.crypto import decrypt_secret_value
from veaiops.utils.log import logger

SUMMARY_AGENT_NAME = "群聊总结Agent"
STATE_CHAT_ID = "STATE_CHAT_ID"
STATE_CURRENT_TIME = "STATE_CURRENT_TIME"


async def init_summary_agent(bot: Bot, description: str, instruction: str, name: str = SUMMARY_AGENT_NAME) -> Agent:
    """Initialize a summary agent.

    Args:
        bot (Bot): The bot instance.
        description (str): The description of the summary task.
        instruction (str): The instruction for the summary agent.
        name (str): Name of the agent.

    Returns:
        SummaryAgent: The initialized summary agent.
    """
    logger.info(f"Initializing summary agent for bot_id={bot.bot_id}")

    SummaryAgent = Agent(
        name=name,
        description=description,
        instruction=instruction,
        tools=[get_chat_history],
        model_name=bot.agent_cfg.name,
        model_provider=bot.agent_cfg.provider,
        model_api_base=bot.agent_cfg.api_base,
        model_api_key=decrypt_secret_value(bot.agent_cfg.api_key),
    )
    return SummaryAgent
