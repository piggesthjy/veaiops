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

from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional

from fastapi import APIRouter, Body, Depends, Query, Request

from veaiops.cache import VolcengineMetricDetail
from veaiops.handler.errors import BadRequestError, RecordNotFoundError
from veaiops.handler.services.user import get_current_user
from veaiops.lifespan.cache import volcengine_metric_cache, volcengine_product_cache
from veaiops.metrics import InputTimeSeries
from veaiops.metrics.datasource_factory import DataSourceFactory
from veaiops.metrics.volcengine import VolcengineClient
from veaiops.schema.base import VolcengineDataSourceConfig
from veaiops.schema.documents import Connect, DataSource
from veaiops.schema.documents.intelligent_threshold.task import IntelligentThresholdTask
from veaiops.schema.documents.meta.user import User
from veaiops.schema.models.base import APIResponse, PaginatedAPIResponse
from veaiops.schema.models.datasource import BaseTimeseriesRequestPayload
from veaiops.schema.models.datasource.volcengine import VolcengineMetricConfig
from veaiops.schema.types import DataSourceType
from veaiops.utils.crypto import decrypt_secret_value
from veaiops.utils.pagination import convert_skip_limit_to_page_params

volcengine_router = APIRouter(prefix="/volcengine", tags=["Volcengine Data Sources"])


@volcengine_router.get("/contact_groups", response_model=PaginatedAPIResponse[List[dict]])
async def list_contact_groups(
    request: Request,
    name: Optional[str] = Query(None, description="Filter contact groups by name"),
    skip: int = Query(0, ge=0, description="Number of items to skip (must be >= 0)"),
    limit: int = Query(10, ge=1, le=100, description="Maximum number of items to return (1-100)"),
    datasource_id: str = Query(..., description="Data source ID to get contact groups"),
) -> PaginatedAPIResponse[List[dict]]:
    """List Volcengine contact groups with filtering.

    Args:
        request (Request): FastAPI request object.
        name (Optional[str]): Optional name filter for fuzzy matching.
        skip (int): Number of items to skip (default: 0).
        limit (int): Maximum number of items to return (default: 10).
        datasource_id (str): Data source ID to get contact groups.

    Returns:
        PaginatedAPIResponse[List[dict]]: API response containing list of contact groups with pagination info.
    """
    # Find the data source by ID
    datasource = await DataSource.get(datasource_id)
    if not datasource or datasource.type != DataSourceType.Volcengine:
        raise RecordNotFoundError(message=f"Volcengine data source with ID {datasource_id} not found")

    # Get connect information
    await datasource.fetch_link(DataSource.connect)
    connect_info = datasource.connect

    # Initialize Volcengine client
    client = VolcengineClient(
        ak=connect_info.volcengine_access_key_id,
        sk=decrypt_secret_value(connect_info.volcengine_access_key_secret),
        region=datasource.volcengine_config.region,
    )

    # Convert skip/limit to page_number/page_size
    page_number, page_size = convert_skip_limit_to_page_params(skip, limit)

    # Call list_contact_groups method
    response = client.list_contact_groups(name=name, page_number=page_number, page_size=page_size)

    # Extract contact groups from response
    contact_groups = response.to_dict().get("data", [])

    # Get total count from response
    total_count = response.total_count if hasattr(response, "total_count") else len(contact_groups)

    return PaginatedAPIResponse(
        message="Volcengine contact groups retrieved successfully",
        data=contact_groups,
        limit=limit,
        skip=skip,
        total=total_count,
    )


@volcengine_router.get("/", response_model=PaginatedAPIResponse[List[DataSource]])
async def get_all_volcengine_datasource(
    request: Request, skip: int = 0, limit: int = 100, name: Optional[str] = None, is_active: Optional[bool] = None
) -> PaginatedAPIResponse[List[DataSource]]:
    """Get all Volcengine data sources with optional skip, limit, name fuzzy matching, and active status filtering.

    Args:
        request (Request): FastAPI request object.
        skip (int): Number of data sources to skip (default: 0).
        limit (int): Maximum number of data sources to return (default: 100).
        name (Optional[str]): Optional name filter for fuzzy matching.
        is_active (Optional[bool]): Filter by active status if provided.

    Returns:
        PaginatedResponse[List[DataSource]]: API response containing list of data sources with pagination info.
    """
    # Build query based on provided parameters
    query_conditions = {"type": DataSourceType.Volcengine}
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
        message="Volcengine data sources retrieved successfully",
        data=datasource,
        limit=limit,
        skip=skip,
        total=total,
    )


@volcengine_router.get("/datasource_id/{datasource_id}", response_model=APIResponse[DataSource])
async def get_volcengine_datasource_by_id(request: Request, datasource_id: str) -> APIResponse[DataSource]:
    """Get a Volcengine data source by ID.

    Args:
        request (Request): FastAPI request object.
        datasource_id (str): The ID of the data source to retrieve.

    Returns:
        APIResponse[DataSource]: API response containing the data source.
    """
    # Find the data source by ID (using MongoDB's _id field)
    datasource = await DataSource.get(datasource_id)

    if not datasource or datasource.type != DataSourceType.Volcengine:
        raise RecordNotFoundError(message=f"Volcengine data source with ID {datasource_id} not found")

    return APIResponse(
        message="Volcengine data source retrieved successfully",
        data=datasource,
    )


@volcengine_router.post("/", response_model=APIResponse[DataSource])
async def create_volcengine_datasource(
    request: Request, datasource_config: VolcengineDataSourceConfig, user: User = Depends(get_current_user)
) -> APIResponse[DataSource]:
    """Create a new Volcengine data source.

    Args:
        request (Request): FastAPI request object.
        datasource_config (VolcengineDataSourceConfig): Volcengine data source configuration.
        user (User): The current user.

    Returns:
        APIResponse[DataSource]: API response containing the created data source.
    """
    connect = await Connect.find_one({"name": datasource_config.connect_name})
    if not connect:
        raise RecordNotFoundError(message=f"Connect with ID {datasource_config.connect_name} not found")

    # Create DataSource object
    datasource = DataSource(
        name=datasource_config.name,  # Use name specified by user
        type=DataSourceType.Volcengine,
        volcengine_config=datasource_config,
        connect=connect,
        created_user=user.username,
        updated_user=user.username,
    )

    # Save the data source (ID will be auto-generated by Beanie)
    await datasource.insert()

    return APIResponse(
        message="Volcengine data source created successfully",
        data=datasource,
    )


@volcengine_router.put("/datasource_id/{datasource_id}", response_model=APIResponse[DataSource])
async def update_volcengine_datasource(
    request: Request,
    datasource_id: str,
    datasource_config: VolcengineDataSourceConfig,
    user: User = Depends(get_current_user),
) -> APIResponse[DataSource]:
    """Update a Volcengine data source.

    Args:
        request (Request): FastAPI request object.
        datasource_id (str): The ID of the data source to update.
        datasource_config (VolcengineDataSourceConfig): Updated Volcengine data source configuration.
        user (User): The current user.

    Returns:
        APIResponse[DataSource]: API response containing the updated data source.
    """
    # Find the data source by ID
    datasource = await DataSource.get(datasource_id)
    if not datasource or datasource.type != DataSourceType.Volcengine:
        raise RecordNotFoundError(message=f"Data source with ID {datasource_id} not found")

    # Update the data source configuration
    datasource.volcengine_config = datasource_config
    datasource.updated_at = datetime.now(timezone.utc)
    datasource.updated_user = user.username

    # Save the updated data source
    await datasource.save()
    return APIResponse(
        message="Volcengine data source updated successfully",
        data=datasource,
    )


@volcengine_router.delete("/datasource_id/{datasource_id}", response_model=APIResponse[bool])
async def delete_volcengine_datasource(request: Request, datasource_id: str) -> APIResponse[bool]:
    """Delete a Volcengine data source by ID.

    Args:
        request (Request): FastAPI request object.
        datasource_id (str): The ID of the data source to delete.

    Returns:
        APIResponse[bool]: API response indicating success or failure of deletion.
    """
    # Find the data source by ID (using MongoDB's _id field)
    datasource = await DataSource.get(datasource_id)

    if not datasource or datasource.type != DataSourceType.Volcengine:
        raise RecordNotFoundError(message=f"Volcengine data source with ID {datasource_id} not found")

    # Check if there are any associated intelligent threshold tasks
    intelligent_threshold_tasks = await IntelligentThresholdTask.find(
        {"datasource_type": DataSourceType.Volcengine}
    ).to_list()
    for task in intelligent_threshold_tasks:
        if str(task.datasource_id) == datasource_id:
            raise BadRequestError(
                message=f"Cannot delete data source because it has associated "
                f"intelligent threshold task: {task.task_name}",
            )

    # Delete the data source
    await datasource.delete()

    return APIResponse(
        message=f"Volcengine data source with ID {datasource_id} deleted successfully",
        data=True,
    )


@volcengine_router.get("/products", response_model=APIResponse[List[dict]])
async def get_volcengine_products():
    """Get list of Volcengine monitoring products."""
    products = volcengine_product_cache.get_products()

    return APIResponse(
        message="success",
        data=[
            {"namespace": p.namespace, "description": p.description, "type": p.type_name, "type_id": p.type_id}
            for p in products
        ],
    )


@volcengine_router.get("/metrics", response_model=APIResponse[List[VolcengineMetricDetail]])
async def get_volcengine_metrics(
    namespace: Optional[str] = Query(None, description="Product namespace"),
    sub_namespace: Optional[str] = Query(None, description="Sub namespace"),
    metric_name: Optional[str] = Query(None, description="Metric name"),
):
    """Get list of Volcengine monitoring metrics with multiple filtering options."""
    if namespace:
        metrics = volcengine_metric_cache.get_metrics_by_namespace(namespace)
    elif sub_namespace:
        metrics = volcengine_metric_cache.get_metrics_by_sub_namespace(sub_namespace)
    elif metric_name:
        metric = volcengine_metric_cache.get_metric_by_name(metric_name)
        metrics = [metric] if metric else []
    else:
        metrics = volcengine_metric_cache.all_metrics

    return APIResponse(message="success", data=metrics)


@volcengine_router.get("/metrics/namespaces", response_model=APIResponse[List[str]])
async def get_namespaces():
    """Get all product namespaces."""
    namespaces = volcengine_metric_cache.get_namespaces()
    return APIResponse(message="success", data=namespaces)


@volcengine_router.get("/metrics/sub-namespaces", response_model=APIResponse[List[str]])
async def get_sub_namespaces(namespace: Optional[str] = Query(None, description="Product namespace")):
    """Get all sub namespaces."""
    sub_namespaces = volcengine_metric_cache.get_sub_namespaces(namespace)
    return APIResponse(message="success", data=sub_namespaces)


@volcengine_router.get("/metrics/search", response_model=APIResponse[List[VolcengineMetricDetail]])
async def search_metrics(
    keyword: Optional[str] = Query(None, description="Search keyword"),
    namespace: Optional[str] = Query(None, description="Limit to namespace"),
    sub_namespace: Optional[str] = Query(None, description="Limit to sub_namespace"),
):
    """Search metrics."""
    metrics = volcengine_metric_cache.search_metrics(keyword, namespace, sub_namespace)
    return APIResponse(
        message="success",
        data=metrics,
    )


@volcengine_router.post("/metrics/instances", response_model=APIResponse[List[Dict[str, str]]])
async def search_instances(request: Request, metrics_config: VolcengineMetricConfig):
    """Search metrics."""
    connect = await Connect.find_one({"name": metrics_config.connect_name})
    if not connect:
        raise RecordNotFoundError(message=f"Connect with ID {metrics_config.connect_name} not found")

    client = VolcengineClient(
        ak=connect.volcengine_access_key_id,
        sk=decrypt_secret_value(connect.volcengine_access_key_secret),
        region=metrics_config.region,
    )

    # Calculate start_time as the most recent full ten minutes ago
    now = datetime.now()
    # Round down to the nearest minute for end_time
    end_time = now.replace(second=0, microsecond=0)
    # Calculate start_time as 10 minutes before end_time
    start_time = end_time - timedelta(minutes=10)
    # Convert to timestamp in seconds
    start_time_ts = int(start_time.timestamp())
    end_time_ts = int(end_time.timestamp())

    resp = client.get_metric_data(
        namespace=metrics_config.namespace,
        sub_namespace=metrics_config.sub_namespace,
        metric_name=metrics_config.metric_name,
        start_time=start_time_ts,
        end_time=end_time_ts,
        period="60s",
        region=metrics_config.region,
        group_by=metrics_config.group_by,
    )

    metric_data_results = resp.get("data", {}).get("metric_data_results", [])

    instances = []

    for data_point in metric_data_results:
        dimensions = data_point.get("dimensions", [])
        labels = {}
        if dimensions:
            for dim in dimensions:
                if isinstance(dim, dict) and "name" in dim and "value" in dim:
                    value = dim["value"] if dim["value"] not in [None, ""] else "unknown"
                    labels[dim["name"]] = value
        if labels:
            instances.append(labels)

    return APIResponse(
        message="success",
        data=instances,
    )


@volcengine_router.post("/metrics/timeseries", response_model=APIResponse[List[InputTimeSeries]])
async def get_metrics_timeseries(
    request: Request,
    timeseries_request: BaseTimeseriesRequestPayload = Body(..., description="Time series request parameters"),
):
    """Get time series data for Volcengine metrics.

    Returns time series data points with timestamps and values for the specified metric.
    """
    datasource_id = timeseries_request.datasource_id

    start_time = timeseries_request.start_time
    end_time = timeseries_request.end_time
    period = timeseries_request.period
    instances = timeseries_request.instances

    datasource = await DataSource.get(datasource_id)
    if not datasource or datasource.type != DataSourceType.Volcengine:
        raise RecordNotFoundError(message=f"Volcengine data source with ID {datasource_id} not found")
    await datasource.fetch_link(DataSource.connect)
    volcengine_config = datasource.volcengine_config
    if not volcengine_config:
        raise RecordNotFoundError(message=f"Volcengine config for data source with ID {datasource_id} not found")

    volcengine_datasource = DataSourceFactory.create_datasource(datasource)

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

    if not instances:
        instances = volcengine_config.instances

    volcengine_instances = []
    for instance_dict in instances:
        from volcenginesdkvolcobserve import DimensionForGetMetricDataInput, InstanceForGetMetricDataInput

        dimensions = []
        for key, value in instance_dict.items():
            dimensions.append(DimensionForGetMetricDataInput(name=key, value=value))
        volcengine_instances.append(InstanceForGetMetricDataInput(dimensions=dimensions))

    resp = volcengine_datasource.client.get_metric_data(
        namespace=volcengine_config.namespace,
        sub_namespace=volcengine_config.sub_namespace,
        metric_name=volcengine_config.metric_name,
        start_time=start_time,
        end_time=end_time,
        period=period,
        region=volcengine_config.region,
        group_by=volcengine_config.group_by,
        instances=volcengine_instances,
    )

    timeseries_data = volcengine_datasource.convert_datapoints_to_timeseries(resp)

    return APIResponse(
        message="success",
        data=timeseries_data,
    )
