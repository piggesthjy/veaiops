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

from veaiops.schema.documents import Bot
from veaiops.utils.crypto import decrypt_secret_value

IDENTIFY_AGENT_NAME = "内容识别Agent"
STATE_IDENTIFY_RESULT = "STATE_IDENTIFY_RESULT"


class IdentifyResult(BaseModel):
    """Result for question scope identification."""

    within_scope: bool = Field(..., description="Whether the question is within scope")
    thinking: str = Field(..., description="The reasoning process of the model")


async def init_identify_agent(bot: Bot, description: str, instruction: str, name: str = IDENTIFY_AGENT_NAME) -> Agent:
    """Initialize the identification agent.

    Args:
        bot (Bot): The bot instance.
        description (str): The description of the identification task.
        instruction (str): The instruction for the identify agent.
        name (Optional[str]): The name of the agent. Defaults to "IDENTIFY_AGENT_NAME".

    Returns:
        Agent: The initialized identification agent.
    """
    IdentifyAgent = Agent(
        name=name,
        description=description,
        instruction=instruction,  # noqa: E501
        output_key=STATE_IDENTIFY_RESULT,
        output_schema=IdentifyResult,
        model_name=bot.agent_cfg.name,
        model_provider=bot.agent_cfg.provider,
        model_api_base=bot.agent_cfg.api_base,
        model_api_key=decrypt_secret_value(bot.agent_cfg.api_key),
    )

    return IdentifyAgent
