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

from datetime import datetime
from typing import List

from veaiops.metrics.timeseries import InputTimeSeries
from veaiops.schema.documents import DataSource as DataSourceDocument

__all__ = ["fetch_data"]


async def fetch_data(
    datasource_id: str, start_time: int, end_time: int, interval_seconds: int = 60
) -> List[InputTimeSeries]:
    """Unified fetch data interface for all data sources.

    Args:
        datasource_id (str): The ID of the data source to fetch data from.
        start_time (int): Start timestamp for data fetching.
        end_time (int): End timestamp for data fetching.
        interval_seconds (int): Time interval for fetching metric data, in seconds. Defaults to 60.

    Returns:
        List[InputTimeSeries]: List of fetched time series data.
    """
    # Find the data source by ID (using MongoDB's _id field)
    datasource = await DataSourceDocument.get(datasource_id)

    if not datasource:
        raise ValueError(f"Data source with ID {datasource_id} not found")
    await datasource.fetch_link(DataSourceDocument.connect)
    # Import the DataSourceFactory here to avoid circular imports
    from veaiops.metrics.datasource_factory import DataSourceFactory

    # Create the appropriate data source object based on type using factory
    data_source_obj = DataSourceFactory.create_datasource(datasource)

    # Set interval_seconds
    data_source_obj.interval_seconds = interval_seconds

    # Fetch data using the data source object
    start_dt = datetime.fromtimestamp(start_time)
    end_dt = datetime.fromtimestamp(end_time)
    fetched_data = await data_source_obj.fetch(start_dt, end_dt)

    return fetched_data
