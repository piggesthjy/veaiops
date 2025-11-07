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

from .agent_template import router as agent_template_router
from .event import router as event_router
from .inform_strategy import router as inform_strategy_router
from .subscribe import router as subscribe_router

event_center_router = APIRouter(prefix="/manager/event-center", tags=["Event Center"])

event_center_router.include_router(inform_strategy_router)
event_center_router.include_router(subscribe_router)
event_center_router.include_router(event_router)
event_center_router.include_router(agent_template_router)
