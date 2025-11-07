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

from typing import Optional

import tos
from google.genai.types import Content, Part
from pydantic import BaseModel, Field
from veadk import Agent, Runner

from veaiops.agents.chatops.default.default_knowledgebase import set_default_knowledgebase
from veaiops.agents.chatops.instructions import load_query_review_instruction
from veaiops.agents.chatops.kb.volckb import VeAIOpsKBManager
from veaiops.agents.chatops.memory import STM_SESSION_SVC, init_stm
from veaiops.schema.documents import Bot, Message, VeKB
from veaiops.schema.types import KBType
from veaiops.utils.crypto import decrypt_secret_value
from veaiops.utils.kb import EnhancedVikingKBService
from veaiops.utils.log import logger
from veaiops.utils.message import get_backward_chat_messages, get_forward_chat_messages

QUERY_REVIEW_AGENT_NAME = "答案提取"
STATE_REVIEW_RESULT = "STATE_REVIEW_RESULT"


class ExtractedAnswer(BaseModel):
    """The extracted answer from the review."""

    has_answer: bool = Field(default=False, description="Whether the answer exists in the provided context")
    answer: Optional[str] = Field(default=None, description="The answer")


async def init_query_review_agent(
    bot: Bot, description: str, instruction: str, name: str = QUERY_REVIEW_AGENT_NAME
) -> Agent:
    """Initialize the query review agent.

    Args:
        bot (Bot): The bot instance.
        description (str): The description of the query review task.
        instruction (str): The instruction for the query review agent.
        name (Optional[str]): The name of the agent. Defaults to "QUERY_REVIEW_AGENT_NAME".

    Returns:
        Agent: The initialized query review agent.
    """
    QueryReviewAgent = Agent(
        name=name,
        description=description,
        instruction=instruction,  # noqa: E501
        output_key=STATE_REVIEW_RESULT,
        output_schema=ExtractedAnswer,
        model_name=bot.agent_cfg.name,
        model_provider=bot.agent_cfg.provider,
        model_api_base=bot.agent_cfg.api_base,
        model_api_key=decrypt_secret_value(bot.agent_cfg.api_key),
    )

    return QueryReviewAgent


async def run_query_review_agent(bot: Bot, msg: Message) -> None:
    """Run a query review agent.

    Args:
        bot (Bot): The bot object.
        msg (Message): The message object containing the content to review.
    """
    app_name = QUERY_REVIEW_AGENT_NAME
    user_id = bot.bot_id
    session_id = msg.msg_id
    bot_id = msg.bot_id

    _d_i = load_query_review_instruction()
    QueryReviewAgent = await init_query_review_agent(
        bot=bot,
        description=_d_i.description,
        instruction=_d_i.instruction,
    )

    forward_msgs = await get_forward_chat_messages(inspect_history=0, msg=msg, max_images=1)

    backward_msgs = await get_backward_chat_messages(inspect_history=20, msg=msg, max_images=1)

    question = msg.proactive_reply.rewrite_query
    _message = (
        [Part(text=f"目标问题\n{question}\n\n问题的上文/背景信息")]
        + backward_msgs
        + [Part(text="\n\n请从以下（问题的下文）回复中提取答案信息：")]
        + forward_msgs
    )
    message = Content(parts=_message, role="user")

    await init_stm(
        app_name=app_name,
        user_id=user_id,
        session_id=session_id,
    )
    runner = Runner(
        app_name=app_name,
        user_id=user_id,
        agent=QueryReviewAgent,
        session_service=STM_SESSION_SVC,
    )

    review_result = ExtractedAnswer()
    try:
        async for event in runner.run_async(user_id=user_id, session_id=session_id, new_message=message):
            logger.debug(event)
            if (
                event.is_final_response()
                and event.content
                and event.content.parts
                and event.content.parts[0]
                and event.content.parts[0].text
            ):
                event_content = event.content.parts[0].text.strip()
                logger.debug(event_content)
                review_result = ExtractedAnswer.model_validate_json(event_content)
    except ExceptionGroup as e:
        e_str = "\n".join(
            [
                f"ErrCode {getattr(i, 'status_code', 'N/A')}: ErrMsg {getattr(i, 'message', str(i))}"
                for i in e.exceptions
            ]
        )
        logger.error(f"ExceptionGroup running query review agent: {e_str}")

    except Exception as e:
        logger.error(f"Error running query review agent: {e}")
        return

    if not review_result.has_answer or not review_result.answer or not question:
        logger.info(f"Query review completed for msg_id={msg.msg_id}, updating knowledge base.")
        return

    logger.info(f"Query review completed for msg_id={msg.msg_id}, updating knowledge base.")
    TOS_CLIENT = tos.TosClientV2(
        ak=decrypt_secret_value(bot.volc_cfg.ak),
        sk=decrypt_secret_value(bot.volc_cfg.sk),
        endpoint=bot.volc_cfg.tos_endpoint,
        region=bot.volc_cfg.tos_region,
    )
    vekb = await VeKB.find_one(VeKB.bot_id == bot_id, VeKB.channel == msg.channel, VeKB.kb_type == KBType.AutoQA)
    if not vekb:
        await set_default_knowledgebase(bot=bot)
        vekb = await VeKB.find_one(VeKB.bot_id == bot_id, VeKB.channel == msg.channel, VeKB.kb_type == KBType.AutoQA)

    # If vekb is still None after trying to create default KB, return early
    if not vekb:
        logger.warning(f"Failed to create or find knowledge base for bot_id={bot_id}, skipping KB update.")
        return

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

    point_id = await kb.add_from_qa(question=question, answer=review_result.answer, msg_id=msg.msg_id)

    await msg.set(
        {
            Message.proactive_reply.knowledge_key: point_id,
            Message.proactive_reply.review_status: "add",
            Message.proactive_reply.modified_query: question,
            Message.proactive_reply.modified_answer: review_result.answer,
        }
    )
    logger.info(f"Updated message msg_id={msg.msg_id} with reviewed QA knowledge point_id={point_id}.")
