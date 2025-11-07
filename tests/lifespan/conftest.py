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

"""Common test utilities and fixtures for lifespan tests."""

import asyncio
from typing import Dict, List, Optional
from unittest.mock import AsyncMock, MagicMock

import pytest
import pytest_asyncio


@pytest.fixture
def mock_aiohttp_response():
    """Create a mock aiohttp response factory."""

    def _create_response(status: int = 200, json_data: Optional[Dict] = None, raise_error: Optional[Exception] = None):
        """Create a mock response with given status and data."""
        mock_resp = MagicMock()
        mock_resp.status = status

        if raise_error:
            mock_resp.raise_for_status.side_effect = raise_error
        else:
            mock_resp.raise_for_status = MagicMock()

        async def json_coro():
            if json_data is not None:
                return json_data
            return {}

        mock_resp.json = AsyncMock(side_effect=json_coro)

        # Create async context manager
        mock_resp.__aenter__ = AsyncMock(return_value=mock_resp)
        mock_resp.__aexit__ = AsyncMock(return_value=None)

        return mock_resp

    return _create_response


@pytest.fixture
def mock_aiohttp_session(mock_aiohttp_response):
    """Create a mock aiohttp ClientSession."""

    def _create_session(responses: Optional[List[Dict]] = None):
        """Create a session with predefined responses."""
        mock_session = MagicMock()

        if responses is None:
            responses = [{"status": 200, "json_data": {}}]

        response_queue = [mock_aiohttp_response(**resp) for resp in responses]

        def post_side_effect(*args, **kwargs):
            if response_queue:
                return response_queue.pop(0)
            # Default response if queue is empty
            return mock_aiohttp_response(status=200, json_data={})

        mock_session.post = MagicMock(side_effect=post_side_effect)

        # Setup async context manager
        mock_session.__aenter__ = AsyncMock(return_value=mock_session)
        mock_session.__aexit__ = AsyncMock(return_value=None)

        return mock_session

    return _create_session


@pytest_asyncio.fixture
async def mock_volcengine_product_data():
    """Create sample volcengine product data for testing."""
    return {
        "Result": {
            "Data": [
                {
                    "Namespace": "VCM_ECS",
                    "Description": "Elastic Compute Service",
                    "Type": "ECS",
                    "TypeId": "ecs_type_001",
                },
                {
                    "Namespace": "VCM_RDS",
                    "Description": "Relational Database Service",
                    "Type": "RDS",
                    "TypeId": "rds_type_001",
                },
                {
                    "Namespace": "VCM_VPC",
                    "Description": "Virtual Private Cloud",
                    "Type": "VPC",
                    "TypeId": "vpc_type_001",
                },
            ]
        }
    }


@pytest_asyncio.fixture
async def mock_volcengine_metric_data():
    """Create sample volcengine metric data for testing."""
    return {
        "Result": {
            "Data": [
                {
                    "MetricName": "CpuUtil",
                    "MetricTips": "CPU utilization",
                    "Description": "The CPU utilization percentage",
                    "DescriptionCN": "CPU使用率",
                    "DescriptionEN": "CPU utilization",
                    "Namespace": "VCM_ECS",
                    "SubNamespace": "Instance",
                    "Unit": "%",
                    "Statistics": "avg",
                    "PointInterval": 60,
                    "PointDelay": 120,
                    "GroupByInterval": 60,
                    "OriginalPointDelay": 60,
                    "TypeAlertEnable": True,
                    "TypeConsumeEnable": True,
                    "Dimensions": [{"DimensionName": "InstanceId", "Description": "Instance ID", "Required": True}],
                    "UnSupportSubNsResource": False,
                    "ReportMethod": "Periodic",
                    "QueryNotFillZero": False,
                },
                {
                    "MetricName": "MemoryUtil",
                    "MetricTips": "Memory utilization",
                    "Description": "The memory utilization percentage",
                    "DescriptionCN": "内存使用率",
                    "DescriptionEN": "Memory utilization",
                    "Namespace": "VCM_ECS",
                    "SubNamespace": "Instance",
                    "Unit": "%",
                    "Statistics": "avg",
                    "PointInterval": 60,
                    "PointDelay": 120,
                    "GroupByInterval": 60,
                    "OriginalPointDelay": 60,
                    "TypeAlertEnable": True,
                    "TypeConsumeEnable": True,
                    "Dimensions": [{"DimensionName": "InstanceId", "Description": "Instance ID", "Required": True}],
                    "UnSupportSubNsResource": False,
                    "ReportMethod": "Periodic",
                    "QueryNotFillZero": False,
                },
                {
                    "MetricName": "DiskUtil",
                    "MetricTips": "Disk utilization",
                    "Description": "The disk utilization percentage",
                    "DescriptionCN": "磁盘使用率",
                    "DescriptionEN": "Disk utilization",
                    "Namespace": "VCM_ECS",
                    "SubNamespace": "Instance",
                    "Unit": "%",
                    "Statistics": "avg",
                    "PointInterval": 60,
                    "PointDelay": 120,
                    "GroupByInterval": 60,
                    "OriginalPointDelay": 60,
                    "TypeAlertEnable": True,
                    "TypeConsumeEnable": False,
                    "Dimensions": [
                        {"DimensionName": "InstanceId", "Description": "Instance ID", "Required": True},
                        {"DimensionName": "MountPoint", "Description": "Mount point", "Required": False},
                    ],
                    "UnSupportSubNsResource": False,
                    "ReportMethod": "Periodic",
                    "QueryNotFillZero": True,
                },
            ]
        }
    }


async def wait_for_task_completion(task: asyncio.Task, timeout: float = 1.0):
    """Wait for a task to complete with timeout."""
    try:
        await asyncio.wait_for(asyncio.shield(task), timeout=timeout)
    except asyncio.TimeoutError:
        pass


async def cancel_task(task: asyncio.Task):
    """Cancel a task and wait for it to finish."""
    if task and not task.done():
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass
