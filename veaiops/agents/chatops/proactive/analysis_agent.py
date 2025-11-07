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

from typing import List, Optional

from pydantic import BaseModel, Field
from veadk import Agent

from veaiops.schema.documents import Bot
from veaiops.utils.crypto import decrypt_secret_value

ANALYSIS_AGENT_NAME = "智能分析助手"
STATE_ANALYSIS_RESULT = "STATE_ANALYSIS_RESULT"
STATE_KB_POINTS = "STATE_KB_POINTS"
STATE_OVERALL_QUERY = "STATE_OVERALL_QUERY"


class AnalysisResult(BaseModel):
    """Result for question scope analysis."""

    thinking: str = Field(..., description="The reasoning process for determining the answerability and the answer.")
    is_answerable: bool = Field(..., description="Whether the question is answerable according to the given knowledge.")
    answer: Optional[str] = Field(None, description="The answer to the question if it is answerable. Otherwise, None.")
    citations: Optional[List[int]] = Field(
        default=None, description="The references or sources used to support the answer."
    )


async def init_analysis_agent(bot: Bot, description: str, instruction: str, name: str = ANALYSIS_AGENT_NAME) -> Agent:
    """Initialize the analysis agent.

    Args:
        bot (Bot): The bot instance.
        description (str): The description of the analysis task.
        instruction (str): The instruction for the analysis agent.
        name (str, optional): The name of the agent. Defaults to "ANALYSIS_AGENT_NAME".

    Raises:
        ValueError: If the bot is not found.

    Returns:
        Agent: The initialized analysis agent.
    """
    AnalysisAgent = Agent(
        name=name,
        description=description,
        instruction=instruction,
        output_key=STATE_ANALYSIS_RESULT,
        output_schema=AnalysisResult,
        model_name=bot.agent_cfg.name,
        model_provider=bot.agent_cfg.provider,
        model_api_base=bot.agent_cfg.api_base,
        model_api_key=decrypt_secret_value(bot.agent_cfg.api_key),
    )
    return AnalysisAgent
