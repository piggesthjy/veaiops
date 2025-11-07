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
from veadk.tools.builtin_tools.web_search import web_search

from veaiops.agents.chatops.instructions import load_summary_instruction
from veaiops.agents.chatops.memory import init_ltm, init_stm
from veaiops.agents.chatops.tools import get_utc_time, link_reader
from veaiops.schema.documents import Bot, Message
from veaiops.utils.crypto import decrypt_secret_value
from veaiops.utils.log import logger

from .summary_agent import STATE_CHAT_ID, STATE_CURRENT_TIME, init_summary_agent

REACTIVE_AGENT_NAME = "智能问答助手"


async def init_reactive_agent(
    bot: Bot, description: str, instruction: str, msg: Message, name: str = REACTIVE_AGENT_NAME
) -> Agent:
    """Initialize the reactive multi agents.

    Args:
        bot (Bot): The bot instance.
        description (str): The description of the reactive agent.
        instruction (str): The instruction for the reactive agent.
        msg (Message): The message instance.
        name (str): Name of the agent.

    Raises:
        ValueError: If the bot is not found.

    Returns:
        Agent: The initialized reactive multi agents.
    """
    logger.info(f"Initializing reactive multi agents for bot_id={bot.bot_id}, channel={msg.channel}")

    app_name = REACTIVE_AGENT_NAME
    user_id = msg.msg_sender_id
    session_id = msg.chat_id

    LTM = await init_ltm(bot=bot)
    STM = await init_stm(
        app_name=app_name,
        user_id=user_id,
        session_id=session_id,
        state={
            STATE_CHAT_ID: msg.chat_id,
            STATE_CURRENT_TIME: msg.msg_time.strftime("%Y-%m-%d %H:%M:%S"),
            "VOLCENGINE_ACCESS_KEY": decrypt_secret_value(bot.volc_cfg.ak),
            "VOLCENGINE_SECRET_KEY": decrypt_secret_value(bot.volc_cfg.sk),
            "BOT_ID": bot.bot_id,
            "AGENT_API_KEY": decrypt_secret_value(bot.agent_cfg.api_key),
        },
    )
    # Sub agents
    _summary_instruction = load_summary_instruction()
    SummaryAgent = await init_summary_agent(
        bot=bot, description=_summary_instruction.description, instruction=_summary_instruction.instruction
    )

    ReactiveMultiAgents = Agent(
        name=name,
        description=description,
        instruction=instruction,
        sub_agents=[SummaryAgent],
        tools=[get_utc_time, web_search, link_reader],
        short_term_memory=STM,
        long_term_memory=LTM,
        model_name=bot.agent_cfg.name,
        model_provider=bot.agent_cfg.provider,
        model_api_base=bot.agent_cfg.api_base,
        model_api_key=decrypt_secret_value(bot.agent_cfg.api_key),
    )

    return ReactiveMultiAgents
