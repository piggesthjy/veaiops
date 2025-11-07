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

from typing import Dict

from beanie import PydanticObjectId
from fastapi.encoders import jsonable_encoder

from veaiops.schema.base import ChannelMsg, LarkUrl, TemplateVariable
from veaiops.schema.base.intelligent_threshold import (
    AliyunAlarmNotification,
    VolcengineAlarmNotification,
    ZabbixAlarmNotification,
)
from veaiops.schema.documents import AgentNotification, AgentTemplate, Chat, Event
from veaiops.schema.models.chatops import AgentReplyResp
from veaiops.schema.types import AgentType, ChannelType, EventStatus
from veaiops.utils.log import logger


async def get_card_templates(agent_type: AgentType) -> Dict[ChannelType, str]:
    """Get card template id.

    Args: agent_type(AgentType): Agent type

    Returns: Dict[ChannelType, str]: card template id for different channel
    """
    template_id = {}
    try:
        agent_templates = await AgentTemplate.find(
            AgentTemplate.agent_type == agent_type,
        ).to_list()
        if agent_templates:
            for template in agent_templates:
                template_id[template.channel] = template.template_id
    except Exception as e:
        logger.error(f"Failed to get card template id {e}")
    return template_id


async def message_card_build(event: Event):
    """Phase two: Message card build."""
    # Generate message card content with template id
    template_ids = await get_card_templates(agent_type=event.agent_type)
    variables = await build_variables(event=event)
    channel_msg: Dict[ChannelType, ChannelMsg] = {
        ChannelType.Webhook: ChannelMsg(
            channel=ChannelType.Webhook,
            template_variables=jsonable_encoder(event.raw_data, custom_encoder={PydanticObjectId: lambda r: str(r)}),
        ),
    }
    for channel, template_id in template_ids.items():
        logger.info(f"build message card for channel {channel} with template_id {template_id}")
        msg = ChannelMsg(channel=channel, template_id=template_id, template_variables=variables)
        channel_msg[channel] = msg

    logger.info(f"Phase two for event {event.id} completed. with channel_msg={channel_msg}")
    # For demonstration, directly update to the next status
    await event.set({Event.status: EventStatus.CARD_BUILT, Event.channel_msg: channel_msg})


async def build_variables(event: Event) -> TemplateVariable:
    """Build variables.

    Args:
        event (Event): The event.

    Returns:
        TemplateVariable: template card variables.
    """
    match event.agent_type:
        case AgentType.CHATOPS_INTEREST if isinstance(event.raw_data, AgentNotification):
            _title = "|".join([i.name for i in event.raw_data.data if i.is_satisfied])
            _analysis = "\n".join([i.thinking for i in event.raw_data.data if i.is_satisfied])
            chat_id = event.raw_data.chat_id
            chat = await Chat.find_one(Chat.chat_id == chat_id)
            chat_link = chat.chat_link if chat else ""
            chat_link = chat_link or ""
            var = TemplateVariable(
                background_color="red",
                class_title=_title,
                event_id=str(event.id),
                chat_id=chat_id,
                button_name="群聊跳转",
                button_link=LarkUrl(
                    url=chat_link,
                    pc_url=chat_link,
                    ios_url=chat_link,
                    android_url=chat_link,
                ),
                button_action="redirect",
                analysis=_analysis,
            )

        case AgentType.CHATOPS_REACTIVE_REPLY if isinstance(event.raw_data, AgentNotification) and isinstance(
            event.raw_data.data, AgentReplyResp
        ):
            _analysis = event.raw_data.data.response
            if event.raw_data.data.citations:
                _analysis += "\n\n"
                _analysis += "\n".join(
                    [f"[{i.title}]({i.source})" for idx, i in enumerate(event.raw_data.data.citations)]
                )

            var = TemplateVariable(
                chat_id=event.raw_data.chat_id,
                event_id=str(event.id),
                button_name="采纳",
                button_action="public",
                button_disable=True,
                analysis=_analysis,
            )
        case AgentType.CHATOPS_PROACTIVE_REPLY if isinstance(event.raw_data, AgentNotification) and isinstance(
            event.raw_data.data, AgentReplyResp
        ):
            _analysis = event.raw_data.data.response
            if event.raw_data.data.citations:
                _analysis += "\n\n"
                _analysis += "\n".join(
                    [f"[{i.title}]({i.source})" for idx, i in enumerate(event.raw_data.data.citations)]
                )
            var = TemplateVariable(
                chat_id=event.raw_data.chat_id,
                event_id=str(event.id),
                button_name="采纳（转为所有人可见）",
                button_action="public",
                analysis=_analysis,
            )
        case AgentType.INTELLIGENT_THRESHOLD if isinstance(event.raw_data, VolcengineAlarmNotification):
            _analysis = f"{event.raw_data.rule_condition}\n{event.raw_data.rule_name}"
            var = TemplateVariable(
                class_title="火山引擎智能阈值告警",
                chat_id="",
                event_id=str(event.id),
                button_name="告警屏蔽（告警聚合功能上线后生效）",
                button_disable=True,
                button_action="handle",
                analysis=_analysis,
            )
        case AgentType.INTELLIGENT_THRESHOLD if isinstance(event.raw_data, AliyunAlarmNotification):
            _analysis = (
                f"地域：{event.raw_data.regionName}\n"
                f"指标名称：{event.raw_data.metricName}\n"
                f"监控对象：{event.raw_data.dimensions} \n"
                f"持续时间： {event.raw_data.lastTime}\n"
                f"当前值： {event.raw_data.curValue}"
            )
            var = TemplateVariable(
                class_title="阿里云智能阈值告警",
                chat_id="",
                event_id=str(event.id),
                button_name="告警屏蔽（告警聚合功能上线后生效）",
                button_disable=True,
                button_action="handle",
                analysis=_analysis,
            )
        case AgentType.INTELLIGENT_THRESHOLD if isinstance(event.raw_data, ZabbixAlarmNotification):
            _analysis = f"{event.raw_data.message}"
            var = TemplateVariable(
                class_title="Zabbix智能阈值告警",
                chat_id="",
                event_id=str(event.id),
                button_name="告警屏蔽（告警聚合功能上线后生效）",
                button_disable=True,
                button_action="handle",
                analysis=_analysis,
            )
        case _:
            logger.error(f"Unknown agent type or raw_data format for event {event.id}")
            raise ValueError("Unknown agent type or raw_data format")

    return var
