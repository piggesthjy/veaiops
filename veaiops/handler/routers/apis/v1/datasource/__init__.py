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

# Copyright 2025 Beijing Volcano Engine Technology Co., Ltd. and/or its affiliates
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

from .aliyun import aliyun_router
from .base import base_router
from .connect import connect_router
from .template import template_router
from .volcengine import volcengine_router
from .zabbix import zabbix_router

datasource_router = APIRouter(prefix="/datasource", tags=["Data Sources"])

datasource_router.include_router(base_router)
datasource_router.include_router(zabbix_router)
datasource_router.include_router(aliyun_router)
datasource_router.include_router(volcengine_router)
datasource_router.include_router(connect_router)
datasource_router.include_router(template_router)
