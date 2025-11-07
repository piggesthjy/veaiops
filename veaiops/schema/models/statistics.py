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

from pydantic import BaseModel, Field


class SystemStatistics(BaseModel):
    """Event statistics model."""

    active_bots: int = Field(..., description="The number of active bots.")
    active_chats: int = Field(..., description="The number of active chats.")
    active_inform_strategies: int = Field(..., description="The number of active inform strategies.")
    active_subscribes: int = Field(..., description="The number of active subscribes.")

    active_users: int = Field(..., description="The number of active users.")
    active_products: int = Field(..., description="The number of active products.")
    active_projects: int = Field(..., description="The number of active projects.")
    active_customers: int = Field(..., description="The number of active customers.")

    active_intelligent_threshold_tasks: int = Field(
        ..., description="The number of active intelligent threshold tasks."
    )
    active_intelligent_threshold_autoupdate_tasks: int = Field(
        ..., description="The number of active intelligent threshold autoupdate tasks."
    )
    latest_1d_intelligent_threshold_success_num: int = Field(
        ..., description="The latest day intelligent threshold success number."
    )
    latest_1d_intelligent_threshold_failed_num: int = Field(
        ..., description="The latest day intelligent threshold failed number."
    )
    latest_7d_intelligent_threshold_success_num: int = Field(
        ..., description="The latest 7 days intelligent threshold success number."
    )
    latest_7d_intelligent_threshold_failed_num: int = Field(
        ..., description="The latest 7 days intelligent threshold failed number."
    )
    latest_30d_intelligent_threshold_success_num: int = Field(
        ..., description="The latest 30 days intelligent threshold success number."
    )
    latest_30d_intelligent_threshold_failed_num: int = Field(
        ..., description="The latest 30 days intelligent threshold failed number."
    )

    latest_24h_events: int = Field(..., description="The latest 24h events.")
    last_1d_events: int = Field(..., description="The last day events.")
    last_7d_events: int = Field(..., description="The latest 7d events.")
    last_30d_events: int = Field(..., description="The latest 30d events.")

    latest_24h_messages: int = Field(..., description="The latest 24h messages.")
    last_1d_messages: int = Field(..., description="The latest day messages.")
    last_7d_messages: int = Field(..., description="The latest 7d messages.")
    last_30d_messages: int = Field(..., description="The latest 30d messages.")
