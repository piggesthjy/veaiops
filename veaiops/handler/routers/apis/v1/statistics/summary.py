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
from datetime import datetime, timedelta, timezone

from beanie.odm.operators.find.comparison import Eq
from fastapi import APIRouter

from veaiops.handler.services import statistics
from veaiops.schema.documents import (
    Bot,
    Chat,
    Customer,
    Event,
    InformStrategy,
    IntelligentThresholdTask,
    IntelligentThresholdTaskVersion,
    Message,
    Product,
    Project,
    Subscribe,
    User,
)
from veaiops.schema.models import APIResponse, SystemStatistics
from veaiops.schema.types import EventStatus, IntelligentThresholdTaskStatus

summary_router = APIRouter(prefix="/summary")


@summary_router.get("/", response_model=APIResponse[SystemStatistics])
async def get_statistics() -> APIResponse[SystemStatistics]:
    """Get event statistics."""
    now = datetime.now(timezone.utc)
    latest_24h_time = now - timedelta(days=1)
    start_time_today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    start_time_last_1d = start_time_today - timedelta(days=1)
    start_time_last_7d = start_time_today - timedelta(days=7)
    start_time_last_30d = start_time_today - timedelta(days=30)

    (
        active_bots,
        active_chats,
        active_inform_strategies,
        active_subscribes,
        active_users,
        active_products,
        active_projects,
        active_customers,
        active_intelligent_threshold_tasks,
        active_intelligent_threshold_autoupdate_tasks,
        latest_1d_intelligent_threshold_success_num,
        latest_1d_intelligent_threshold_failed_num,
        latest_7d_intelligent_threshold_success_num,
        latest_7d_intelligent_threshold_failed_num,
        latest_30d_intelligent_threshold_success_num,
        latest_30d_intelligent_threshold_failed_num,
        latest_24h_events,
        last_1d_events,
        last_7d_events,
        last_30d_events,
        latest_24h_messages,
        last_1d_messages,
        last_7d_messages,
        last_30d_messages,
    ) = await asyncio.gather(
        statistics.get_item_count(model=Bot, start=None, end=None, condition=[Eq(Bot.is_active, True)]),
        statistics.get_item_count(model=Chat, start=None, end=None, condition=[Eq(Chat.is_active, True)]),
        statistics.get_item_count(
            model=InformStrategy, start=None, end=None, condition=[Eq(InformStrategy.is_active, True)]
        ),
        statistics.get_item_count(model=Subscribe, start=None, end=None, condition=[Eq(Subscribe.is_active, True)]),
        statistics.get_item_count(model=User, start=None, end=None, condition=[Eq(User.is_active, True)]),
        statistics.get_item_count(model=Product, start=None, end=None, condition=[Eq(Product.is_active, True)]),
        statistics.get_item_count(model=Project, start=None, end=None, condition=[Eq(Project.is_active, True)]),
        statistics.get_item_count(model=Customer, start=None, end=None, condition=[Eq(Customer.is_active, True)]),
        statistics.get_item_count(
            model=IntelligentThresholdTask,
            start=None,
            end=None,
            condition=[Eq(IntelligentThresholdTask.is_active, True)],
        ),
        statistics.get_item_count(
            model=IntelligentThresholdTask,
            start=None,
            end=None,
            condition=[Eq(IntelligentThresholdTask.is_active, True), Eq(IntelligentThresholdTask.auto_update, True)],
        ),
        statistics.get_item_count(
            model=IntelligentThresholdTaskVersion,
            start=start_time_last_1d,
            end=start_time_today,
            condition=[Eq(IntelligentThresholdTaskVersion.status, IntelligentThresholdTaskStatus.SUCCESS)],
        ),
        statistics.get_item_count(
            model=IntelligentThresholdTaskVersion,
            start=start_time_last_1d,
            end=start_time_today,
            condition=[Eq(IntelligentThresholdTaskVersion.status, IntelligentThresholdTaskStatus.FAILED)],
        ),
        statistics.get_item_count(
            model=IntelligentThresholdTaskVersion,
            start=start_time_last_7d,
            end=start_time_today,
            condition=[Eq(IntelligentThresholdTaskVersion.status, IntelligentThresholdTaskStatus.SUCCESS)],
        ),
        statistics.get_item_count(
            model=IntelligentThresholdTaskVersion,
            start=start_time_last_7d,
            end=start_time_today,
            condition=[Eq(IntelligentThresholdTaskVersion.status, IntelligentThresholdTaskStatus.FAILED)],
        ),
        statistics.get_item_count(
            model=IntelligentThresholdTaskVersion,
            start=start_time_last_30d,
            end=start_time_today,
            condition=[Eq(IntelligentThresholdTaskVersion.status, IntelligentThresholdTaskStatus.SUCCESS)],
        ),
        statistics.get_item_count(
            model=IntelligentThresholdTaskVersion,
            start=start_time_last_30d,
            end=start_time_today,
            condition=[Eq(IntelligentThresholdTaskVersion.status, IntelligentThresholdTaskStatus.FAILED)],
        ),
        statistics.get_item_count(
            model=Event,
            start=latest_24h_time,
            end=now,
            condition=[
                Eq(Event.status, EventStatus.DISPATCHED),
            ],
        ),
        statistics.get_item_count(
            model=Event,
            start=start_time_last_1d,
            end=start_time_today,
            condition=[
                Eq(Event.status, EventStatus.DISPATCHED),
            ],
        ),
        statistics.get_item_count(
            model=Event,
            start=start_time_last_7d,
            end=start_time_today,
            condition=[
                Eq(Event.status, EventStatus.DISPATCHED),
            ],
        ),
        statistics.get_item_count(
            model=Event,
            start=start_time_last_30d,
            end=start_time_today,
            condition=[
                Eq(Event.status, EventStatus.DISPATCHED),
            ],
        ),
        statistics.get_item_count(model=Message, start=latest_24h_time, end=now, condition=[]),
        statistics.get_item_count(model=Message, start=start_time_last_1d, end=start_time_today, condition=[]),
        statistics.get_item_count(model=Message, start=start_time_last_7d, end=start_time_today, condition=[]),
        statistics.get_item_count(model=Message, start=start_time_last_30d, end=start_time_today, condition=[]),
    )

    statistic = SystemStatistics(
        active_bots=active_bots,
        active_chats=active_chats,
        active_inform_strategies=active_inform_strategies,
        active_subscribes=active_subscribes,
        active_users=active_users,
        active_products=active_products,
        active_projects=active_projects,
        active_customers=active_customers,
        active_intelligent_threshold_tasks=active_intelligent_threshold_tasks,
        active_intelligent_threshold_autoupdate_tasks=active_intelligent_threshold_autoupdate_tasks,
        latest_1d_intelligent_threshold_success_num=latest_1d_intelligent_threshold_success_num,
        latest_1d_intelligent_threshold_failed_num=latest_1d_intelligent_threshold_failed_num,
        latest_7d_intelligent_threshold_success_num=latest_7d_intelligent_threshold_success_num,
        latest_7d_intelligent_threshold_failed_num=latest_7d_intelligent_threshold_failed_num,
        latest_30d_intelligent_threshold_success_num=latest_30d_intelligent_threshold_success_num,
        latest_30d_intelligent_threshold_failed_num=latest_30d_intelligent_threshold_failed_num,
        latest_24h_events=latest_24h_events,
        last_1d_events=last_1d_events,
        last_7d_events=last_7d_events,
        last_30d_events=last_30d_events,
        latest_24h_messages=latest_24h_messages,
        last_1d_messages=last_1d_messages,
        last_7d_messages=last_7d_messages,
        last_30d_messages=last_30d_messages,
    )
    return APIResponse(data=statistic)
