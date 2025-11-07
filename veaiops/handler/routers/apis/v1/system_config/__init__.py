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

from .bot import bot_router
from .bot_attribute import bot_attribute_router
from .customer import customer_router
from .global_config import global_config_router
from .product import product_router
from .project import project_router

system_config_router = APIRouter(prefix="/manager/system-config")

system_config_router.include_router(bot_router)
system_config_router.include_router(customer_router)
system_config_router.include_router(global_config_router)
system_config_router.include_router(product_router)
system_config_router.include_router(project_router)
system_config_router.include_router(bot_attribute_router)
