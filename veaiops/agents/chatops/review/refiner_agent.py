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


from typing import Literal, Optional

from pydantic import BaseModel, Field
from veadk import Agent

from veaiops.schema.documents import Bot
from veaiops.utils.crypto import decrypt_secret_value

REFINER_AGENT_NAME = "QA改进专家"


class RefineResult(BaseModel):
    """State for refinement result."""

    action: Literal["keep", "delete", "modify", "pending"] = Field(default="pending", description="The action to take.")
    question: Optional[str] = Field(default=None, description="The question after modification if action is modify.")
    answer: Optional[str] = Field(default=None, description="The answer after modification if action is modify.")
    delete_citation_ids: Optional[list[str]] = Field(
        default=None, description="The list of citation IDs to delete if action is delete or modify"
    )


async def init_refiner_agent(bot: Bot, description: str, instruction: str, name: str = REFINER_AGENT_NAME) -> Agent:
    """Initialize the refiner agent.

    Args:
        bot (Bot): The bot instance.
        description (str): The description of the agent.
        instruction (str): The instruction for the agent.
        name (str, optional): The name of the agent. Defaults to "REFINER_AGENT_NAME".

    Returns:
        Agent: The initialized analysis agent.
    """
    RefinerAgent = Agent(
        name=name,
        description=description,
        instruction=instruction,  # noqa: E501
        output_schema=RefineResult,
        model_name=bot.agent_cfg.name,
        model_provider=bot.agent_cfg.provider,
        model_api_base=bot.agent_cfg.api_base,
        model_api_key=decrypt_secret_value(bot.agent_cfg.api_key),
    )
    return RefinerAgent
