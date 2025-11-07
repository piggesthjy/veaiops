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

"""Shared fixtures for statistics router tests."""

from datetime import datetime, timezone

import pytest_asyncio
from beanie import PydanticObjectId

from veaiops.schema.documents import (
    Chat,
    Customer,
    Event,
    IntelligentThresholdTask,
    IntelligentThresholdTaskVersion,
    Message,
    Product,
    Project,
)
from veaiops.schema.types import (
    AgentType,
    ChannelType,
    ChatType,
    DataSourceType,
    EventLevel,
    EventStatus,
    IntelligentThresholdDirection,
    IntelligentThresholdTaskStatus,
    MsgSenderType,
)


@pytest_asyncio.fixture
async def test_chat_for_stats(test_bot):
    """Create a chat for statistics tests."""
    chat = await Chat(
        chat_id="stats_test_chat",
        bot_id=test_bot.bot_id,
        channel=test_bot.channel,
        name="Stats test chat",
        enable_func_interest=True,
        enable_func_proactive_reply=True,
    ).insert()

    yield chat

    await chat.delete()


@pytest_asyncio.fixture
async def test_product():
    """Create an active product for statistics tests."""
    product = await Product(
        product_id="test_product_id",
        name="Test Product",
        is_active=True,
    ).insert()

    yield product

    await product.delete()


@pytest_asyncio.fixture
async def test_project():
    """Create an active project for statistics tests."""
    project = await Project(
        project_id="test_project_id",
        name="Test Project",
        is_active=True,
    ).insert()

    yield project

    await project.delete()


@pytest_asyncio.fixture
async def test_customer():
    """Create an active customer for statistics tests."""
    customer = await Customer(
        customer_id="test_customer_id",
        name="Test Customer",
        desensitized_name="Desensitized Customer",
        is_active=True,
    ).insert()

    yield customer

    await customer.delete()


@pytest_asyncio.fixture
async def test_intelligent_threshold_task_for_stats(test_connect):
    """Create an active intelligent threshold task for statistics tests."""
    task = await IntelligentThresholdTask(
        task_name="Test Task",
        datasource_id=test_connect.id if test_connect.id else PydanticObjectId(),
        datasource_type=DataSourceType.Aliyun,
        auto_update=False,
        projects=["test_project"],
        is_active=True,
    ).insert()

    yield task

    await task.delete()


@pytest_asyncio.fixture
async def test_intelligent_threshold_task_autoupdate(test_connect):
    """Create an active intelligent threshold task with auto_update for statistics tests."""
    task = await IntelligentThresholdTask(
        task_name="Test Task AutoUpdate",
        datasource_id=test_connect.id if test_connect.id else PydanticObjectId(),
        datasource_type=DataSourceType.Aliyun,
        auto_update=True,
        projects=["test_project"],
        is_active=True,
    ).insert()

    yield task

    await task.delete()


@pytest_asyncio.fixture
async def test_intelligent_threshold_task_version_success(test_intelligent_threshold_task_for_stats):
    """Create a successful intelligent threshold task version for statistics tests."""
    from veaiops.schema.models.template.metric import MetricTemplateValue

    version = await IntelligentThresholdTaskVersion(
        task_id=test_intelligent_threshold_task_for_stats.id,
        metric_template_value=MetricTemplateValue(),
        n_count=30,
        direction=IntelligentThresholdDirection.UP,
        status=IntelligentThresholdTaskStatus.SUCCESS,
        version=1,
        result=None,
        created_at=datetime.now(timezone.utc),
    ).insert()

    yield version

    await version.delete()


@pytest_asyncio.fixture
async def test_intelligent_threshold_task_version_failed(test_intelligent_threshold_task_for_stats):
    """Create a failed intelligent threshold task version for statistics tests."""
    from veaiops.schema.models.template.metric import MetricTemplateValue

    version = await IntelligentThresholdTaskVersion(
        task_id=test_intelligent_threshold_task_for_stats.id,
        metric_template_value=MetricTemplateValue(),
        n_count=30,
        direction=IntelligentThresholdDirection.DOWN,
        status=IntelligentThresholdTaskStatus.FAILED,
        version=2,
        result=None,
        created_at=datetime.now(timezone.utc),
    ).insert()

    yield version

    await version.delete()


@pytest_asyncio.fixture
async def test_event_dispatched():
    """Create a dispatched event for statistics tests."""
    from veaiops.schema.documents import AgentNotification
    from veaiops.schema.models.chatops import AgentReplyResp

    event = await Event(
        agent_type=AgentType.CHATOPS_INTEREST,
        event_level=EventLevel.P1,
        raw_data=AgentNotification(
            bot_id="test_bot",
            channel=ChannelType.Lark,
            msg_id="test_msg",
            chat_id="test_chat",
            agent_type=AgentType.CHATOPS_INTEREST,
            data=AgentReplyResp(response="Test reply"),
        ),
        datasource_type=DataSourceType.Aliyun,
        status=EventStatus.DISPATCHED,
        created_at=datetime.now(timezone.utc),
    ).insert()

    yield event

    await event.delete()


@pytest_asyncio.fixture
async def test_message_for_stats(test_bot):
    """Create a test message for statistics tests."""
    message = await Message(
        bot_id=test_bot.bot_id,
        chat_id="stats_test_chat",
        channel=test_bot.channel,
        chat_type=ChatType.Group,
        msg="Test message for stats",
        msg_id="test_msg_id",
        msg_time=datetime.now(timezone.utc),
        msg_sender_id="test_user_id",
        msg_sender_type=MsgSenderType.USER,
    ).insert()

    yield message

    await message.delete()
