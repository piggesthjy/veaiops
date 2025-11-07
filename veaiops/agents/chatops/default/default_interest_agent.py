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

from veaiops.schema.documents import Interest
from veaiops.schema.types import ChannelType, InterestActionType, InterestInspectType
from veaiops.utils.log import logger


async def set_default_interest_agents(bot_id: str, channel: ChannelType) -> bool:
    """Set default configuration in database.

    Args:
        bot_id (str): Bot ID for the configuration
        channel (ChannelType): Channel type for the configuration

    Returns:
        bool: Created default configuration in DB or not
    """
    # Create default Interest configurations
    default_interests = [
        Interest(
            name="多个客户受影响",
            description="多个用户、客户出现问题",
            examples_positive=[
                "不止一个客户出现问题了",
                "很多客户都反馈报错",
                "多个用户频繁出现的线上问题",
            ],
            examples_negative=["收到了一个反馈"],
            action_category=InterestActionType.Detect,
            inspect_category=InterestInspectType.Semantic,
            is_active=True,
            bot_id=bot_id,
            channel=channel,
        ),
        Interest(
            name="多个地区受影响",
            description="多个地区出现问题",
            examples_positive=["多个region都出现了问题", "北京与上海的用户都反馈报错"],
            examples_negative=["线上环境的问题"],
            action_category=InterestActionType.Detect,
            inspect_category=InterestInspectType.Semantic,
            is_active=True,
            bot_id=bot_id,
            channel=channel,
        ),
        Interest(
            name="客户业务受损",
            description="客户、用户、业务、线上服务等受到影响、流量跌零、故障等。",
            examples_positive=["线上流量跌零了", "业务受到影响了"],
            examples_negative=["帮忙看看这个服务问题", "有问题"],
            action_category=InterestActionType.Detect,
            inspect_category=InterestInspectType.Semantic,
            is_active=True,
            bot_id=bot_id,
            channel=channel,
        ),
        Interest(
            name="客户产生负面情绪",
            description="客户关系问题、投诉、客户关系差、客户风险，或相对严重的负面客户情绪——而不是客户的轻微反馈",
            examples_positive=["客户很生气", "客户非常不满", "客户威胁要投诉", "客户说要找你们老板"],
            examples_negative=["客户提供了一些建议"],
            action_category=InterestActionType.Detect,
            inspect_category=InterestInspectType.Semantic,
            inspect_history=2,
            is_active=True,
            bot_id=bot_id,
            channel=channel,
        ),
        Interest(
            name="测试环境",
            description="在测试环境中出现的问题",
            examples_positive=[
                "测试环境出现问题",
                "在测试环境中复现了线上问题",
                "测试环境报错",
            ],
            examples_negative=["线上环境的问题"],
            action_category=InterestActionType.Filter,
            inspect_category=InterestInspectType.Semantic,
            inspect_history=0,
            is_active=True,
            bot_id=bot_id,
            channel=channel,
        ),
        Interest(
            name="SVIP客户",
            description="在对话中提及SVIP客户",
            action_category=InterestActionType.Detect,
            inspect_category=InterestInspectType.RE,
            regular_expression=r"(?i)svip",
            is_active=True,
            bot_id=bot_id,
            channel=channel,
        ),
    ]

    tasks = []
    for interest in default_interests:
        tasks.append(interest.save())

    rets = await asyncio.gather(*tasks, return_exceptions=True)

    for ret in rets:
        if isinstance(ret, Exception):
            logger.error(f"Failed to create default config for bot_id={bot_id}, error: {ret}")

    logger.info(f"Created default config for bot_id={bot_id}")

    return True
