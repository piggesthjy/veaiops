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
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request

from veaiops.channel import REGISTRY
from veaiops.handler.errors import BadRequestError
from veaiops.schema.types import ChannelType
from veaiops.utils.log import logger

from .verify import verify_sign

webcallbacks_router = APIRouter(prefix="/callback", include_in_schema=False)


@webcallbacks_router.post("/{provider}", dependencies=[Depends(verify_sign)])
async def payload_callback(provider: ChannelType, request: Request) -> Any:
    """Generic event callback endpoint. Provider should match a registered transformer name."""
    channel = REGISTRY.get(provider)
    if channel is None:
        logger.warning(f"Received event callback for unknown provider: {provider}")
        raise HTTPException(status_code=404, detail="unknown provider")

    adapter = channel()

    try:
        payload = await request.json()
    except Exception:
        logger.exception("Failed to parse JSON payload")
        raise BadRequestError(message="Invalid json payload")

    event_resp = await adapter.callback_handle(payload=payload)
    logger.info(f"Handle event message. provider={provider}")
    return event_resp
