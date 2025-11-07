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

from veaiops.channel import REGISTRY
from veaiops.schema.documents import (
    Event,
    EventNoticeDetail,
)
from veaiops.schema.types import EventStatus
from veaiops.utils.log import logger


async def notification_dispatch(event: Event):
    """Phase three: Notification dispatch."""
    # Dispatch notifications

    notice_tasks = []
    notice_details = await EventNoticeDetail.find(
        EventNoticeDetail.event_main_id == event.id,
    ).to_list()
    for notice_detail in notice_details:
        logger.info(f"dispatch notice detail {notice_detail}")
        provider = notice_detail.notice_channel
        channel = REGISTRY.get(provider)
        if channel is None:
            logger.warning(f"Unknown channel for provider: {provider}")
            continue
        adapter = channel()
        channel_msg = event.channel_msg.get(provider)
        if channel_msg is None:
            logger.warning(f"channel_msg is none for provider: {provider}")
            continue

        logger.info(f"channel_msg for {provider} detail: {channel_msg}")

        notice_tasks.append(
            adapter.send_message(
                content=channel_msg.template_variables,
                agent_type=event.agent_type,
                target=notice_detail.target,
                template_id=channel_msg.template_id,
                **notice_detail.extra,
            )
        )

    tasks_rets = await asyncio.gather(*notice_tasks, return_exceptions=True)

    for notice_detail, out_message_ids in zip(notice_details, tasks_rets):
        if isinstance(out_message_ids, Exception):
            logger.error(f"Failed to send notification for notice_detail {notice_detail.id}: {out_message_ids}")
        elif out_message_ids is None:
            logger.error(f"Failed to send notification for notice_detail {notice_detail.id}: No message ID returned")
        elif isinstance(out_message_ids, list):
            logger.info(f"Notification sent for notice_detail {notice_detail.id}, out_message_id={out_message_ids}")

            event_notice_detail = await EventNoticeDetail.get(notice_detail.id)
            if event_notice_detail:
                event_notice_detail.out_message_ids = out_message_ids
                await event_notice_detail.save()

    logger.info(f"Phase three for event {event.id} completed.")
    # For demonstration, directly update to the next status
    await event.set({Event.status: EventStatus.DISPATCHED})
