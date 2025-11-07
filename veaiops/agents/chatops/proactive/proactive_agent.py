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
from datetime import datetime
from typing import AsyncGenerator

from google.adk.agents.invocation_context import InvocationContext
from google.adk.events import Event
from google.genai.types import Content, Part

# from google.adk.agents import BaseAgent
from veadk import Agent
from volcengine.viking_knowledgebase import Collection

from veaiops.agents.chatops.memory import init_stm
from veaiops.schema.documents import Bot, Message, VeKB
from veaiops.schema.types import CitationType
from veaiops.utils.crypto import decrypt_secret_value
from veaiops.utils.kb import EnhancedVikingKBService, convert_viking_to_citations
from veaiops.utils.log import logger

from ..instructions import load_analysis_instruction, load_identify_instruction, load_rewrite_instruction
from ..validate import validate_state_result
from .analysis_agent import (
    STATE_ANALYSIS_RESULT,
    STATE_KB_POINTS,
    STATE_OVERALL_QUERY,
    AnalysisResult,
    init_analysis_agent,
)
from .identify_agent import STATE_IDENTIFY_RESULT, IdentifyResult, init_identify_agent
from .rewrite_agent import STATE_REWRITE_RESULT, RewriteResult, init_rewrite_agent

PROACTIVE_AGENT_NAME = "主动回复助手"
KB_AGENT_NAME = "kb"


class ProactiveAgent(Agent):
    """Custom agent for proactive multi-agent collaboration.

    This agent orchestrates multiple sub-agents to identify, rewrite, and analyze user queries,
    enabling proactive responses in group chat scenarios.
    """

    # --- Field Declarations for Pydantic ---
    # Declare the agents passed during initialization as class attributes with type hints
    identifier: Agent
    rewriter: Agent
    analyzer: Agent
    vikingkb: EnhancedVikingKBService
    kb_collections: list[Collection]

    # model_config allows setting Pydantic configurations if needed, e.g., arbitrary_types_allowed
    model_config = {"arbitrary_types_allowed": True}

    def __init__(
        self,
        name: str,
        identifier: Agent,
        rewriter: Agent,
        analyzer: Agent,
        kb_collections: list[Collection],
        *args,
        **kwargs,
    ):
        """Initializes the ProactiveAgent."""
        # Create internal agents *before* calling super().__init__

        # Pydantic will validate and assign them based on the class annotations.
        super().__init__(
            name=name,
            identifier=identifier,
            rewriter=rewriter,
            analyzer=analyzer,
            kb_collections=kb_collections,
            *args,
            **kwargs,
        )

    async def _run_async_impl(self, ctx: InvocationContext) -> AsyncGenerator[Event, None]:
        logger.info(f"[{self.name}] Running ...")

        # 1. Run the Identifier Agent
        logger.info(f"[{self.identifier.name}] Running ... ")
        async for event in self.identifier.run_async(ctx):
            logger.debug(f"[{self.identifier.name}] event : {event.model_dump_json(indent=2, exclude_none=True)}")

            yield event

        if not validate_state_result(ctx=ctx, state_key=STATE_IDENTIFY_RESULT, agent_name=self.identifier.name):
            return

        logger.info(f"[{self.identifier.name}] Identification is completed {ctx.session.state[STATE_IDENTIFY_RESULT]}.")

        identification_result = IdentifyResult.model_validate(obj=ctx.session.state[STATE_IDENTIFY_RESULT])

        # 2. Do not proceed if out of scope
        if not identification_result.within_scope:
            logger.debug(f"[{self.identifier.name}] The question is out of scope. Ending proactive reply process.")
            return

        logger.info(f"[{self.rewriter.name}] Running ... ")
        # 3. Rewrite the question into one or more search queries
        async for event in self.rewriter.run_async(ctx):
            logger.info(f"[{self.rewriter.name}] event : {event.model_dump_json(indent=2, exclude_none=True)}")

            yield event

        if not validate_state_result(ctx=ctx, state_key=STATE_REWRITE_RESULT, agent_name=self.rewriter.name):
            return

        rewrite_result = RewriteResult.model_validate(ctx.session.state[STATE_REWRITE_RESULT])

        logger.info(f"[{self.rewriter.name}] Rewriting is completed {rewrite_result}.")

        logger.info(f"[{KB_AGENT_NAME}] Retrieving knowledge ... ")
        rag_tasks = []
        rag_tags = []
        for subquery in rewrite_result.sub_queries:
            for collection in self.kb_collections:
                # 4. Retrieve relevant knowledge from the knowledgebase using the rewritten queries

                logger.info(
                    f"[{KB_AGENT_NAME}] Retrieving from collection {collection.collection_name} with query: {subquery}"
                )
                rag_tasks.append(
                    self.vikingkb.async_search_knowledge(
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
                kb_format_list.append(
                    f"<doc>{i + 1}</doc>\n# {doc.title}\nDoc update time: {update_time}\n{doc.content}\n"
                )
            else:
                kb_format_list.append(f"<doc>{i + 1}</doc>\nDoc update time: {update_time}\n{doc.content.strip()}\n")

        kb_points = "\n\n".join(kb_format_list)

        ctx.session.state[STATE_KB_POINTS] = kb_points
        ctx.session.state[STATE_OVERALL_QUERY] = rewrite_result.overall_query

        logger.info(f"[{self.analyzer.name}] Running {self.name} ... ")
        # 4. Analyze the question scope and the knowledge to determine if it can be answered
        async for event in self.analyzer.run_async(ctx):
            logger.info(f"[{self.analyzer.name}] event : {event.model_dump_json(indent=2, exclude_none=True)}")

            yield event

        if not validate_state_result(ctx=ctx, state_key=STATE_ANALYSIS_RESULT, agent_name=self.analyzer.name):
            return

        analysis_result = AnalysisResult.model_validate(ctx.session.state[STATE_ANALYSIS_RESULT])
        logger.info(f"[{self.analyzer.name}] Analysis is completed {analysis_result}.")
        if not analysis_result.is_answerable or not analysis_result.answer:
            logger.info(f"[{self.analyzer.name}] The question cannot be answered based on the knowledge.")
            return

        selected_citations = []
        for i in analysis_result.citations or []:
            if 1 <= i <= len(citations):
                selected_citations.append(citations[i - 1])

        response_citations = Event(
            content=Content(
                parts=[Part(text=i.model_dump_json()) for i in selected_citations],
                role="model",
            ),
            author=KB_AGENT_NAME,
        )
        yield response_citations
        logger.info(f"[{self.name}] Citations finished.")
        logger.info(f"[{self.name}] Completed.")


async def init_proactive_agent(bot: Bot, msg: Message, name: str = PROACTIVE_AGENT_NAME) -> ProactiveAgent:
    """Initialize proactive multi agents.

    Args:
        bot (Bot): The bot instance.
        msg (Message): The message instance.
        name (str): Name of the agent.

    Raises:
        ValueError: If the bot is not found.

    Returns:
        ProactiveAgent: The initialized proactive agent.
    """
    app_name = name
    user_id = bot.bot_id
    session_id = msg.msg_id

    logger.info(f"Initializing proactive agent for bot_id={bot.bot_id}, channel={bot.channel}")

    _identify_instruction = load_identify_instruction()
    IdentifyAgent = await init_identify_agent(
        bot=bot, description=_identify_instruction.description, instruction=_identify_instruction.instruction
    )
    _rewrite_instruction = load_rewrite_instruction()
    RewriteAgent = await init_rewrite_agent(
        bot=bot, description=_rewrite_instruction.description, instruction=_rewrite_instruction.instruction
    )
    _analysis_instruction = load_analysis_instruction()
    AnalysisAgent = await init_analysis_agent(
        bot=bot, description=_analysis_instruction.description, instruction=_analysis_instruction.instruction
    )
    STM = await init_stm(app_name=app_name, session_id=session_id, user_id=user_id)
    VIKING_KB = EnhancedVikingKBService(
        ak=decrypt_secret_value(bot.volc_cfg.ak),
        sk=decrypt_secret_value(bot.volc_cfg.sk),
    )

    vekbs = await VeKB.find(VeKB.bot_id == bot.bot_id, VeKB.channel == msg.channel).to_list()
    knowledgebases = []

    for vekb in vekbs:
        try:
            collection = VIKING_KB.get_collection(collection_name=vekb.collection_name, project=vekb.project)
            knowledgebases.append(collection)
        except Exception as e:
            logger.error(f"Error getting collection for vekb {vekb}: {e}")
            continue

    ProactiveMultiAgents = ProactiveAgent(
        name=app_name,
        description="An Agent can proactively reply to group chat messages.",
        identifier=IdentifyAgent,
        rewriter=RewriteAgent,
        analyzer=AnalysisAgent,
        kb_collections=knowledgebases,
        vikingkb=VIKING_KB,
        short_term_memory=STM,
        model_name=bot.agent_cfg.name,
        model_provider=bot.agent_cfg.provider,
        model_api_base=bot.agent_cfg.api_base,
        model_api_key=decrypt_secret_value(bot.agent_cfg.api_key),
    )

    return ProactiveMultiAgents
