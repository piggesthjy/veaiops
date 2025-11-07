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

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from veaiops.metrics.timeseries import InputTimeSeries
from veaiops.schema.base import VolcengineDataSourceConfig
from veaiops.schema.models.datasource import BaseTimeseriesRequestPayload


@pytest.mark.asyncio
async def test_list_volcengine_contact_groups_success(volcengine_datasource, test_client):
    """Test successful retrieval of Volcengine contact groups."""
    # Mock the Volcengine client and its response
    mock_response = MagicMock()
    mock_response.to_dict.return_value = {
        "data": [
            {"name": "group1", "description": "Test group 1"},
            {"name": "group2", "description": "Test group 2"},
        ]
    }
    mock_response.total_count = 2

    mock_client = MagicMock()
    mock_client.list_contact_groups.return_value = mock_response

    with patch(
        "veaiops.handler.routers.apis.v1.datasource.volcengine.DataSource.get",
        new=AsyncMock(return_value=volcengine_datasource),
    ):
        with patch(
            "veaiops.schema.documents.datasource.base.DataSource.fetch_link",
            new=AsyncMock(),
        ):
            with patch(
                "veaiops.handler.routers.apis.v1.datasource.volcengine.VolcengineClient",
                return_value=mock_client,
            ):
                response = test_client.get(
                    f"/apis/v1/datasource/volcengine/contact_groups?datasource_id={volcengine_datasource.id}",
                )

                assert response.status_code == 200
                data = response.json()
                assert data["message"] == "Volcengine contact groups retrieved successfully"
                assert len(data["data"]) == 2
                assert data["total"] == 2


@pytest.mark.asyncio
async def test_list_volcengine_contact_groups_with_name_filter(volcengine_datasource, test_client):
    """Test retrieval of Volcengine contact groups with name filter."""
    # Mock the Volcengine client and its response
    mock_response = MagicMock()
    mock_response.to_dict.return_value = {"data": [{"name": "group1", "description": "Test group 1"}]}
    mock_response.total_count = 1

    mock_client = MagicMock()
    mock_client.list_contact_groups.return_value = mock_response

    with patch(
        "veaiops.handler.routers.apis.v1.datasource.volcengine.DataSource.get",
        new=AsyncMock(return_value=volcengine_datasource),
    ):
        with patch(
            "veaiops.schema.documents.datasource.base.DataSource.fetch_link",
            new=AsyncMock(),
        ):
            with patch(
                "veaiops.handler.routers.apis.v1.datasource.volcengine.VolcengineClient",
                return_value=mock_client,
            ):
                response = test_client.get(
                    f"/apis/v1/datasource/volcengine/contact_groups?datasource_id={volcengine_datasource.id}&name=group1",
                )

                assert response.status_code == 200
                data = response.json()
                assert data["message"] == "Volcengine contact groups retrieved successfully"
                assert len(data["data"]) == 1
                assert data["data"][0]["name"] == "group1"


@pytest.mark.asyncio
async def test_list_volcengine_contact_groups_datasource_not_found(test_client):
    """Test listing Volcengine contact groups when datasource is not found."""
    with patch(
        "veaiops.handler.routers.apis.v1.datasource.volcengine.DataSource.get",
        new=AsyncMock(return_value=None),
    ):
        response = test_client.get(
            "/apis/v1/datasource/volcengine/507f1f77bcf86cd799439011/contact_groups",
        )

        assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_all_volcengine_datasource_success(volcengine_datasource, test_client):
    """Test successful retrieval of all Volcengine datasources."""
    # Create a mock query object
    mock_query = MagicMock()
    mock_query.count = AsyncMock(return_value=1)
    mock_query.skip = MagicMock(return_value=mock_query)
    mock_query.limit = MagicMock(return_value=mock_query)
    mock_query.to_list = AsyncMock(return_value=[volcengine_datasource])

    with patch(
        "veaiops.handler.routers.apis.v1.datasource.volcengine.DataSource.find",
        return_value=mock_query,
    ):
        response = test_client.get(
            "/apis/v1/datasource/volcengine/",
        )

        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Volcengine data sources retrieved successfully"
        assert len(data["data"]) == 1
        assert data["total"] == 1


@pytest.mark.asyncio
async def test_get_all_volcengine_datasource_with_filters(volcengine_datasource, test_client):
    """Test retrieval of Volcengine datasources with filters."""
    # Create a mock query object
    mock_query = MagicMock()
    mock_query.count = AsyncMock(return_value=1)
    mock_query.skip = MagicMock(return_value=mock_query)
    mock_query.limit = MagicMock(return_value=mock_query)
    mock_query.to_list = AsyncMock(return_value=[volcengine_datasource])

    with patch(
        "veaiops.handler.routers.apis.v1.datasource.volcengine.DataSource.find",
        return_value=mock_query,
    ):
        response = test_client.get(
            "/apis/v1/datasource/volcengine/?name=test&is_active=True",
        )

        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Volcengine data sources retrieved successfully"
        assert len(data["data"]) == 1
        assert data["total"] == 1


@pytest.mark.asyncio
async def test_get_volcengine_datasource_by_id_success(volcengine_datasource, test_client):
    """Test successful retrieval of a Volcengine datasource by ID."""
    with patch(
        "veaiops.handler.routers.apis.v1.datasource.volcengine.DataSource.get",
        new=AsyncMock(return_value=volcengine_datasource),
    ):
        response = test_client.get(
            f"/apis/v1/datasource/volcengine/datasource_id/{volcengine_datasource.id}",
        )

        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Volcengine data source retrieved successfully"
        assert data["data"]["_id"] == str(volcengine_datasource.id)


@pytest.mark.asyncio
async def test_get_volcengine_datasource_by_id_not_found(test_client):
    """Test retrieval of non-existent Volcengine datasource by ID."""
    response = test_client.get(
        "/apis/v1/datasource/volcengine/datasource_id/507f1f77bcf86cd799439011",
    )

    assert response.status_code == 404
    data = response.json()
    assert "Volcengine data source with ID 507f1f77bcf86cd799439011 not found" in data["detail"]["message"]


@pytest.mark.asyncio
async def test_create_volcengine_datasource_success(volcengine_connect, test_client):
    """Test successful creation of a Volcengine datasource."""
    # Use the existing volcengine_connect fixture
    # Now create the datasource
    volcengine_config = VolcengineDataSourceConfig(
        name="new_volcengine_datasource",
        connect_name=volcengine_connect.name,
        region="cn-beijing",
        namespace="ecs",
        sub_namespace="ecs",
        metric_name="cpu.usage_active",
    )

    response = test_client.post(
        "/apis/v1/datasource/volcengine/",
        json={
            "name": volcengine_config.name,
            "connect_name": volcengine_config.connect_name,
            "region": volcengine_config.region,
            "namespace": volcengine_config.namespace,
            "sub_namespace": volcengine_config.sub_namespace,
            "metric_name": volcengine_config.metric_name,
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Volcengine data source created successfully"
    assert data["data"]["name"] == volcengine_config.name


@pytest.mark.asyncio
async def test_create_volcengine_datasource_connect_not_found(test_client):
    """Test creation of a Volcengine datasource with non-existent connect."""
    response = test_client.post(
        "/apis/v1/datasource/volcengine/",
        json={
            "name": "new_volcengine_datasource",
            "connect_name": "nonexistent_connect",
            "region": "cn-beijing",
            "namespace": "ecs",
            "sub_namespace": "ecs",
            "metric_name": "cpu.usage_active",
        },
    )

    assert response.status_code == 404
    data = response.json()
    assert "Connect with ID nonexistent_connect not found" in data["detail"]["message"]


@pytest.mark.asyncio
async def test_update_volcengine_datasource_success(volcengine_connect, test_client):
    """Test successful update of a Volcengine datasource."""
    # The connection already exists via the volcengine_connect fixture
    # Now create a datasource that we can update
    volcengine_config = VolcengineDataSourceConfig(
        name="test_volcengine_datasource_for_update",
        connect_name=volcengine_connect.name,
        region="cn-beijing",
        namespace="ecs",
        sub_namespace="ecs",
        metric_name="cpu.usage_active",
    )

    create_response = test_client.post(
        "/apis/v1/datasource/volcengine/",
        json={
            "name": volcengine_config.name,
            "connect_name": volcengine_config.connect_name,
            "region": volcengine_config.region,
            "namespace": volcengine_config.namespace,
            "sub_namespace": volcengine_config.sub_namespace,
            "metric_name": volcengine_config.metric_name,
        },
    )

    assert create_response.status_code == 200
    created_data = create_response.json()
    datasource_id = created_data["data"]["_id"]

    # Now update the created datasource
    response = test_client.put(
        f"/apis/v1/datasource/volcengine/datasource_id/{datasource_id}",
        json={
            "name": "test_volcengine_datasource_for_update",  # Name field is not actually updated by the API
            "connect_name": volcengine_connect.name,
            "region": "cn-shanghai",  # Change region to verify update
            "namespace": "ecs",
            "sub_namespace": "ecs",
            "metric_name": "cpu.usage_active",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Volcengine data source updated successfully"
    # The name should remain the same as the API doesn't actually update the name field
    assert data["data"]["name"] == "test_volcengine_datasource_for_update"
    # But the region should be updated
    assert data["data"]["volcengine_config"]["region"] == "cn-shanghai"


@pytest.mark.asyncio
async def test_update_volcengine_datasource_not_found(test_client):
    """Test update of a non-existent Volcengine datasource."""
    response = test_client.put(
        "/apis/v1/datasource/volcengine/datasource_id/nonexistent_id",
        json={
            "name": "updated_volcengine_datasource",
            "connect_name": "test_connect",
            "region": "cn-beijing",
            "namespace": "ecs",
            "sub_namespace": "ecs",
            "metric_name": "cpu.usage_active",
        },
    )

    assert response.status_code == 400


@pytest.mark.asyncio
async def test_delete_volcengine_datasource_success(volcengine_connect, test_client):
    """Test successful deletion of a Volcengine datasource."""
    # The connection already exists via the volcengine_connect fixture
    # Now create a datasource that we can delete
    volcengine_config = VolcengineDataSourceConfig(
        name="test_volcengine_datasource_for_delete",
        connect_name=volcengine_connect.name,
        region="cn-beijing",
        namespace="ecs",
        sub_namespace="ecs",
        metric_name="cpu.usage_active",
    )

    create_response = test_client.post(
        "/apis/v1/datasource/volcengine/",
        json={
            "name": volcengine_config.name,
            "connect_name": volcengine_config.connect_name,
            "region": volcengine_config.region,
            "namespace": volcengine_config.namespace,
            "sub_namespace": volcengine_config.sub_namespace,
            "metric_name": volcengine_config.metric_name,
        },
    )

    assert create_response.status_code == 200
    created_data = create_response.json()
    datasource_id = created_data["data"]["_id"]

    # Now delete the created datasource
    response = test_client.delete(
        f"/apis/v1/datasource/volcengine/datasource_id/{datasource_id}",
    )

    assert response.status_code == 200
    data = response.json()
    assert data["message"] == f"Volcengine data source with ID {datasource_id} deleted successfully"


@pytest.mark.asyncio
async def test_delete_volcengine_datasource_not_found(test_client):
    """Test deletion of non-existent Volcengine datasource."""
    response = test_client.delete(
        "/apis/v1/datasource/volcengine/datasource_id/507f1f77bcf86cd799439011",
    )

    assert response.status_code == 404
    data = response.json()
    assert "Volcengine data source with ID 507f1f77bcf86cd799439011 not found" in data["detail"]["message"]


@pytest.mark.asyncio
async def test_get_metrics_timeseries_success(volcengine_datasource, test_client):
    """Test successful retrieval of metrics timeseries data."""
    timeseries_request = BaseTimeseriesRequestPayload(
        datasource_id=str(volcengine_datasource.id),
        start_time=1641038400,
        end_time=1641038500,
        period="60s",
        instances=[{"instance_id": "i-1234567890abcdef0"}],
    )

    volcengine_datasource_client = MagicMock()
    volcengine_datasource_client.client = MagicMock()
    mock_response = {
        "data": {
            "metric_data_results": [
                {
                    "dimensions": [{"name": "instance_id", "value": "i-1234567890abcdef0"}],
                    "timestamps": [1641038460, 1641038520],
                    "values": [75.5, 80.2],
                }
            ]
        }
    }
    volcengine_datasource_client.test_client.get_metric_data.return_value = mock_response

    # 模拟 convert_datapoints_to_timeseries 方法返回有效的 timeseries 数据
    mock_timeseries = [
        InputTimeSeries(
            name="test_metric",
            timestamps=[1641038460000, 1641038520000],
            values=[75.5, 80.2],
            labels={"instance_id": "i-1234567890abcdef0"},
            unique_key="test_metric|instance_id=i-1234567890abcdef0",
        )
    ]
    volcengine_datasource_client.convert_datapoints_to_timeseries.return_value = mock_timeseries

    with patch(
        "veaiops.handler.routers.apis.v1.datasource.volcengine.DataSource.get",
        new=AsyncMock(return_value=volcengine_datasource),
    ):
        with patch(
            "veaiops.schema.documents.datasource.base.DataSource.fetch_link",
            new=AsyncMock(),
        ):
            with patch(
                "veaiops.metrics.datasource_factory.DataSourceFactory.create_datasource",
                return_value=volcengine_datasource_client,
            ):
                response = test_client.post(
                    "/apis/v1/datasource/volcengine/metrics/timeseries",
                    json=timeseries_request.dict(),
                )
                assert response.status_code == 200
                data = response.json()
                assert data["message"] == "success"
                assert len(data["data"]) > 0


@pytest.mark.asyncio
async def test_get_metrics_timeseries_with_default_time(volcengine_datasource, test_client):
    """Test retrieval of metrics timeseries data with default time range."""
    timeseries_request = BaseTimeseriesRequestPayload(
        datasource_id=str(volcengine_datasource.id),
        period="60s",
        instances=[{"instance_id": "i-1234567890abcdef0"}],
    )

    volcengine_datasource_client = MagicMock()
    volcengine_datasource_client.client = MagicMock()
    mock_response = {
        "data": {
            "metric_data_results": [
                {
                    "dimensions": [{"name": "instance_id", "value": "i-1234567890abcdef0"}],
                    "timestamps": [1641038460],
                    "values": [75.5],
                }
            ]
        }
    }
    volcengine_datasource_client.test_client.get_metric_data.return_value = mock_response

    # 模拟 convert_datapoints_to_timeseries 方法返回有效的 timeseries 数据
    mock_timeseries = [
        InputTimeSeries(
            name="test_metric",
            timestamps=[1641038460000],
            values=[75.5],
            labels={"instance_id": "i-1234567890abcdef0"},
            unique_key="test_metric|instance_id=i-1234567890abcdef0",
        )
    ]
    volcengine_datasource_client.convert_datapoints_to_timeseries.return_value = mock_timeseries

    with patch(
        "veaiops.handler.routers.apis.v1.datasource.volcengine.DataSource.get",
        new=AsyncMock(return_value=volcengine_datasource),
    ):
        with patch(
            "veaiops.schema.documents.datasource.base.DataSource.fetch_link",
            new=AsyncMock(),
        ):
            with patch(
                "veaiops.metrics.datasource_factory.DataSourceFactory.create_datasource",
                return_value=volcengine_datasource_client,
            ):
                response = test_client.post(
                    "/apis/v1/datasource/volcengine/metrics/timeseries",
                    json=timeseries_request.dict(),
                )
                assert response.status_code == 200
                data = response.json()
                assert data["message"] == "success"
                assert len(data["data"]) > 0


@pytest.mark.asyncio
async def test_get_metrics_timeseries_datasource_not_found(test_client):
    """Test retrieval of metrics timeseries data for non-existent datasource."""
    timeseries_request = BaseTimeseriesRequestPayload(
        datasource_id="nonexistent_id",
        start_time=1641038400,
        end_time=1641038500,
        period="60s",
        instances=[{"instance_id": "i-1234567890abcdef0"}],
    )

    with patch(
        "veaiops.handler.routers.apis.v1.datasource.volcengine.DataSource.get",
        new=AsyncMock(return_value=None),
    ):
        response = test_client.post(
            "/apis/v1/datasource/volcengine/metrics/timeseries",
            json=timeseries_request.dict(),
        )
        assert response.status_code == 404
        data = response.json()
        assert "Volcengine data source with ID nonexistent_id not found" in data["detail"]["message"]
