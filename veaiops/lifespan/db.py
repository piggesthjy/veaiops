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

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from beanie import init_beanie
from fastapi import FastAPI
from opentelemetry.instrumentation.pymongo import PymongoInstrumentor
from pymongo import AsyncMongoClient

from veaiops.schema.documents import (
    AgentNotification,
    AgentTemplate,
    AlarmSyncRecord,
    AutoIntelligentThresholdTaskRecord,
    AutoIntelligentThresholdTaskRecordDetail,
    Bot,
    BotAttribute,
    Chat,
    Connect,
    Customer,
    DataSource,
    Event,
    EventNoticeDetail,
    EventNoticeFeedback,
    InformStrategy,
    IntelligentThresholdTask,
    IntelligentThresholdTaskVersion,
    Interest,
    Message,
    MetricTemplate,
    Product,
    Project,
    Subscribe,
    User,
    VeKB,
)
from veaiops.settings import MongoSettings, O11ySettings, get_settings
from veaiops.utils.log import logger


@asynccontextmanager
async def db_lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Initialize application services."""
    if get_settings(O11ySettings).enabled:
        PymongoInstrumentor().instrument(capture_statement=True)
        logger.info("OpenTelemetry for PymongoInstrumentor started.")

    app.mongo_client = AsyncMongoClient(get_settings(MongoSettings).mongo_uri)  # type: ignore
    logger.info("Initializing ...")

    app.mongodb_veaiops = app.mongo_client.veaiops  # type: ignore
    await init_beanie(
        app.mongodb_veaiops,
        document_models=[
            Message,
            Chat,
            Bot,
            User,
            Customer,
            Product,
            Project,
            VeKB,
            DataSource,
            Connect,
            Interest,
            Event,
            EventNoticeDetail,
            EventNoticeFeedback,
            InformStrategy,
            Subscribe,
            IntelligentThresholdTask,
            IntelligentThresholdTaskVersion,
            AutoIntelligentThresholdTaskRecord,
            AutoIntelligentThresholdTaskRecordDetail,
            AlarmSyncRecord,
            AgentTemplate,
            BotAttribute,
            AgentNotification,
            MetricTemplate,
        ],
    )  # type: ignore
    logger.info("Connected to MongoDB db=veaiops")

    yield

    await app.mongo_client.close()  # type: ignore
    logger.info("Disconnected from MongoDB")
