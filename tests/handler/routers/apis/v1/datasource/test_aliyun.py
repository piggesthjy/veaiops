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

from unittest.mock import AsyncMock, patch

import pytest

from veaiops.schema.base import AliyunDataSourceConfig
from veaiops.schema.documents import DataSource
from veaiops.schema.types import DataSourceType

# Mock user fixture is now handled by conftest.py


@pytest.mark.asyncio
async def test_get_all_aliyun_datasource_success(test_client, aliyun_datasource):
    """Test successful retrieval of all Aliyun datasources."""

    response = test_client.get(
        "/apis/v1/datasource/aliyun/",
    )

    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Aliyun data sources retrieved successfully"
    assert len(data["data"]) == 1
    assert data["total"] == 1


@pytest.mark.asyncio
async def test_get_all_aliyun_datasource_with_filters(test_client, aliyun_datasource):
    """Test retrieval of Aliyun datasources with filters."""

    response = test_client.get(
        "/apis/v1/datasource/aliyun/?name=test&is_active=True",
    )

    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Aliyun data sources retrieved successfully"
    assert len(data["data"]) == 1
    assert data["total"] == 1


@pytest.mark.asyncio
async def test_get_aliyun_datasource_by_id_success(aliyun_datasource, test_client):
    """Test successful retrieval of an Aliyun datasource by ID."""
    with patch(
        "veaiops.handler.routers.apis.v1.datasource.aliyun.DataSource.get",
        new=AsyncMock(return_value=aliyun_datasource),
    ):
        response = test_client.get(
            f"/apis/v1/datasource/aliyun/{aliyun_datasource.id}",
        )

        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Aliyun data source retrieved successfully"
        assert data["data"]["_id"] == str(aliyun_datasource.id)


@pytest.mark.asyncio
async def test_get_aliyun_datasource_by_id_not_found(test_client):
    """Test retrieval of non-existent Aliyun datasource by ID."""
    with patch(
        "veaiops.handler.routers.apis.v1.datasource.aliyun.DataSource.get",
        new=AsyncMock(return_value=None),
    ):
        response = test_client.get(
            "/apis/v1/datasource/aliyun/507f1f77bcf86cd799439011",
        )

        assert response.status_code == 404
        data = response.json()
        assert "Aliyun data source with ID 507f1f77bcf86cd799439011 not found" in data["detail"]["message"]


@pytest.mark.asyncio
async def test_create_aliyun_datasource_success(test_client, aliyun_connect):
    """Test successful creation of an Aliyun datasource."""
    aliyun_config = AliyunDataSourceConfig(
        name="new_aliyun_datasource",
        connect_name=aliyun_connect.name,
        region="cn-hangzhou",
        namespace="acs_ecs_dashboard",
        metric_name="CPUUtilization",
    )

    response = test_client.post(
        "/apis/v1/datasource/aliyun/",
        json=aliyun_config.dict(),
    )

    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Aliyun data source created successfully"
    assert data["data"]["name"] == aliyun_config.name

    # 验证数据已保存到数据库
    created_datasource = await DataSource.get(data["data"]["_id"])
    assert created_datasource is not None
    assert created_datasource.name == aliyun_config.name
    assert created_datasource.type == DataSourceType.Aliyun


@pytest.mark.asyncio
async def test_create_aliyun_datasource_connect_not_found(test_client):
    """Test creation of an Aliyun datasource with non-existent connect."""
    aliyun_config = AliyunDataSourceConfig(
        name="new_aliyun_datasource",
        connect_name="nonexistent_connect",
        region="cn-hangzhou",
        namespace="acs_ecs_dashboard",
        metric_name="CPUUtilization",
    )

    response = test_client.post(
        "/apis/v1/datasource/aliyun/",
        json=aliyun_config.dict(),
    )

    assert response.status_code == 404
    data = response.json()
    assert "Connect with ID nonexistent_connect not found" in data["detail"]["message"]


@pytest.mark.asyncio
async def test_update_aliyun_datasource_success(aliyun_datasource, test_client):
    """Test successful update of an Aliyun datasource."""
    mock_ds_instance = AsyncMock(spec=DataSource)
    mock_ds_instance.id = aliyun_datasource.id
    mock_ds_instance.connect = aliyun_datasource.connect
    # Create a copy of the config to avoid modifying the fixture
    mock_ds_instance.aliyun_config = AliyunDataSourceConfig(**aliyun_datasource.aliyun_config.dict())
    mock_ds_instance.name = aliyun_datasource.name
    mock_ds_instance.type = aliyun_datasource.type
    mock_ds_instance.is_active = aliyun_datasource.is_active

    with patch(
        "veaiops.handler.routers.apis.v1.datasource.aliyun.DataSource.get",
        new=AsyncMock(return_value=mock_ds_instance),
    ):
        updated_config = AliyunDataSourceConfig(
            name="updated_aliyun_datasource",
            connect_name=aliyun_datasource.connect.name,
            region="us-west-1",
            namespace="acs_rds_dashboard",
            metric_name="MemoryUsage",
        )

        response = test_client.put(
            f"/apis/v1/datasource/aliyun/{aliyun_datasource.id}",
            json=updated_config.dict(),
        )

        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Aliyun data source updated successfully"
        assert data["data"]["aliyun_config"]["name"] == updated_config.name
        mock_ds_instance.save.assert_called_once()


@pytest.mark.asyncio
async def test_update_aliyun_datasource_not_found(test_client):
    """Test update of non-existent Aliyun datasource."""
    with patch(
        "veaiops.handler.routers.apis.v1.datasource.aliyun.DataSource.get",
        new=AsyncMock(return_value=None),
    ):
        updated_config = AliyunDataSourceConfig(
            name="updated_aliyun_datasource",
            connect_name="any_connect",
            region="us-west-1",
            namespace="acs_rds_dashboard",
            metric_name="MemoryUsage",
        )

        response = test_client.put(
            "/apis/v1/datasource/aliyun/507f1f77bcf86cd799439011",
            json=updated_config.dict(),
        )

        assert response.status_code == 404
        data = response.json()
        assert "Aliyun data source with ID 507f1f77bcf86cd799439011 not found" in data["detail"]["message"]


@pytest.mark.asyncio
async def test_delete_aliyun_datasource_success(aliyun_datasource, test_client):
    """Test successful deletion of an Aliyun datasource."""
    with patch(
        "veaiops.handler.routers.apis.v1.datasource.aliyun.DataSource.get",
        new=AsyncMock(return_value=aliyun_datasource),
    ):
        response = test_client.delete(
            f"/apis/v1/datasource/aliyun/{aliyun_datasource.id}",
        )

        assert response.status_code == 200
        data = response.json()
        assert data["message"] == f"Aliyun data source with ID {aliyun_datasource.id} deleted successfully"
        assert data["data"] is True


@pytest.mark.asyncio
async def test_delete_aliyun_datasource_not_found(test_client):
    """Test deletion of non-existent Aliyun datasource."""
    with patch(
        "veaiops.handler.routers.apis.v1.datasource.aliyun.DataSource.get",
        new=AsyncMock(return_value=None),
    ):
        response = test_client.delete(
            "/apis/v1/datasource/aliyun/507f1f77bcf86cd799439011",
        )

        assert response.status_code == 404
        data = response.json()
        assert "Aliyun data source with ID 507f1f77bcf86cd799439011 not found" in data["detail"]["message"]
