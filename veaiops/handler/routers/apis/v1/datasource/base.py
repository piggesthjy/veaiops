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

from http import HTTPStatus
from typing import List

from fastapi import APIRouter, Body, Query

from veaiops.handler.services.datasource import fetch_data
from veaiops.metrics import InputTimeSeries
from veaiops.schema.documents.datasource.base import DataSource
from veaiops.schema.models import APIResponse
from veaiops.utils.log import logger

base_router = APIRouter()


@base_router.post("/fetch", response_model=APIResponse[List[InputTimeSeries]])
async def fetch_data_api(
    datasource_id: str = Query(
        ...,
    ),
    start_time: int = Query(..., gt=0),
    end_time: int = Query(..., gt=0),
    interval_seconds: int = Query(default=60, gt=0),
) -> APIResponse[List[InputTimeSeries]]:
    """Unified fetch data interface for all data sources.

    Args:
        datasource_id (str): The ID of the data source to fetch data from.
        start_time (int): Start timestamp for data fetching.
        end_time (int): End timestamp for data fetching.
        interval_seconds (int): Time interval for fetching metric data, in seconds. Defaults to 60.

    Returns:
        APIResponse[List[InputTimeSeries]]: API response containing the fetched data.
    """
    logger.info(f"fetch data from datasource {datasource_id} from {start_time} to {end_time}")

    # Fetch data using the new fetch_data function
    fetched_data = await fetch_data(datasource_id, start_time, end_time, interval_seconds)

    # Return the fetched data directly as it's already in the correct format
    return APIResponse(
        message="Data fetched successfully",
        data=fetched_data,
    )


@base_router.put("/{datasource_id}/active", response_model=APIResponse[DataSource])
async def toggle_datasource_active_status(
    datasource_id: str,
    is_active: bool = Body(..., embed=True),
) -> APIResponse[DataSource]:
    """Toggle the active status of a data source.

    Args:
        datasource_id (str): The ID of the data source to update.
        is_active (bool): The new active status for the data source.

    Returns:
        APIResponse[DataSource]: API response containing the updated data source.
    """
    logger.info(f"toggle data source {datasource_id} active status to {is_active}")

    # Find the data source by ID
    datasource = await DataSource.get(datasource_id)
    if not datasource:
        return APIResponse(
            code=HTTPStatus.NOT_FOUND,
            message=f"Data source with ID {datasource_id} not found",
            data=None,
        )

    # Update the is_active field
    await datasource.set({"is_active": is_active})

    # Reload the datasource to get the updated data
    updated_datasource = await DataSource.get(datasource.id)

    return APIResponse(
        message="Data source active status updated successfully",
        data=updated_datasource,
    )
