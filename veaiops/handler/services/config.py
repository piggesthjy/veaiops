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

from datetime import datetime, timezone
from typing import Type, TypeVar

from beanie import PydanticObjectId

from veaiops.handler.errors import RecordNotFoundError
from veaiops.schema.documents.config.base import BaseConfigDocument
from veaiops.schema.models import APIResponse

T = TypeVar("T", bound=BaseConfigDocument)


async def toggle_active(model: Type[T], uid: PydanticObjectId, active: bool) -> APIResponse:
    """Common function for toggling active/disabled items.

    Args:
        model (Type[T]): Detail Config Model
        uid (PydanticObjectId): Document ID
        active (bool): True or False
    """
    item = await model.get(uid)
    if not item:
        raise RecordNotFoundError(message=f"{model.__name__} not found. id: {uid}")

    item.is_active = active
    item.updated_at = datetime.now(timezone.utc)
    await item.save()

    return APIResponse(message=f"toggle {model.__name__} : {uid} is_active to {active} successfully")


async def delete(
    model: Type[T],
    uid: PydanticObjectId,
) -> APIResponse:
    """Common function for delete item.

    Args:
        model (Type[T]): Detail Config Model
        uid (PydanticObjectId): Document ID
    """
    item = await model.get(uid)
    if not item:
        raise RecordNotFoundError(message=f"{model.__name__} not found. id: {uid}")
    await item.delete()
    return APIResponse(message=f"{model.__name__} : {uid} deleted successfully")
