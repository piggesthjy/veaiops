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
from datetime import timedelta

from beanie import SortDirection
from beanie.operators import LTE, Eq, In, Or

from veaiops.schema.documents import Bot, Event as VeAIOpsEvent, EventNoticeFeedback, Message
from veaiops.schema.types import AgentType, FeedbackActionType
from veaiops.utils.log import logger

from .review_answer_agent import run_answer_review_agent
from .review_link_agent import run_review_external_link
from .review_query_agent import run_query_review_agent

REVIEW_MINUTES_DELTA = 20


async def run_review_agent(bot: Bot, msg: Message) -> None:
    """Runs the review agent.

    Args:
        bot (Bot): The bot object.
        msg (Message): The message object containing the content to review.
    """
    # ----- Review external links -----
    logger.info("Starting review external link agent...")
    review_link_task = asyncio.create_task(run_review_external_link(bot=bot, msg=msg))
    review_link_task.set_name("ReviewExternalLinkAgentTask")
    review_link_task.add_done_callback(lambda t: logger.info("Review external link agent task completed."))

    # ----- Review proactive replies -----
    time_delta = msg.msg_time - timedelta(minutes=REVIEW_MINUTES_DELTA)

    candidate_msgs = (
        await Message.find(
            LTE(Message.msg_time, time_delta),
            Eq(Message.channel, msg.channel),
            Eq(Message.bot_id, msg.bot_id),
            Eq(Message.chat_id, msg.chat_id),
            Eq(Message.proactive_reply.review_status, "pending"),
            Or(Eq(Message.proactive_reply.is_first_answer, True), Eq(Message.proactive_reply.is_first_query, True)),
        )
        .sort([("msg_time", SortDirection.DESCENDING)])
        .to_list()
    )

    # Get pending review msgs with feedbacks
    pending_review_msgs = []
    for candidate in candidate_msgs:
        logger.info(f"Found candidate message for review: bot_id={bot.bot_id}, msg_id={candidate.msg_id}")

        events = await VeAIOpsEvent.find(
            VeAIOpsEvent.agent_type == AgentType.CHATOPS_PROACTIVE_REPLY,
            VeAIOpsEvent.raw_data.msg_id == candidate.msg_id,
        ).to_list()

        feedbacks = await EventNoticeFeedback.find(
            In(EventNoticeFeedback.event_main_id, [e.id for e in events]),
        ).to_list()
        logger.info(f"Found {len(feedbacks)} feedbacks for candidate message msg_id={candidate.msg_id}")
        has_positive_feedback = False
        for f in feedbacks:
            if f.action in [FeedbackActionType.Public, FeedbackActionType.Like]:
                has_positive_feedback = True

        if has_positive_feedback:
            logger.info(f"Positive feedback found for candidate message msg_id={candidate.msg_id}, skipping review.")
            await candidate.set({Message.proactive_reply.review_status: "keep"})
            continue
        else:
            pending_review_msgs.append(candidate)

    logger.info(f"Found {len(pending_review_msgs)} candidate messages for pending review.")

    pending_review_queries = []
    pending_review_answers = []

    for msg in pending_review_msgs:
        if msg.proactive_reply.is_first_answer:
            pending_review_answers.append(msg)
        elif msg.proactive_reply.is_first_query:
            pending_review_queries.append(msg)
        else:
            logger.warning(f"Message msg_id={msg.msg_id} is neither answered nor queried, skipping.")

    review_query_tasks = []
    review_answer_tasks = []
    for msg in pending_review_queries:
        review_query_tasks.append(run_query_review_agent(bot=bot, msg=msg))

    for msg in pending_review_answers:
        review_answer_tasks.append(run_answer_review_agent(bot=bot, msg=msg))

    query_review_rets = asyncio.gather(*review_query_tasks, return_exceptions=True)
    answer_review_rets = asyncio.gather(*review_answer_tasks, return_exceptions=True)

    for ret in await query_review_rets:
        if isinstance(ret, Exception):
            logger.error(f"Error occurred in review query agent: {ret}")
    for ret in await answer_review_rets:
        if isinstance(ret, Exception):
            logger.error(f"Error occurred in review answer agent: {ret}")
