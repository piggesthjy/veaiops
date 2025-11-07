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

"""Shared fixtures for metrics tests."""

from datetime import datetime
from typing import Any, Dict

import pytest_asyncio

from veaiops.metrics.base import DataSource
from veaiops.metrics.timeseries import InputTimeSeries
from veaiops.schema.base.data_source import AliyunDataSourceConfig, VolcengineDataSourceConfig
from veaiops.schema.documents import Connect
from veaiops.schema.documents.datasource.base import DataSource as DataSourceDoc
from veaiops.schema.types import DataSourceType
from veaiops.utils.crypto import EncryptedSecretStr


# Create a concrete implementation of DataSource for testing
class TestDataSource(DataSource):
    """Test implementation of DataSource."""

    def concurrency_group(self) -> str:
        """Get the concurrency group for the data source."""
        return "test_group"

    @property
    def get_concurrency_quota(self) -> int:
        """Get the concurrency quota for the data source."""
        return 10

    def fetch_partial_data(self, *args, **kwargs):
        """Fetch partial data for a time range."""
        pass

    async def _fetch_one_slot(self, start: datetime, end: datetime | None = None) -> list[InputTimeSeries]:
        """Mock implementation for testing."""
        return []

    async def sync_rules_for_intelligent_threshold_task(self, **kwargs) -> Dict[str, Any]:
        """Synchronize alarm rules for intelligent threshold task."""
        return {}

    async def delete_all_rules(self) -> None:
        """Delete all alarm rules associated with this data source."""
        pass


@pytest_asyncio.fixture
async def test_aliyun_connect():
    """Create an Aliyun Connect document for testing."""
    # type: ignore required due to Optional fields in Connect model
    connect = await Connect(  # type: ignore
        name="test_aliyun_connect",
        type=DataSourceType.Aliyun,
        aliyun_access_key_id="test_aliyun_ak",
        aliyun_access_key_secret=EncryptedSecretStr("test_aliyun_sk"),
    ).create()

    yield connect

    await connect.delete()


@pytest_asyncio.fixture
async def test_volcengine_connect():
    """Create a Volcengine Connect document for testing."""
    # type: ignore required due to Optional fields in Connect model
    connect = await Connect(  # type: ignore
        name="test_volcengine_connect",
        type=DataSourceType.Volcengine,
        volcengine_access_key_id="test_ve_ak",
        volcengine_access_key_secret=EncryptedSecretStr("test_ve_sk"),
    ).create()

    yield connect

    await connect.delete()


@pytest_asyncio.fixture
async def test_zabbix_connect():
    """Create a Zabbix Connect document for testing."""
    # type: ignore required due to Optional fields in Connect model
    connect = await Connect(  # type: ignore
        name="test_zabbix_connect",
        type=DataSourceType.Zabbix,
        zabbix_api_url="http://zabbix.example.com",
        zabbix_api_user="admin",
        zabbix_api_password=EncryptedSecretStr("zabbix_password"),
    ).create()

    yield connect

    await connect.delete()


@pytest_asyncio.fixture
async def test_aliyun_datasource(test_aliyun_connect):
    """Create an Aliyun DataSource document for testing."""
    # type: ignore required due to Optional fields in DataSource model
    ds_doc = await DataSourceDoc(  # type: ignore
        name="Test Aliyun DataSource",
        type=DataSourceType.Aliyun,
        connect=test_aliyun_connect,
        aliyun_config=AliyunDataSourceConfig(
            name="Test Aliyun DataSource",
            connect_name="test_aliyun_connect",
            region="cn-beijing",
            namespace="test_namespace",
            metric_name="cpu.usage_active",
        ),
    ).create()

    yield ds_doc

    await ds_doc.delete()


@pytest_asyncio.fixture
async def test_volcengine_datasource(test_volcengine_connect):
    """Create a Volcengine DataSource document for testing."""
    # type: ignore required due to Optional fields in DataSource model
    ds_doc = await DataSourceDoc(  # type: ignore
        name="Test Volcengine DataSource",
        type=DataSourceType.Volcengine,
        connect=test_volcengine_connect,
        volcengine_config=VolcengineDataSourceConfig(
            name="Test Volcengine DataSource",
            connect_name="test_volcengine_connect",
            region="cn-beijing",
            namespace="test_namespace",
            metric_name="cpu.usage_active",
            sub_namespace="ecs",
        ),
    ).create()

    yield ds_doc

    await ds_doc.delete()
