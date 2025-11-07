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
from google.genai.types import Content, Part
from veadk import Runner

from veaiops.agents.chatops.instructions import load_refiner_instruction
from veaiops.agents.chatops.kb.volckb import VeAIOpsKBManager
from veaiops.agents.chatops.memory.short_term_memory import STM_SESSION_SVC, init_stm
from veaiops.schema.documents import Bot, Message, VeKB
from veaiops.schema.types import CitationType, KBType
from veaiops.utils.crypto import decrypt_secret_value
from veaiops.utils.kb import EnhancedVikingKBService
from veaiops.utils.log import logger
from veaiops.utils.message import get_backward_chat_messages, get_forward_chat_messages

from .refiner_agent import RefineResult, init_refiner_agent

ANSWER_REVIEW_AGENT_NAME = "答案评审"


async def run_answer_review_agent(bot: Bot, msg: Message, name: str = ANSWER_REVIEW_AGENT_NAME) -> None:
    """Run an answer review agent.

    Args:
        bot (Bot): Bot
        msg (Message): The message object containing the content to review.
        name (str, optional): The name of the answer review agent. Defaults to ANSWER_REVIEW_AGENT_NAME.
    """
    app_name = name
    user_id = msg.bot_id
    session_id = msg.msg_id
    bot_id = msg.bot_id

    question = msg.proactive_reply.rewrite_query
    answer = msg.proactive_reply.answer

    forward_msgs = await get_forward_chat_messages(inspect_history=0, msg=msg, max_images=1)

    backward_msgs = await get_backward_chat_messages(inspect_history=20, msg=msg, max_images=1)

    # Construct the proactive reply context
    citations = msg.proactive_reply.citations
    citations_context = []
    for citation in citations or []:
        citation_knowledge_key = citation.knowledge_key
        if citation.citation_type == CitationType.QA:
            citation_question = citation.question
            citation_answer = citation.answer

            if not citation_knowledge_key:
                continue
            citations_context.append(
                f"Citation QA <{citation_knowledge_key}>: \nQ: {citation_question}\nA: {citation_answer}"
            )
        elif citation.citation_type == CitationType.Document:
            citation_title = citation.title
            citation_context = citation.content
            citations_context.append(
                f"Citation Doc <{citation_knowledge_key}>: \nTitle: {citation_title}\nContent: {citation_context}\n"
            )

    citations_context_str = "\n".join(citations_context) or "No citations available."

    _d_i = load_refiner_instruction()
    RefinerAgent = await init_refiner_agent(bot=bot, description=_d_i.description, instruction=_d_i.instruction)

    await init_stm(app_name=app_name, user_id=user_id, session_id=session_id)

    _message = [
        Part(
            text=f"""## 待改进QA对
**问题（Q）**: {question}
**答案（A）**: {answer}

## 用于生成原QA对的参考内容
{citations_context_str}

**群聊上文（获取背景信息与前置条件）**:
{backward_msgs[0].text if backward_msgs else "无上文信息。"}

**群聊下文（校验&评审问题的答案）**:
{forward_msgs[0].text if forward_msgs else "无下文信息。"}

"""
        )
    ]
    message = Content(parts=_message, role="user")

    runner = Runner(
        app_name=app_name,
        user_id=bot_id,
        agent=RefinerAgent,
        session_service=STM_SESSION_SVC,
    )
    refine_result = RefineResult()
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
                logger.debug(f"Refinement event content: {event_content}")
                refine_result = RefineResult.model_validate_json(event_content)

    except ExceptionGroup as e:
        e_str = "\n".join(
            [
                f"ErrCode {getattr(i, 'status_code', 'N/A')}: ErrMsg {getattr(i, 'message', str(i))}"
                for i in e.exceptions
            ]
        )
        logger.error(f"ExceptionGroup running review answer agent: {e_str}")

    except Exception as e:
        logger.error(f"Error running answer review agent: {e}")
        return

    if refine_result.action == "pending":
        logger.info(f"QA is pending for bot_id={bot_id}, chat_id={msg.chat_id}")
        await msg.set({Message.proactive_reply.review_status: "keep"})
        return

    if refine_result.action == "keep":
        logger.info(f"QA is keep for bot_id={bot_id}, chat_id={msg.chat_id}")
        await msg.set({Message.proactive_reply.review_status: "keep"})
        return

    VIKING_KB = EnhancedVikingKBService(
        ak=decrypt_secret_value(bot.volc_cfg.ak),
        sk=decrypt_secret_value(bot.volc_cfg.sk),
    )

    if refine_result.action == "modify" and refine_result.question and refine_result.answer:
        logger.info(f"QA is marked for modification for bot_id={bot_id}, chat_id={msg.chat_id}")
        TOS_CLIENT = tos.TosClientV2(
            ak=decrypt_secret_value(bot.volc_cfg.ak),
            sk=decrypt_secret_value(bot.volc_cfg.sk),
            endpoint=bot.volc_cfg.tos_endpoint,
            region=bot.volc_cfg.tos_region,
        )
        vekb = await VeKB.find_one(VeKB.bot_id == bot_id, VeKB.channel == msg.channel, VeKB.kb_type == KBType.AutoQA)
        kb = VeAIOpsKBManager(
            bot_id=bot_id,
            collection_name=vekb.collection_name,
            project=vekb.project,
            kb_type=vekb.kb_type,
            bucket_name=vekb.bucket_name,
            tos_client=TOS_CLIENT,
            vikingkb=VIKING_KB,
        )
        point_id = await kb.add_from_qa(question=refine_result.question, answer=refine_result.answer, msg_id=msg.msg_id)
        await msg.set(
            {
                Message.proactive_reply.knowledge_key: point_id,
                Message.proactive_reply.review_status: "modify",
                Message.proactive_reply.modified_query: refine_result.question,
                Message.proactive_reply.modified_answer: refine_result.answer,
            }
        )
        logger.info(f"Modified QA saved for bot_id={bot_id}, chat_id={msg.chat_id}")

    if refine_result.action in ["delete", "modify"] and refine_result.delete_citation_ids:
        logger.info(f"QA is marked for deletion for bot_id={bot_id}, chat_id={msg.chat_id}")
        deleted_citations = []
        for knowledge_key in refine_result.delete_citation_ids:
            target_citation = [i for i in citations or [] if i.knowledge_key == knowledge_key]

            if target_citation:
                citation = target_citation[0]
            else:
                logger.error(f"Cannot find target citation knowledge key={knowledge_key} to delete")
                return
            logger.info(f"QA is marked for deletion for bot_id={bot_id}, chat_id={msg.chat_id}")
            if citation.citation_type == CitationType.QA:
                kb_type = KBType.AutoQA
            elif citation.citation_type == CitationType.Document:
                kb_type = KBType.AutoDoc
            else:
                logger.info(
                    f"Cannot delete type={citation.citation_type} for knowledge key={knowledge_key}, skipping deletion."
                )
                continue

            vekb = await VeKB.find_one(VeKB.bot_id == bot_id, VeKB.channel == msg.channel, VeKB.kb_type == kb_type)
            if not vekb:
                logger.error(f"VeKB not found for bot_id={bot_id}, channel={msg.channel}, kb_type={kb_type}")
                continue
            collection = VIKING_KB.get_collection(collection_name=vekb.collection_name, project=vekb.project)
            try:
                collection.delete_point(
                    point_id=knowledge_key, collection_name=vekb.collection_name, project=vekb.project
                )
                logger.info(f"Deleted point {knowledge_key} from collection for bot_id={bot_id}, chat_id={msg.chat_id}")
                deleted_citations.append(knowledge_key)

            except Exception as e:
                logger.error(f"Error deleting point {knowledge_key} from collection: {e}")

        await msg.set(
            {
                Message.proactive_reply.review_status: refine_result.action,
                Message.proactive_reply.deleted_citations: deleted_citations,
            }
        )

    logger.info(f"Refinement completed for bot_id={bot_id}, chat_id={msg.chat_id}")
