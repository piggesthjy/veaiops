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


from fastapi import APIRouter, Request
from pydantic import BaseModel

from veaiops.schema.models.base import APIResponse

global_config_router = APIRouter(prefix="/global-config", tags=["Global Config"])


class GlobalConfig(BaseModel):
    """Global configuration model."""


@global_config_router.get("/", response_model=APIResponse[GlobalConfig])
async def get_global_config(request: Request) -> APIResponse[GlobalConfig]:
    """Get global configuration.

    Args:
        request (Request): FastAPI request object.

    Returns:
        APIResponse[GlobalConfig]: API response containing global configuration.
    """
    return APIResponse(
        message="Global config retrieved successfully",
        data=GlobalConfig(),
    )
