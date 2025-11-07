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

import asyncio
import re
from datetime import datetime

from google.genai.types import Content, Part
from veadk import Runner

from veaiops.agents.chatops.instructions import load_reactive_instruction, load_rewrite_instruction
from veaiops.agents.chatops.memory import STM_SESSION_SVC, init_stm
from veaiops.agents.chatops.proactive.proactive_agent import KB_AGENT_NAME
from veaiops.agents.chatops.proactive.rewrite_agent import REWRITE_AGENT_NAME, RewriteResult, init_rewrite_agent
from veaiops.schema.documents import AgentNotification, Bot, Message, VeKB
from veaiops.schema.models.chatops import AgentReplyResp
from veaiops.schema.types import AgentType, CitationType
from veaiops.utils.crypto import decrypt_secret_value
from veaiops.utils.kb import EnhancedVikingKBService, convert_viking_to_citations
from veaiops.utils.log import logger
from veaiops.utils.message import get_backward_chat_messages
from veaiops.utils.webhook import send_bot_notification

from .reactive_agent import REACTIVE_AGENT_NAME, init_reactive_agent

SIM_THRESHOLD = 0.7
INSPECT_HISTORY_THRESHOLD = 20
DEFAULT_REACTIVE_REPLY = "抱歉，暂时无法回答该问题"


async def construct_msg_with_kbs(bot: Bot, msg: Message) -> Content:
    """Construct the message with relevant knowledge base points.

    Args:
        bot (Bot): The bot instance.
        msg (Message): The message instance.

    Returns:
        Content: The constructed message content.
    """
    app_name = REWRITE_AGENT_NAME
    user_id = msg.msg_sender_id
    session_id = msg.chat_id
    message = await get_backward_chat_messages(inspect_history=INSPECT_HISTORY_THRESHOLD, msg=msg)

    message = message + [Part(text="\n需要结合上述历史对话回复以下内容.\n")] + msg.msg_llm_compatible

    vekbs = await VeKB.find(VeKB.bot_id == bot.bot_id, VeKB.channel == msg.channel).to_list()
    knowledgebases = []
    VIKING_KB = EnhancedVikingKBService(
        ak=decrypt_secret_value(bot.volc_cfg.ak),
        sk=decrypt_secret_value(bot.volc_cfg.sk),
    )
    for vekb in vekbs:
        try:
            collection = VIKING_KB.get_collection(collection_name=vekb.collection_name, project=vekb.project)
            knowledgebases.append(collection)
        except Exception as e:
            logger.error(f"Error getting collection for vekb {vekb}: {e}")
            continue

    _rewrite_instruction = load_rewrite_instruction()
    RewriteAgent = await init_rewrite_agent(
        bot=bot, description=_rewrite_instruction.description, instruction=_rewrite_instruction.instruction
    )

    await init_stm(
        app_name=app_name,
        user_id=user_id,
        session_id=session_id,
    )

    runner = Runner(app_name=app_name, user_id=user_id, agent=RewriteAgent, session_service=STM_SESSION_SVC)

    rewrite_query = None
    try:
        async for event in runner.run_async(
            user_id=user_id, session_id=session_id, new_message=Content(parts=message, role="user")
        ):
            logger.debug(event)
            if (
                event.is_final_response()
                and event.content
                and event.content.parts
                and event.content.parts[0]
                and event.content.parts[0].text
            ):
                rewrite_query = RewriteResult.model_validate_json(event.content.parts[0].text.strip())
    except ExceptionGroup as e:
        e_str = "\n".join(
            [
                f"ErrCode {getattr(i, 'status_code', 'N/A')}: ErrMsg {getattr(i, 'message', str(i))}"
                for i in e.exceptions
            ]
        )
        logger.error(f"ExceptionGroup running construct msg with kbs: {e_str}")
        return Content(parts=message, role="user")

    except Exception as e:
        logger.error(f"Error running proactive reply agent: {e}")
        return Content(parts=message, role="user")

    if not rewrite_query:
        logger.error(f"[Reactive Agent] Cannot rewrite query for {msg.msg_id}")
        return Content(parts=message, role="user")

    rag_tasks = []
    rag_tags = []
    for subquery in rewrite_query.sub_queries:
        for collection in knowledgebases:
            # Retrieve relevant knowledge from the knowledgebase using the rewritten queries
            logger.info(
                f"[{KB_AGENT_NAME}] Retrieving from collection {collection.collection_name} with query: {subquery}"
            )
            rag_tasks.append(
                VIKING_KB.async_search_knowledge(
                    collection_name=collection.collection_name, query=subquery, project=collection.project
                )
            )
            rag_tags.append(f"Collection: {collection.collection_name}, Sub-query: {subquery}\n")

    tasks_results = await asyncio.gather(*rag_tasks, return_exceptions=True)
    errors = [f"{tag}: {e}" for e, tag in zip(tasks_results, rag_tags) if isinstance(e, Exception)]
    if errors:
        logger.error(f"[{KB_AGENT_NAME}] Part of RAG task failed with {'\n'.join(errors)}")

    rag_results = [r for r in tasks_results if not isinstance(r, Exception)]

    logger.info(f"[{KB_AGENT_NAME}] Finished with {len(rag_results)} collections success, {len(errors)} failures.")
    citations = convert_viking_to_citations(viking_returns=rag_results)
    kb_format_list = []
    for i, doc in enumerate(citations):
        update_time = datetime.fromtimestamp(doc.update_ts_seconds)
        if doc.citation_type == CitationType.Document:
            kb_format_list.append(f"<doc>{i + 1}</doc>\n# {doc.title}\nDoc update time: {update_time}\n{doc.content}\n")
        else:
            kb_format_list.append(f"<doc>{i + 1}</doc>\nDoc update time: {update_time}\n{doc.content.strip()}\n")

    kb_points = "\n\n".join(kb_format_list)

    _message = [Part(text="参考资料：\n")] + [Part(text=kb_points)] + message

    return Content(parts=_message, role="user")


async def run_reactive_reply_agent(bot: Bot, msg: Message) -> None:
    """Run reactive reply agent for the given bot and message.

    Args:
        bot (Bot): The bot instance.
        msg (Message): The message to process.
    """
    app_name = REACTIVE_AGENT_NAME
    user_id = msg.msg_sender_id
    session_id = msg.chat_id

    bot_id = msg.bot_id

    logger.info(f"Loading summary agent configs for bot_id={bot_id}")

    # If does not mention the bot, skip processing
    if not msg.is_mentioned:
        return

    # This function can run in both p2p and group chats
    # If only at the bot without additional content, fallback to summary agent

    if (
        msg.msg_llm_compatible
        and len(msg.msg_llm_compatible) == 1
        and msg.msg_llm_compatible[0].text
        and not re.sub(
            "|".join([re.escape(f"@{i.name}") for i in msg.mentions or []]),
            "",
            msg.msg_llm_compatible[0].text.strip(),
        )
    ):
        logger.info("Message only mentions the bot without additional content, fall back to summary agent.")

        message = Content(parts=[Part(text="Please summarize the recent conversation in the group.")], role="user")

    else:
        try:
            message = await construct_msg_with_kbs(bot=bot, msg=msg)
        except Exception:
            logger.error("Error constructing message with knowledge bases, using original message.")
            message = Content(parts=msg.msg_llm_compatible, role="user")

    _reactive_instruction = load_reactive_instruction()
    ReactiveAgent = await init_reactive_agent(
        bot=bot,
        description=_reactive_instruction.description,
        instruction=_reactive_instruction.instruction,
        name=app_name,
        msg=msg,
    )

    runner = Runner(
        app_name=app_name,
        user_id=user_id,
        agent=ReactiveAgent,
        session_service=STM_SESSION_SVC,
    )

    agents_resp = DEFAULT_REACTIVE_REPLY
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
                agents_resp = event.content.parts[0].text.strip()
    except ExceptionGroup as e:
        e_str = "\n".join(
            [
                f"ErrCode {getattr(i, 'status_code', 'N/A')}: ErrMsg {getattr(i, 'message', str(i))}"
                for i in e.exceptions
            ]
        )
        logger.error(f"ExceptionGroup running reactive reply agent: {e_str}")

    except Exception as e:
        logger.error(f"Error running ReactiveAgent: {e}")
        return

    try:
        await runner.save_session_to_long_term_memory(session_id=session_id)
    except Exception as e:
        logger.error(f"Error saving session to long term memory: {e}")

    # Construct Agent notification
    data = AgentReplyResp(response=agents_resp)
    notification = AgentNotification(
        bot_id=bot_id,
        channel=msg.channel,
        chat_id=msg.chat_id,
        agent_type=AgentType.CHATOPS_REACTIVE_REPLY,
        msg_id=msg.msg_id,
        data=data,
    )

    # Send webhook notification
    await notification.save()
    await send_bot_notification(bot=bot, data=notification)
