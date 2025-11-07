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

"""Tests for DataSourceFactory."""

import pytest
import pytest_asyncio

from veaiops.metrics.aliyun import AliyunDataSource
from veaiops.metrics.datasource_factory import DataSourceFactory
from veaiops.metrics.volcengine import VolcengineDataSource
from veaiops.metrics.zabbix import ZabbixDataSource
from veaiops.schema.base.data_source import (
    AliyunDataSourceConfig,
    VolcengineDataSourceConfig,
    ZabbixDataSourceConfig,
    ZabbixTarget,
)
from veaiops.schema.documents import Connect
from veaiops.schema.documents.datasource.base import DataSource as DataSourceDoc
from veaiops.schema.types import DataSourceType


@pytest_asyncio.fixture
async def aliyun_datasource_doc(test_aliyun_connect):
    """Create Aliyun DataSource document."""
    ds_doc = await DataSourceDoc(
        name="Test Aliyun DS",
        type=DataSourceType.Aliyun,
        connect=test_aliyun_connect,
        aliyun_config=AliyunDataSourceConfig(
            name="Test Aliyun DS",
            connect_name="test_aliyun_connect",
            region="cn-beijing",
            namespace="acs_ecs_dashboard",
            metric_name="cpu.usage_active",
            dimensions=[{"Instance": "i-123"}],
            group_by=["Instance"],
        ),
    ).create()

    yield ds_doc

    await ds_doc.delete()


@pytest_asyncio.fixture
async def volcengine_datasource_doc(test_volcengine_connect):
    """Create Volcengine DataSource document."""
    ds_doc = await DataSourceDoc(
        name="Test Volcengine DS",
        type=DataSourceType.Volcengine,
        connect=test_volcengine_connect,
        volcengine_config=VolcengineDataSourceConfig(
            name="Test Volcengine DS",
            connect_name="test_volcengine_connect",
            region="cn-beijing",
            namespace="VCM_ECS",
            metric_name="CpuUsagePercent",
            sub_namespace="ecs",
            group_by=["InstanceId"],
            instances=[{"InstanceId": "i-456"}],
        ),
    ).create()

    yield ds_doc

    await ds_doc.delete()


@pytest_asyncio.fixture
async def zabbix_connect():
    """Create Zabbix Connect document."""
    connect = await Connect(
        name="test_zabbix_connect",
        type=DataSourceType.Zabbix,
        zabbix_api_url="https://zabbix.example.com",
        zabbix_api_user="test_user",
        zabbix_api_password="test_password",
    ).create()

    yield connect

    await connect.delete()


@pytest_asyncio.fixture
async def zabbix_datasource_doc(zabbix_connect):
    """Create Zabbix DataSource document."""
    ds_doc = await DataSourceDoc(
        name="Test Zabbix DS",
        type=DataSourceType.Zabbix,
        connect=zabbix_connect,
        zabbix_config=ZabbixDataSourceConfig(
            name="Test Zabbix DS",
            connect_name="test_zabbix_connect",
            metric_name="system.cpu.load",
            history_type=0,
            targets=[ZabbixTarget(itemid="12345", hostname="test-host")],
        ),
    ).create()

    yield ds_doc

    await ds_doc.delete()


@pytest.mark.asyncio
async def test_create_aliyun_datasource(aliyun_datasource_doc):
    """Test creating Aliyun data source from document."""
    # Arrange
    await aliyun_datasource_doc.fetch_link(DataSourceDoc.connect)

    # Act
    datasource = DataSourceFactory.create_datasource(aliyun_datasource_doc)

    # Assert
    assert isinstance(datasource, AliyunDataSource)
    assert datasource.name == "Test Aliyun DS"
    assert datasource.region == "cn-beijing"
    assert datasource.namespace == "acs_ecs_dashboard"
    assert datasource.metric_name == "cpu.usage_active"
    assert datasource.dimensions == [{"Instance": "i-123"}]
    assert datasource.group_by == ["Instance"]
    assert datasource.interval_seconds == 60


@pytest.mark.asyncio
async def test_create_volcengine_datasource(volcengine_datasource_doc):
    """Test creating Volcengine data source from document."""
    # Arrange
    await volcengine_datasource_doc.fetch_link(DataSourceDoc.connect)

    # Act
    datasource = DataSourceFactory.create_datasource(volcengine_datasource_doc)

    # Assert
    assert isinstance(datasource, VolcengineDataSource)
    assert datasource.name == "Test Volcengine DS"
    assert datasource.region == "cn-beijing"
    assert datasource.namespace == "VCM_ECS"
    assert datasource.metric_name == "CpuUsagePercent"
    assert datasource.sub_namespace == "ecs"
    assert datasource.group_by == ["InstanceId"]
    assert datasource.instances is not None
    assert len(datasource.instances) == 1


@pytest.mark.asyncio
async def test_create_zabbix_datasource(zabbix_datasource_doc):
    """Test creating Zabbix data source from document."""
    # Arrange
    await zabbix_datasource_doc.fetch_link(DataSourceDoc.connect)

    # Act
    datasource = DataSourceFactory.create_datasource(zabbix_datasource_doc)

    # Assert
    assert isinstance(datasource, ZabbixDataSource)
    assert datasource.name == "Test Zabbix DS"
    assert datasource.metric_name == "system.cpu.load"
    assert datasource.history_type == 0
    assert datasource.targets is not None
    assert len(datasource.targets) == 1
    assert datasource.targets[0].itemid == "12345"
    assert datasource.targets[0].hostname == "test-host"


@pytest.mark.asyncio
async def test_create_datasource_with_none_document():
    """Test creating data source with None document raises error."""
    # Act & Assert
    with pytest.raises(ValueError, match="Data source document is required"):
        DataSourceFactory.create_datasource(None)  # type: ignore


@pytest.mark.asyncio
async def test_create_datasource_factory_create_fails_with_runtime_mock():
    """Test DataSourceFactory raises proper error for unsupported types."""
    # This test bypasses schema validation by testing the factory logic directly
    # Create a mock DataSource document with an invalid type
    from unittest.mock import MagicMock

    mock_doc = MagicMock()
    mock_doc.id = "test123"
    mock_doc.name = "Test Invalid"
    mock_doc.type = "InvalidType"  # Not Zabbix, Aliyun, or Volcengine

    # Act & Assert
    with pytest.raises(ValueError, match="Unsupported data source type"):
        DataSourceFactory.create_datasource(mock_doc)


@pytest.mark.asyncio
async def test_create_zabbix_without_config(zabbix_connect):
    """Test creating Zabbix data source without config raises error."""
    # Arrange - create document without zabbix_config
    ds_doc = await DataSourceDoc(
        name="Test Zabbix No Config",
        type=DataSourceType.Zabbix,
        connect=zabbix_connect,
    ).create()

    try:
        await ds_doc.fetch_link(DataSourceDoc.connect)

        # Act & Assert
        with pytest.raises(ValueError, match="Zabbix configuration is required"):
            DataSourceFactory.create_datasource(ds_doc)
    finally:
        await ds_doc.delete()


@pytest.mark.asyncio
async def test_create_aliyun_without_config(test_aliyun_connect):
    """Test creating Aliyun data source without config raises error."""
    # Arrange - create document without aliyun_config
    ds_doc = await DataSourceDoc(
        name="Test Aliyun No Config",
        type=DataSourceType.Aliyun,
        connect=test_aliyun_connect,
    ).create()

    try:
        await ds_doc.fetch_link(DataSourceDoc.connect)

        # Act & Assert
        with pytest.raises(ValueError, match="Aliyun configuration is required"):
            DataSourceFactory.create_datasource(ds_doc)
    finally:
        await ds_doc.delete()


@pytest.mark.asyncio
async def test_create_volcengine_without_config(test_volcengine_connect):
    """Test creating Volcengine data source without config raises error."""
    # Arrange - create document without volcengine_config
    ds_doc = await DataSourceDoc(
        name="Test Volcengine No Config",
        type=DataSourceType.Volcengine,
        connect=test_volcengine_connect,
    ).create()

    try:
        await ds_doc.fetch_link(DataSourceDoc.connect)

        # Act & Assert
        with pytest.raises(ValueError, match="Volcengine configuration is required"):
            DataSourceFactory.create_datasource(ds_doc)
    finally:
        await ds_doc.delete()


@pytest.mark.asyncio
async def test_validate_config_with_valid_aliyun(aliyun_datasource_doc):
    """Test validating config with valid Aliyun document."""
    # Act
    result = DataSourceFactory.validate_config(aliyun_datasource_doc)

    # Assert
    assert result is True


@pytest.mark.asyncio
async def test_validate_config_with_valid_volcengine(volcengine_datasource_doc):
    """Test validating config with valid Volcengine document."""
    # Act
    result = DataSourceFactory.validate_config(volcengine_datasource_doc)

    # Assert
    assert result is True


@pytest.mark.asyncio
async def test_validate_config_with_valid_zabbix(zabbix_datasource_doc):
    """Test validating config with valid Zabbix document."""
    # Act
    result = DataSourceFactory.validate_config(zabbix_datasource_doc)

    # Assert
    assert result is True


@pytest.mark.asyncio
async def test_validate_config_with_none_document():
    """Test validating config with None document."""
    # Act
    result = DataSourceFactory.validate_config(None)  # type: ignore

    # Assert
    assert result is False


@pytest.mark.asyncio
async def test_validate_config_with_missing_config(test_aliyun_connect):
    """Test validating config with missing configuration."""
    # Arrange
    ds_doc = await DataSourceDoc(
        name="Test No Config",
        type=DataSourceType.Aliyun,
        connect=test_aliyun_connect,
    ).create()

    try:
        # Act
        result = DataSourceFactory.validate_config(ds_doc)

        # Assert
        assert result is False
    finally:
        await ds_doc.delete()


@pytest.mark.asyncio
async def test_get_config_summary_with_aliyun(aliyun_datasource_doc):
    """Test getting config summary for Aliyun datasource."""
    # Act
    summary = DataSourceFactory.get_config_summary(aliyun_datasource_doc)

    # Assert
    assert summary["name"] == "Test Aliyun DS"
    assert summary["type"] == DataSourceType.Aliyun
    assert summary["region"] == "cn-beijing"
    assert summary["namespace"] == "acs_ecs_dashboard"
    assert summary["metric_name"] == "cpu.usage_active"


@pytest.mark.asyncio
async def test_get_config_summary_with_volcengine(volcengine_datasource_doc):
    """Test getting config summary for Volcengine datasource."""
    # Act
    summary = DataSourceFactory.get_config_summary(volcengine_datasource_doc)

    # Assert
    assert summary["name"] == "Test Volcengine DS"
    assert summary["type"] == DataSourceType.Volcengine
    assert summary["region"] == "cn-beijing"
    assert summary["namespace"] == "VCM_ECS"
    assert summary["metric_name"] == "CpuUsagePercent"
    assert summary["sub_namespace"] == "ecs"


@pytest.mark.asyncio
async def test_get_config_summary_with_zabbix(zabbix_datasource_doc):
    """Test getting config summary for Zabbix datasource."""
    # Act
    summary = DataSourceFactory.get_config_summary(zabbix_datasource_doc)

    # Assert
    assert summary["name"] == "Test Zabbix DS"
    assert summary["type"] == DataSourceType.Zabbix
    assert summary["metric_name"] == "system.cpu.load"
    assert summary["targets_count"] == 1


@pytest.mark.asyncio
async def test_get_config_summary_with_none_document():
    """Test getting config summary with None document."""
    # Act
    summary = DataSourceFactory.get_config_summary(None)  # type: ignore

    # Assert
    assert summary == {}


@pytest.mark.asyncio
async def test_create_volcengine_datasource_with_instances(volcengine_datasource_doc):
    """Test creating Volcengine datasource properly handles instances format."""
    # Arrange
    await volcengine_datasource_doc.fetch_link(DataSourceDoc.connect)

    # Act
    datasource = DataSourceFactory.create_datasource(volcengine_datasource_doc)

    # Assert
    assert isinstance(datasource, VolcengineDataSource)
    # Check instances property on VolcengineDataSource specifically
    volcengine_ds = datasource
    assert volcengine_ds.instances is not None
    assert len(volcengine_ds.instances) == 1
    # Verify instance dimensions are properly converted
    assert volcengine_ds.instances[0].dimensions is not None
    assert len(volcengine_ds.instances[0].dimensions) == 1
    assert volcengine_ds.instances[0].dimensions[0].name == "InstanceId"
    assert volcengine_ds.instances[0].dimensions[0].value == "i-456"
