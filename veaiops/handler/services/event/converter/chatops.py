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

from datetime import datetime, timedelta, timezone
from typing import Optional

from veaiops.schema.documents import AgentNotification, Bot, Event
from veaiops.schema.types import AttributeKey, EventLevel, EventStatus, InterestActionType
from veaiops.utils.log import logger


async def convert_interest_to_event(notification: AgentNotification) -> Optional[Event]:
    """Convert AgentNotification to Event.

    Args:
    notification (AgentNotification): The interest event notification object to be converted.

    Returns:
        Event: Event Object to create or None
    """
    if not notification.data:
        logger.error("no config matched, pass")
        return None

    status = EventStatus.INITIAL
    matched = [c for c in notification.data if c.is_satisfied]
    filtered = [c for c in matched if c.action_category == InterestActionType.Filter]
    max_level = EventLevel.P2
    if not matched:
        logger.info("No matched interest satisfied config")
        status = EventStatus.CHATOPS_NOT_MATCHED
    elif filtered:
        logger.info("rejected interest event for filter action")
        status = EventStatus.CHATOPS_RULE_FILTERED
    else:
        silence_delta = min((c.silence_delta for c in matched), default=timedelta())

        level_order = [EventLevel.P0, EventLevel.P1, EventLevel.P2, None]
        levels = [c.level for c in matched if c.level is not None]
        max_level = min(levels, key=lambda x: level_order.index(x)) if levels else EventLevel.P2

        query_conditions = {
            "created_at": {"$gte": datetime.now(timezone.utc) - silence_delta},
            "raw_data.bot_id": {"$eq": notification.bot_id},
            "raw_data.chat_id": {"$eq": notification.chat_id},
            "agent_type": {"$eq": notification.agent_type},
            "status": {"$eq": EventStatus.DISPATCHED},
        }
        exists = await Event.find_one(query_conditions)
        if exists:
            logger.info(
                f"{notification.bot_id} {notification.chat_id} already pushed interest notification(s)"
                f" in {silence_delta}"
            )
            status = EventStatus.CHATOPS_RULE_RESTRAINED

    bot = await Bot.find_one(Bot.bot_id == notification.bot_id, Bot.channel == notification.channel)
    if not bot:
        logger.error(f"bot {notification.channel} {notification.bot_id} not found")
        return None
    products = await bot.get_bot_attributes(name=AttributeKey.Product)
    projects = await bot.get_bot_attributes(name=AttributeKey.Project)
    customers = await bot.get_bot_attributes(name=AttributeKey.Customer)

    return Event(
        agent_type=notification.agent_type,  # Or another appropriate default
        event_level=max_level,  # Or another appropriate default
        raw_data=notification,
        product=products,
        customer=customers,
        project=projects,
        status=status,
        datasource_type=None,
    )


async def convert_reactive_to_event(notification: AgentNotification) -> Optional[Event]:
    """Convert AgentNotification to Event.

    Args:
    notification (AgentNotification): The interest event notification object to be converted.

    Returns:
        Event: Event Object to create or None
    """
    # TODO: add load other info if necessary
    return Event(
        agent_type=notification.agent_type,  # Or another appropriate default
        event_level=notification.level or EventLevel.P2,  # Or another appropriate default
        raw_data=notification,
        status=EventStatus.INITIAL,
    )


async def convert_proactive_to_event(notification: AgentNotification) -> Optional[Event]:
    """Convert AgentNotification to Event.

    Args:
    notification (AgentNotification): The interest event notification object to be converted.

    Returns:
        Event: Event Object to create or None
    """
    # TODO: add load other info if necessary
    return Event(
        agent_type=notification.agent_type,  # Or another appropriate default
        event_level=notification.level or EventLevel.P2,  # Or another appropriate default
        raw_data=notification,
        status=EventStatus.INITIAL,
    )
