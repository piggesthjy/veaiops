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


from pydantic import BaseModel, Field
from veadk import Agent

from veaiops.agents.chatops.memory import STM
from veaiops.schema.documents import Bot
from veaiops.utils.crypto import decrypt_secret_value
from veaiops.utils.log import logger

INTEREST_AGENT_NAME = "内容识别Agent"
STATE_INTEREST_DESCRIPTION = "STATE_INTEREST_DESCRIPTION"
STATE_POSITIVE_EXAMPLES = "STATE_POSITIVE_EXAMPLES"
STATE_NEGATIVE_EXAMPLES = "STATE_NEGATIVE_EXAMPLES"
STATE_HIST_MESSAGES = "STATE_HIST_MESSAGES"


class SatisfiedCheck(BaseModel):
    """Model to check if the interest condition is satisfied."""

    thinking: str = Field(default="", description="Thinking")
    is_satisfied: bool = Field(..., description="是否满足给定的特征")


async def init_interest_agent(bot: Bot, description: str, instruction: str, name: str = INTEREST_AGENT_NAME) -> Agent:
    """Initialize the identification agent.

    Args:
        bot (Bot): The bot instance.
        description (str): The description of the interest condition.
        instruction (str): The instruction for the identification agent.
        name (str): Name of the agent.

    Returns:
        Agent: The initialized identification agent.
    """
    logger.info(f"Initializing identification agent for bot_id={bot.bot_id}")

    InterestAgent = Agent(
        name=name,
        description=description,
        instruction=instruction,
        output_schema=SatisfiedCheck,
        short_term_memory=STM,
        model_name=bot.agent_cfg.name,
        model_provider=bot.agent_cfg.provider,
        model_api_base=bot.agent_cfg.api_base,
        model_api_key=decrypt_secret_value(bot.agent_cfg.api_key),
    )
    return InterestAgent
