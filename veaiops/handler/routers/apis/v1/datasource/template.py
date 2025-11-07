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
from typing import Any, Dict, List

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, status

from veaiops.handler.errors.errors import AlreadyExistsError, RecordNotFoundError
from veaiops.handler.services import config
from veaiops.handler.services.user import get_current_user
from veaiops.schema.documents import MetricTemplate
from veaiops.schema.documents.meta.user import User
from veaiops.schema.models.base import APIResponse, ToggleActiveRequest

template_router = APIRouter(prefix="/template", tags=["MetricTemplate"])


@template_router.post("/", response_model=APIResponse, status_code=status.HTTP_201_CREATED)
async def create_template(template: MetricTemplate, current_user: User = Depends(get_current_user)) -> APIResponse:
    """Create a new metric template.

    Args:
        template: The metric template to create
        current_user: The current authenticated user
    """
    if await MetricTemplate.find_one({"name": template.name, "metric_type": template.metric_type}):
        raise AlreadyExistsError(
            message=f"Active template with name '{template.name}'"
            f" and metric type '{template.metric_type}' already exists"
        )

    # Set created_user and updated_user fields
    template.created_user = current_user.username
    template.updated_user = current_user.username

    await template.insert()
    return APIResponse(message="Metric template created successfully")


@template_router.get("/{uid}", response_model=APIResponse[MetricTemplate])
async def get_template(uid: PydanticObjectId) -> APIResponse[MetricTemplate]:
    """Get a metric template by ID."""
    template = await MetricTemplate.get(uid)
    if not template:
        raise RecordNotFoundError(message="Metric template not found")
    return APIResponse(message="Metric template retrieved successfully", data=template)


@template_router.get("/", response_model=APIResponse[List[MetricTemplate]])
async def get_templates(skip: int = 0, limit: int = 100) -> APIResponse[List[MetricTemplate]]:
    """Get all metric templates."""
    templates = await MetricTemplate.find().skip(skip).limit(limit).to_list()
    return APIResponse(message="Metric templates retrieved successfully", data=templates)


@template_router.put("/{template_id}", response_model=APIResponse)
async def update_template(
    template_id: PydanticObjectId, update_data: Dict[str, Any], current_user: User = Depends(get_current_user)
) -> APIResponse:
    """Update an existing metric template.

    Args:
        template_id: The ID of the template to update
        update_data: The data to update
        current_user: The current authenticated user
    """
    template = await MetricTemplate.get(template_id)
    if not template:
        raise RecordNotFoundError(message="Metric template not found")

    validated_data = MetricTemplate.validate_update_fields(update_data)

    # Check for uniqueness if name or metric_type is being changed
    new_name = validated_data.get("name", template.name)
    new_metric_type = validated_data.get("metric_type", template.metric_type)

    if new_name != template.name or new_metric_type != template.metric_type:
        existing_template = await MetricTemplate.find_one({"name": new_name, "metric_type": new_metric_type})
        if existing_template and existing_template.id != template.id:
            raise AlreadyExistsError(
                message=f"Active template with name '{new_name}' and metric type '{new_metric_type}' already exists"
            )

    for key, value in validated_data.items():
        setattr(template, key, value)

    template.updated_at = datetime.now(timezone.utc)
    template.updated_user = current_user.username
    await template.save()
    return APIResponse(message="Metric template updated successfully")


@template_router.put("/{uid}/toggle", response_model=APIResponse)
async def toggle_template(uid: PydanticObjectId, request: ToggleActiveRequest) -> APIResponse:
    """Active or Disable a metric template."""
    return await config.toggle_active(MetricTemplate, uid, request.active)


@template_router.delete("/{uid}", response_model=APIResponse)
async def delete_template(uid: PydanticObjectId) -> APIResponse:
    """Delete a metric template."""
    return await config.delete(model=MetricTemplate, uid=uid)
