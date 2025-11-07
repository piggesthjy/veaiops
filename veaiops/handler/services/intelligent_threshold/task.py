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
from typing import List, Optional

from beanie import PydanticObjectId
from pymongo import DESCENDING

from veaiops.handler.errors.errors import InternalServerError, RecordNotFoundError
from veaiops.schema.base import MetricThresholdResult
from veaiops.schema.documents import (
    IntelligentThresholdTask,
    IntelligentThresholdTaskVersion,
)
from veaiops.schema.models.base import TimeRange
from veaiops.schema.types import DataSourceType, IntelligentThresholdTaskStatus


async def list_tasks(
    projects: Optional[List[str]] = None,
    datasource_type: Optional[DataSourceType] = None,
    auto_update: Optional[bool] = None,
    skip: int = 0,
    limit: int = 10,
    task_name: Optional[str] = None,
    created_at_range: Optional[TimeRange] = None,
    updated_at_range: Optional[TimeRange] = None,
) -> tuple[List[IntelligentThresholdTask], int]:
    """List intelligent threshold tasks with filtering, pagination and sorting."""
    query = {}
    if projects:
        query["projects"] = {"$in": projects}

    if datasource_type:
        query["datasource_type"] = datasource_type

    if auto_update is not None:
        query["auto_update"] = auto_update

    if task_name:
        query["task_name"] = {"$regex": task_name, "$options": "i"}

    if created_at_range:
        start = datetime.fromtimestamp(created_at_range.start_time, tz=timezone.utc)
        end = datetime.fromtimestamp(created_at_range.end_time, tz=timezone.utc)
        query["created_at"] = {"$gte": start, "$lte": end}

    if updated_at_range:
        start = datetime.fromtimestamp(updated_at_range.start_time, tz=timezone.utc)
        end = datetime.fromtimestamp(updated_at_range.end_time, tz=timezone.utc)
        query["updated_at"] = {"$gte": start, "$lte": end}

    # Build sort criteria
    sort_criteria = [("created_at", -1)]

    # Execute query with pagination
    find_query = IntelligentThresholdTask.find(query)
    total = await find_query.count()
    tasks = await find_query.sort(*sort_criteria).skip(skip).limit(limit).to_list()

    return tasks, total


async def delete_task(
    task_id: PydanticObjectId,
) -> bool:
    """Delete an intelligent threshold task and all its associated versions.

    This function first deletes all alarm rules associated with the task's data source,
    then deletes all task versions associated with the specified task ID,
    and finally deletes the task itself.

    Args:
        task_id (PydanticObjectId): The ID of the task to delete

    Returns:
        bool: True if deletion was successful, False otherwise

    """
    # First check if the task exists
    task = await IntelligentThresholdTask.get(task_id)
    if not task:
        raise RecordNotFoundError(message=f"Task with ID {task_id} not found")

    # Import here to avoid circular imports
    from veaiops.metrics.datasource_factory import DataSourceFactory
    from veaiops.schema.documents import DataSource

    # Get the data source associated with this task
    datasource_meta = await DataSource.get(task.datasource_id)
    if datasource_meta:
        # Fetch the connection information
        await datasource_meta.fetch_link(DataSource.connect)

        # Create the data source instance
        datasource = DataSourceFactory.create_datasource(datasource_meta)

        # Delete all alarm rules associated with this data source
        await datasource.delete_all_rules()

    # Delete all associated task versions first
    delete_versions_result = await IntelligentThresholdTaskVersion.find({"task_id": task_id}).delete()

    # Then delete the task itself
    delete_task_result = await task.delete()

    # Return True if both operations were successful
    return delete_versions_result is not None and delete_task_result is not None


async def update_task_result(
    task_id: PydanticObjectId,
    status: IntelligentThresholdTaskStatus,
    task_version: int,
    result: Optional[List[MetricThresholdResult]] = None,
    error_message: Optional[str] = None,
) -> IntelligentThresholdTaskVersion:
    """Update the result and status of an intelligent threshold task version."""
    # Find the specific version to update
    version_query = {"task_id": task_id, "version": task_version}
    version_to_update = await IntelligentThresholdTaskVersion.find_one(version_query)

    if not version_to_update:
        raise RecordNotFoundError(message=f"Task version {task_version} for task {task_id} not found")
    # Prepare update data
    update_data = {
        "status": status,
        "updated_at": datetime.now(timezone.utc),
    }
    if result is not None:
        update_data["result"] = [item.model_dump(by_alias=True) for item in result]
    if error_message is not None:
        update_data["error_message"] = error_message
    # Perform the update
    await version_to_update.update({"$set": update_data})

    # Fetch the updated document to return it
    updated_version_doc = await IntelligentThresholdTaskVersion.get(version_to_update.id)
    if not updated_version_doc:
        # This should not happen in normal circumstances
        raise InternalServerError(message="Failed to fetch updated task version")

    return updated_version_doc


async def list_task_versions(
    task_id: PydanticObjectId,
    status: Optional[IntelligentThresholdTaskStatus] = None,
    created_at_range: Optional[TimeRange] = None,
    updated_at_range: Optional[TimeRange] = None,
    skip: int = 0,
    limit: int = 10,
) -> tuple[List[IntelligentThresholdTaskVersion], int]:
    """List and filter intelligent threshold task versions with pagination and sorting."""
    query_conditions = {
        "task_id": task_id,
    }
    if status:
        query_conditions["status"] = status

    if created_at_range:
        start = datetime.fromtimestamp(created_at_range.start_time, tz=timezone.utc)
        end = datetime.fromtimestamp(created_at_range.end_time, tz=timezone.utc)
        query_conditions["created_at"] = {"$gte": start, "$lte": end}

    if updated_at_range:
        start = datetime.fromtimestamp(updated_at_range.start_time, tz=timezone.utc)
        end = datetime.fromtimestamp(updated_at_range.end_time, tz=timezone.utc)
        query_conditions["updated_at"] = {"$gte": start, "$lte": end}

    query = IntelligentThresholdTaskVersion.find(query_conditions)

    total_count = await query.count()

    # Sorting
    sort_expressions = [("version", DESCENDING)]

    query = query.sort(*sort_expressions)

    query = query.skip(skip).limit(limit)

    versions = await query.to_list()

    return versions, total_count
