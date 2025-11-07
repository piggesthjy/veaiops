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
from fastapi import APIRouter

from .auth import auth_router as auth_router
from .chat import chat_router
from .datasource import datasource_router
from .event_center import event_center_router
from .intelligent_threshold import intelligent_threshold_router
from .rule_center import rule_center_router
from .statistics import statistics_router
from .system_config import system_config_router
from .user import user_router
from .webcallbacks import webcallbacks_router

__all__ = ["backend_router"]

backend_router = APIRouter(prefix="/apis/v1")
backend_router.include_router(datasource_router)
backend_router.include_router(event_center_router)
backend_router.include_router(intelligent_threshold_router)
backend_router.include_router(auth_router)
backend_router.include_router(chat_router)
backend_router.include_router(rule_center_router)
backend_router.include_router(system_config_router)
backend_router.include_router(webcallbacks_router)
backend_router.include_router(user_router)
backend_router.include_router(statistics_router)
