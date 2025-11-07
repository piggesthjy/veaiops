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

"""Shared fixtures and utilities for datasource tests."""

import pytest_asyncio

from veaiops.schema.base import (
    AliyunDataSourceConfig,
    VolcengineDataSourceConfig,
    ZabbixDataSourceConfig,
    ZabbixTarget,
)
from veaiops.schema.documents import Connect, DataSource
from veaiops.schema.types import DataSourceType
from veaiops.utils.crypto import EncryptedSecretStr

# ============================================================================
# Utility Functions
# ============================================================================


def create_connect_payload(name: str, datasource_type: DataSourceType, **kwargs) -> dict:
    """Helper function to create a connect payload for API testing.

    Args:
        name: Connect name
        datasource_type: Type of data source (Aliyun, Volcengine, Zabbix)
        **kwargs: Additional fields to override defaults

    Returns:
        dict: Connect payload suitable for API requests
    """
    base_payload = {
        "name": name,
        "type": datasource_type.value,
    }

    if datasource_type == DataSourceType.Aliyun:
        base_payload.update(
            {
                "aliyun_access_key_id": kwargs.get("aliyun_access_key_id", "test_access_key"),
                "aliyun_access_key_secret": kwargs.get("aliyun_access_key_secret", "test_secret"),
            }
        )
    elif datasource_type == DataSourceType.Volcengine:
        base_payload.update(
            {
                "volcengine_access_key_id": kwargs.get("volcengine_access_key_id", "test_access_key"),
                "volcengine_access_key_secret": kwargs.get("volcengine_access_key_secret", "test_secret"),
            }
        )
    elif datasource_type == DataSourceType.Zabbix:
        base_payload.update(
            {
                "zabbix_api_url": kwargs.get("zabbix_api_url", "http://zabbix.example.com"),
                "zabbix_api_user": kwargs.get("zabbix_api_user", "admin"),
                "zabbix_api_password": kwargs.get("zabbix_api_password", "password"),
            }
        )

    return base_payload


def create_aliyun_datasource_payload(connect_name: str, **kwargs) -> dict:
    """Helper function to create an Aliyun datasource payload.

    Args:
        connect_name: Name of the connect to use
        **kwargs: Additional fields to override defaults

    Returns:
        dict: Aliyun datasource payload suitable for API requests
    """
    return {
        "name": kwargs.get("name", "test_aliyun_datasource"),
        "connect_name": connect_name,
        "region": kwargs.get("region", "cn-beijing"),
        "namespace": kwargs.get("namespace", "acs_ecs_dashboard"),
        "metric_name": kwargs.get("metric_name", "CPUUtilization"),
    }


def create_volcengine_datasource_payload(connect_name: str, **kwargs) -> dict:
    """Helper function to create a Volcengine datasource payload.

    Args:
        connect_name: Name of the connect to use
        **kwargs: Additional fields to override defaults

    Returns:
        dict: Volcengine datasource payload suitable for API requests
    """
    return {
        "name": kwargs.get("name", "test_volcengine_datasource"),
        "connect_name": connect_name,
        "region": kwargs.get("region", "cn-beijing"),
        "namespace": kwargs.get("namespace", "VCM"),
        "metric_name": kwargs.get("metric_name", "CPUUtilization"),
    }


def create_zabbix_datasource_payload(connect_name: str, **kwargs) -> dict:
    """Helper function to create a Zabbix datasource payload.

    Args:
        connect_name: Name of the connect to use
        **kwargs: Additional fields to override defaults

    Returns:
        dict: Zabbix datasource payload suitable for API requests
    """
    return {
        "name": kwargs.get("name", "test_zabbix_datasource"),
        "connect_name": connect_name,
        "targets": kwargs.get(
            "targets",
            [
                {"itemid": "1001", "hostname": "host1"},
                {"itemid": "1002", "hostname": "host2"},
            ],
        ),
        "history_type": kwargs.get("history_type", 0),
        "metric_name": kwargs.get("metric_name", "test_metric"),
    }


@pytest_asyncio.fixture
async def aliyun_connect() -> Connect:
    """Create an Aliyun connect for testing."""
    connect = Connect(
        name="test_aliyun_connect",
        type=DataSourceType.Aliyun,
        aliyun_access_key_id="test_access_key_id",
        aliyun_access_key_secret=EncryptedSecretStr("test_access_key_secret"),
        volcengine_access_key_id="dummy",
        volcengine_access_key_secret=EncryptedSecretStr("dummy"),
        zabbix_api_url="http://dummy.com",
        zabbix_api_user="dummy",
        zabbix_api_password=EncryptedSecretStr("dummy"),
    )
    await connect.insert()
    yield connect
    await connect.delete()


@pytest_asyncio.fixture
async def volcengine_connect() -> Connect:
    """Create a Volcengine connect for testing."""
    connect = Connect(
        name="test_volcengine_connect",
        type=DataSourceType.Volcengine,
        volcengine_access_key_id="test_access_key_id",
        volcengine_access_key_secret=EncryptedSecretStr("test_access_key_secret"),
        aliyun_access_key_id="dummy",
        aliyun_access_key_secret=EncryptedSecretStr("dummy"),
        zabbix_api_url="http://dummy.com",
        zabbix_api_user="dummy",
        zabbix_api_password=EncryptedSecretStr("dummy"),
    )
    await connect.insert()
    yield connect
    await connect.delete()


@pytest_asyncio.fixture
async def zabbix_connect() -> Connect:
    """Create a Zabbix connect for testing."""
    connect = Connect(
        name="test_zabbix_connect",
        type=DataSourceType.Zabbix,
        zabbix_api_url="http://zabbix.example.com",
        zabbix_api_user="admin",
        zabbix_api_password=EncryptedSecretStr("password"),
        aliyun_access_key_id="dummy",
        aliyun_access_key_secret=EncryptedSecretStr("dummy"),
        volcengine_access_key_id="dummy",
        volcengine_access_key_secret=EncryptedSecretStr("dummy"),
    )
    await connect.insert()
    yield connect
    await connect.delete()


@pytest_asyncio.fixture
async def aliyun_datasource(aliyun_connect: Connect) -> DataSource:
    """Create an Aliyun datasource for testing."""
    datasource = DataSource(
        name="test_aliyun_datasource",
        type=DataSourceType.Aliyun,
        connect=aliyun_connect,
        aliyun_config=AliyunDataSourceConfig(
            connect_name="test_aliyun_connect",
            name="test_config",
            namespace="acs_ecs_dashboard",
            metric_name="CPUUtilization",
            region="cn-beijing",
            dimensions=[{"InstanceId": "i-test123"}],
        ),
        volcengine_config=VolcengineDataSourceConfig(
            connect_name="dummy",
            name="dummy",
            namespace="dummy",
            metric_name="dummy",
            region="dummy",
        ),
        zabbix_config=ZabbixDataSourceConfig(
            connect_name="dummy",
            name="dummy",
            targets=[],
        ),
        is_active=True,
        created_user="testuser",
        updated_user="testuser",
    )
    await datasource.insert()
    yield datasource
    await datasource.delete()


@pytest_asyncio.fixture
async def volcengine_datasource(volcengine_connect: Connect) -> DataSource:
    """Create a Volcengine datasource for testing."""
    datasource = DataSource(
        name="test_volcengine_datasource",
        type=DataSourceType.Volcengine,
        connect=volcengine_connect,
        volcengine_config=VolcengineDataSourceConfig(
            connect_name="test_volcengine_connect",
            name="test_config",
            namespace="VCM",
            metric_name="CPUUtilization",
            region="cn-beijing",
        ),
        aliyun_config=AliyunDataSourceConfig(
            connect_name="dummy",
            name="dummy",
            namespace="dummy",
            metric_name="dummy",
            region="dummy",
        ),
        zabbix_config=ZabbixDataSourceConfig(
            connect_name="dummy",
            name="dummy",
            targets=[],
        ),
        is_active=True,
        created_user="testuser",
        updated_user="testuser",
    )
    await datasource.insert()
    yield datasource
    await datasource.delete()


@pytest_asyncio.fixture
async def zabbix_datasource(zabbix_connect: Connect) -> DataSource:
    """Create a Zabbix datasource for testing."""
    datasource = DataSource(
        name="test_zabbix_datasource",
        type=DataSourceType.Zabbix,
        connect=zabbix_connect,
        zabbix_config=ZabbixDataSourceConfig(
            connect_name="test_zabbix_connect",
            name="test_config",
            targets=[ZabbixTarget(itemid="1001", hostname="server1")],
        ),
        aliyun_config=AliyunDataSourceConfig(
            connect_name="dummy",
            name="dummy",
            namespace="dummy",
            metric_name="dummy",
            region="dummy",
        ),
        volcengine_config=VolcengineDataSourceConfig(
            connect_name="dummy",
            name="dummy",
            namespace="dummy",
            metric_name="dummy",
            region="dummy",
        ),
        is_active=True,
        created_user="testuser",
        updated_user="testuser",
    )
    await datasource.insert()
    yield datasource
    await datasource.delete()
