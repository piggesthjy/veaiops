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
import re

from beanie.operators import Eq
from google.genai.types import Content, Part
from veadk import Runner
from veadk.agents.parallel_agent import ParallelAgent

from veaiops.agents.chatops.instructions import load_interest_instruction
from veaiops.agents.chatops.memory import STM_SESSION_SVC, init_stm
from veaiops.schema.documents import AgentNotification, Bot, Interest, InterestAgentResp, Message
from veaiops.schema.types import AgentType, InterestInspectType
from veaiops.utils.log import logger
from veaiops.utils.message import get_backward_chat_messages
from veaiops.utils.webhook import send_bot_notification

from .interest_agent import (
    INTEREST_AGENT_NAME,
    SatisfiedCheck,
    init_interest_agent,
)


async def run_semantic_interest_agents(
    bot: Bot, msg: Message, interest_configs: list[Interest]
) -> list[InterestAgentResp]:
    """Run semantic interest agent for the given configuration and message.

    Args:
        bot (Bot): The bot instance.
        msg (Message): The message to process.
        interest_configs (Interest): Interest agent configuration

    Returns:
        List[InterestAgentResp]: The response from the interest agent.
    """
    user_id = msg.bot_id
    session_id = msg.msg_id

    # Initialize sub-agents
    interest_agents = []
    name_config_map = {}
    for idx, interest_config in enumerate(interest_configs):
        hists = await get_backward_chat_messages(inspect_history=interest_config.inspect_history, msg=msg, max_images=0)
        hist_message = "\n".join([i.text.strip() for i in hists if i.text])
        app_name = f"{INTEREST_AGENT_NAME}_{idx}"
        name_config_map[app_name] = interest_config
        _interest_instruction = load_interest_instruction(
            interest_description=interest_config.description,
            positive_examples="\n".join(interest_config.examples_positive)
            if interest_config.examples_positive
            else "无",
            negative_examples="\n".join(interest_config.examples_negative)
            if interest_config.examples_negative
            else "无",
            hist_messages=hist_message,
        )
        await init_stm(app_name=app_name, user_id=user_id, session_id=session_id)

        _agent = await init_interest_agent(
            bot=bot,
            description=_interest_instruction.description,
            instruction=_interest_instruction.instruction,
            name=app_name,
        )
        interest_agents.append(_agent)

    # Initialize ParallelAgent as root agent
    await init_stm(
        app_name=INTEREST_AGENT_NAME,
        user_id=user_id,
        session_id=session_id,
    )

    InterestDetectAgent = ParallelAgent(
        name=INTEREST_AGENT_NAME, description="识别内容是否满足给定的特征", sub_agents=interest_agents
    )
    runner = Runner(app_name=INTEREST_AGENT_NAME, session_service=STM_SESSION_SVC, agent=InterestDetectAgent)

    agents_resp = []
    try:
        async for event in runner.run_async(
            user_id=user_id,
            session_id=session_id,
            new_message=Content(parts=[Part(text="请判断对话内容是否符合给定的特征")], role="user"),
        ):
            logger.debug(f"Intermediate event from ParallelAgent: {event}")

            if event.author in name_config_map:
                interest_config = name_config_map[event.author]
                try:
                    json_data = event.content.parts[0].text
                    resp_parsed = SatisfiedCheck.model_validate_json(json_data)
                    resp = InterestAgentResp(
                        thinking=resp_parsed.thinking,
                        is_satisfied=resp_parsed.is_satisfied,
                        **interest_config.model_dump(),
                    )
                except Exception as e:
                    logger.error(f"Unexpected response format from agent: {event}, error: {e}")
                    resp = InterestAgentResp(
                        **interest_config.model_dump(),
                        is_satisfied=False,
                        thinking="Error in response parsing.",
                    )
                agents_resp.append(resp)

    except ExceptionGroup as e:
        e_str = "\n".join(
            [
                f"ErrCode {getattr(i, 'status_code', 'N/A')}: ErrMsg {getattr(i, 'message', str(i))}"
                for i in e.exceptions
            ]
        )
        logger.error(f"ExceptionGroup running ParallelAgent for interest detection: {e_str}")
    except Exception as e:
        logger.error(f"Error running ParallelAgent for interest detection: {e}")

    return agents_resp


async def run_re_interest_agents(bot: Bot, msg: Message, interest_configs: list[Interest]) -> list[InterestAgentResp]:
    """Run RE interest agent for the given configuration and message.

    Args:
        bot (Bot): The bot instance.
        msg (Message): The message to process.
        interest_configs (Interest): Interest agent configuration

    Returns:
        List[InterestAgentResp]: The response from the interest agent.
    """
    agents_resp = []
    for interest_config in interest_configs:
        if not interest_config.regular_expression:
            logger.error(f"Interest config '{interest_config.name}' missing regular_expression for RE inspection.")
            resp = InterestAgentResp(
                **interest_config.model_dump(), is_satisfied=False, thinking="Missing regex pattern."
            )
        else:
            pattern = re.compile(interest_config.regular_expression)
            is_satisfied = bool(pattern.search(msg.msg or ""))
            resp = InterestAgentResp(
                **interest_config.model_dump(),
                is_satisfied=is_satisfied,
                thinking="Used regex pattern.",
            )
        agents_resp.append(resp)
    return agents_resp


async def run_interest_detect_agent(bot: Bot, msg: Message) -> None:
    """Run interest agent for the given bot and message.

    Args:
        bot (Bot): The bot instance.
        msg (Message): The message to process.
    """
    bot_id = msg.bot_id
    logger.info(f"Loading interest agent configs for bot_id={bot_id}")

    # Load initial configuration

    bot_interests = await Interest.find(
        Interest.bot_id == bot_id, Interest.channel == msg.channel, Eq(Interest.is_active, True)
    ).to_list()

    if not bot_interests:
        logger.warning(f"No valid config found for bot_id={bot_id}. Skipping agent initialization.")
        return
    logger.info(f"Loaded config for bot_id={bot_id}")

    semantic_bot_interests = [i for i in bot_interests if i.inspect_category == InterestInspectType.Semantic]
    re_bot_interests = [i for i in bot_interests if i.inspect_category == InterestInspectType.RE]
    semantic_resp = await run_semantic_interest_agents(bot=bot, msg=msg, interest_configs=semantic_bot_interests)
    re_resp = await run_re_interest_agents(bot=bot, msg=msg, interest_configs=re_bot_interests)

    agents_resp = semantic_resp + re_resp
    logger.info(f"Finished all agents task for bot={bot_id}")

    # Construct Agent notification
    notification = AgentNotification(
        bot_id=bot_id,
        channel=msg.channel,
        chat_id=msg.chat_id,
        agent_type=AgentType.CHATOPS_INTEREST,
        msg_id=msg.msg_id,
        data=agents_resp,
    )
    await notification.save()
    await send_bot_notification(bot=bot, data=notification)
