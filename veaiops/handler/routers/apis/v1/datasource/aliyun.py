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

import json
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from alibabacloud_cms20190101 import models as cms_20190101_models
from fastapi import APIRouter, Body, Depends, Query, Request

from veaiops.handler.errors import BadRequestError, RecordNotFoundError
from veaiops.handler.services.user import get_current_user
from veaiops.metrics.aliyun import AliyunClient
from veaiops.metrics.datasource_factory import DataSourceFactory
from veaiops.metrics.timeseries import InputTimeSeries
from veaiops.schema.base import AliyunDataSourceConfig
from veaiops.schema.documents import Connect, DataSource
from veaiops.schema.documents.intelligent_threshold.task import IntelligentThresholdTask
from veaiops.schema.documents.meta.user import User
from veaiops.schema.models.base import APIResponse, PaginatedAPIResponse
from veaiops.schema.models.datasource import BaseTimeseriesRequestPayload
from veaiops.schema.types import DataSourceType
from veaiops.utils.crypto import decrypt_secret_value
from veaiops.utils.pagination import convert_skip_limit_to_page_params

aliyun_router = APIRouter(prefix="/aliyun", tags=["Aliyun Data Sources"])


@aliyun_router.get("/contact_groups", response_model=PaginatedAPIResponse[List[dict]])
async def list_aliyun_contact_groups(
    request: Request,
    datasource_id: str = Query(..., description="Aliyun data source ID"),
    name: Optional[str] = Query(None, description="Filter contact groups by name"),
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of items to return"),
) -> PaginatedAPIResponse[List[dict]]:
    """Get contact groups from Aliyun data source.

    Args:
        request (Request): FastAPI request object.
        datasource_id (str): The ID of the Aliyun data source.
        name (Optional[str]): Filter contact groups by name.
        skip (int): Number of items to skip (default: 0).
        limit (int): Maximum number of items to return (default: 100, max: 1000).

    Returns:
        PaginatedAPIResponse[List[dict]]: API response containing contact group list.
    """
    # Find the data source by ID

    datasource = await DataSource.get(datasource_id)

    if not datasource or datasource.type != DataSourceType.Aliyun:
        raise RecordNotFoundError(message=f"Aliyun data source with ID {datasource_id} not found")

    # Fetch the connect information
    await datasource.fetch_link(DataSource.connect)

    if not datasource.connect:
        raise RecordNotFoundError(message=f"Connect information not found for data source {datasource_id}")

    # Create Aliyun client
    client = AliyunClient(
        ak=datasource.connect.aliyun_access_key_id,
        sk=decrypt_secret_value(datasource.connect.aliyun_access_key_secret),
        region=datasource.aliyun_config.region,
    )

    # Convert skip/limit to page_number/page_size
    page_number, page_size = convert_skip_limit_to_page_params(skip, limit)

    # Prepare request
    describe_contact_group_list_request = cms_20190101_models.DescribeContactGroupListRequest(
        page_number=page_number, page_size=page_size
    )
    if name:
        describe_contact_group_list_request.contact_group_name = name

    # Call the API
    response = client.describe_contact_group_list(describe_contact_group_list_request)
    response_dict = response.to_map() if hasattr(response, "to_map") else {}

    # Extract contact groups and total count from response
    contact_groups = response_dict.get("body", {}).get("ContactGroups", {}).get("ContactGroup", [])
    total_count = response_dict.get("body", {}).get("Total", 0)

    # Process contact groups to ensure consistent format
    processed_contact_groups = []
    for contact_group in contact_groups:
        if isinstance(contact_group, str):
            # Handle string representation by creating a minimal dict
            processed_contact_groups.append({"name": contact_group})
        else:
            # Handle dict representation as usual
            processed_contact_groups.append(contact_group)

    return PaginatedAPIResponse(
        message="Aliyun contact groups retrieved successfully",
        data=processed_contact_groups,
        limit=limit,
        skip=skip,
        total=total_count,
    )


@aliyun_router.get("/", response_model=PaginatedAPIResponse[List[DataSource]])
async def get_all_aliyun_datasource(
    skip: int = 0, limit: int = 100, name: Optional[str] = None, is_active: Optional[bool] = None
) -> PaginatedAPIResponse[List[DataSource]]:
    """Get all Aliyun data sources with optional skip, limit, name fuzzy matching, and active status filtering.

    Args:
        skip (int): Number of data sources to skip (default: 0).
        limit (int): Maximum number of data sources to return (default: 100).
        name (Optional[str]): Optional name filter for fuzzy matching.
        is_active (Optional[bool]): Filter by active status if provided.

    Returns:
        PaginatedResponse[List[DataSource]]: API response containing list of data sources with pagination info.
    """
    # Build query based on provided parameters
    query_conditions = {"type": DataSourceType.Aliyun}
    if is_active is not None:
        query_conditions["is_active"] = is_active
    if name:
        query_conditions["name"] = {"$regex": name, "$options": "i"}

    query = DataSource.find(query_conditions)

    # Calculate total count
    total = await query.count()

    # Apply skip and limit
    datasource = await query.skip(skip).limit(limit).to_list()

    return PaginatedAPIResponse(
        message="Aliyun data sources retrieved successfully",
        data=datasource,
        limit=limit,
        skip=skip,
        total=total,
    )


@aliyun_router.get("/{datasource_id}", response_model=APIResponse[DataSource])
async def get_aliyun_datasource_by_id(request: Request, datasource_id: str) -> APIResponse[DataSource]:
    """Get an Aliyun data source by ID.

    Args:
        request (Request): FastAPI request object.
        datasource_id (str): The ID of the data source to retrieve.

    Returns:
        APIResponse[DataSource]: API response containing the data source.
    """
    # Find the data source by ID (using MongoDB's _id field)
    datasource = await DataSource.get(datasource_id)

    if not datasource or datasource.type != DataSourceType.Aliyun:
        raise RecordNotFoundError(message=f"Aliyun data source with ID {datasource_id} not found")

    return APIResponse(
        message="Aliyun data source retrieved successfully",
        data=datasource,
    )


@aliyun_router.post("/", response_model=APIResponse[DataSource])
async def create_aliyun_datasource(
    request: Request, datasource_config: AliyunDataSourceConfig, user: User = Depends(get_current_user)
) -> APIResponse[DataSource]:
    """Create a new Aliyun data source.

    Args:
        request (Request): FastAPI request object.
        datasource_config (AliyunDataSourceConfig): Aliyun data source configuration.
        user (User): The current user.

    Returns:
        APIResponse[DataSource]: API response containing the created data source.
    """
    # Create DataSource object
    connect = await Connect.find_one({"name": datasource_config.connect_name})
    if not connect:
        raise RecordNotFoundError(message=f"Connect with ID {datasource_config.connect_name} not found")

    datasource = DataSource(
        name=datasource_config.name,  # Use provided name
        type=DataSourceType.Aliyun,
        connect=connect,
        aliyun_config=datasource_config,
        created_user=user.username,
        updated_user=user.username,
    )

    # Save the data source
    await datasource.insert()

    return APIResponse(
        message="Aliyun data source created successfully",
        data=datasource,
    )


@aliyun_router.put("/{datasource_id}", response_model=APIResponse[DataSource])
async def update_aliyun_datasource(
    request: Request, datasource_id: str, datasource_config: AliyunDataSourceConfig
) -> APIResponse[DataSource]:
    """Update an Aliyun data source.

    Args:
        request (Request): FastAPI request object.
        datasource_id (str): The ID of the data source to update.
        datasource_config (AliyunDataSourceConfig): Updated Aliyun data source configuration.

    Returns:
        APIResponse[DataSource]: API response containing the updated data source.
    """
    # Find the data source by ID (using MongoDB's _id field)
    datasource = await DataSource.get(datasource_id)

    if not datasource or datasource.type != DataSourceType.Aliyun:
        raise RecordNotFoundError(message=f"Aliyun data source with ID {datasource_id} not found")

    # Update the data source configuration
    datasource.aliyun_config = datasource_config
    datasource.updated_at = datetime.now(timezone.utc)

    # Save the updated data source
    await datasource.save()

    return APIResponse(
        message="Aliyun data source updated successfully",
        data=datasource,
    )


@aliyun_router.delete("/{datasource_id}", response_model=APIResponse[bool])
async def delete_aliyun_datasource(request: Request, datasource_id: str) -> APIResponse[bool]:
    """Delete an Aliyun data source by ID.

    Args:
        request (Request): FastAPI request object.
        datasource_id (str): The ID of the data source to delete.

    Returns:
        APIResponse[bool]: API response indicating success or failure of deletion.
    """
    # Check if there are any associated intelligent threshold tasks
    intelligent_threshold_tasks = await IntelligentThresholdTask.find(
        {"datasource_type": DataSourceType.Aliyun}
    ).to_list()
    for task in intelligent_threshold_tasks:
        if str(task.datasource_id) == datasource_id:
            raise BadRequestError(
                message=f"Cannot delete data source because it has associated "
                f"intelligent threshold task: {task.task_name}",
            )
    # Find the data source by ID (using MongoDB's _id field)
    datasource = await DataSource.get(datasource_id)

    if not datasource or datasource.type != DataSourceType.Aliyun:
        raise RecordNotFoundError(message=f"Aliyun data source with ID {datasource_id} not found", data=False)

    # Delete the data source
    await datasource.delete()

    return APIResponse(
        message=f"Aliyun data source with ID {datasource_id} deleted successfully",
        data=True,
    )


@aliyun_router.post("/metrics/timeseries", response_model=APIResponse[List[InputTimeSeries]])
async def get_metrics_timeseries(
    request: Request,
    timeseries_request: BaseTimeseriesRequestPayload = Body(..., description="Time series request parameters"),
):
    """Get time series data for Aliyun metrics.

    Returns time series data points with timestamps and values for the specified metric.
    """
    datasource_id = timeseries_request.datasource_id

    start_time = timeseries_request.start_time
    end_time = timeseries_request.end_time
    period = timeseries_request.period
    instances = timeseries_request.instances

    datasource = await DataSource.get(datasource_id)
    if not datasource or datasource.type != DataSourceType.Aliyun:
        raise RecordNotFoundError(message=f"Aliyun data source with ID {datasource_id} not found")
    await datasource.fetch_link(DataSource.connect)
    aliyun_config = datasource.aliyun_config
    if not aliyun_config:
        raise RecordNotFoundError(message=f"Aliyun config for data source with ID {datasource_id} not found")

    aliyun_datasource = DataSourceFactory.create_datasource(datasource)

    # If start_time and end_time are not provided, calculate them
    if not start_time or not end_time:
        now = datetime.now(timezone.utc)
        # Round down to the nearest minute for end_time
        end_time_dt = now.replace(second=0, microsecond=0)
        # Calculate start_time as 10 minutes before end_time
        start_time_dt = end_time_dt - timedelta(minutes=10)
        # Convert to timestamp in seconds
        if not end_time:
            end_time = int(end_time_dt.timestamp())
        if not start_time:
            start_time = int(start_time_dt.timestamp())

    # Set the period in seconds for the Aliyun data source
    if period.endswith("s"):
        aliyun_datasource.interval_seconds = int(period[:-1])
    elif period.endswith("m"):
        aliyun_datasource.interval_seconds = int(period[:-1]) * 60
    elif period.endswith("h"):
        aliyun_datasource.interval_seconds = int(period[:-1]) * 3600
    elif period.endswith("d"):
        aliyun_datasource.interval_seconds = int(period[:-1]) * 86400
    elif period.endswith("w"):
        aliyun_datasource.interval_seconds = int(period[:-1]) * 604800
    else:
        aliyun_datasource.interval_seconds = 60  # Default to 60 seconds

    # Use instances from request or fall back to config
    if not instances and aliyun_config.dimensions:
        instances = aliyun_config.dimensions

    # Convert timestamps to datetime objects
    start_time_dt = datetime.fromtimestamp(start_time, tz=timezone.utc)
    end_time_dt = datetime.fromtimestamp(end_time, tz=timezone.utc)

    # Format times for Aliyun API
    start_time_str = start_time_dt.strftime("%Y-%m-%d %H:%M:%S")
    end_time_str = end_time_dt.strftime("%Y-%m-%d %H:%M:%S")

    # Prepare express parameter for grouping
    express = {"groupby": aliyun_config.group_by} if aliyun_config.group_by else {}

    # Fetch data from Aliyun API using client.get_metric_data method
    all_data_points = []
    next_token = None

    while True:
        resp = aliyun_datasource.client.get_metric_data(
            namespace=aliyun_config.namespace,
            metric_name=aliyun_config.metric_name,
            dimensions=instances,  # Use instances from request or config
            start_time=start_time_str,
            end_time=end_time_str,
            period=str(aliyun_datasource.interval_seconds),
            express=express,
            next_token=next_token,
        )

        data_points = []
        if hasattr(resp, "body") and hasattr(resp.body, "datapoints") and resp.body.datapoints:
            datapoints = resp.body.datapoints
            try:
                data_points = json.loads(datapoints)
            except json.JSONDecodeError as e:
                raise Exception(f"Failed to parse JSON data from Aliyun API: {e}")

        if isinstance(data_points, list):
            all_data_points.extend(data_points)

        if hasattr(resp.body, "next_token") and resp.body.next_token:
            next_token = resp.body.next_token
        else:
            break

    timeseries_data = aliyun_datasource._convert_datapoints_to_timeseries(all_data_points)

    return APIResponse(
        message="success",
        data=timeseries_data,
    )
