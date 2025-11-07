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

"""Tests for connect router endpoints."""

from unittest.mock import MagicMock, patch

import pytest

from tests.handler.routers.apis.v1.datasource.conftest import create_connect_payload
from veaiops.schema.documents import Connect
from veaiops.schema.models.datasource import (
    AliyunMetricConfig,
    AliyunMetricMetaListPayload,
)
from veaiops.schema.types import DataSourceType

# ============================================================================
# GET Connect Tests
# ============================================================================


@pytest.mark.asyncio
async def test_get_all_connects_success(test_client, aliyun_connect):
    """Test successful retrieval of all connects."""
    response = test_client.get("/apis/v1/datasource/connect/")

    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Connects retrieved successfully"
    assert len(data["data"]) >= 1
    assert data["total"] >= 1


@pytest.mark.asyncio
async def test_get_all_connects_with_type_filter(test_client, aliyun_connect, volcengine_connect):
    """Test retrieval of connects with type filter."""
    response = test_client.get(
        "/apis/v1/datasource/connect/",
        params={"datasource_type": "Aliyun"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Connects retrieved successfully"
    # Verify at least one Aliyun connect is returned
    assert any(c["type"] == "Aliyun" for c in data["data"])


@pytest.mark.asyncio
async def test_get_connect_by_id_success(test_client, aliyun_connect):
    """Test successful retrieval of a connect by ID."""
    response = test_client.get(f"/apis/v1/datasource/connect/{aliyun_connect.id}")

    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Connect retrieved successfully"
    assert data["data"]["_id"] == str(aliyun_connect.id)
    assert data["data"]["name"] == aliyun_connect.name
    assert data["data"]["type"] == aliyun_connect.type.value


@pytest.mark.asyncio
async def test_get_connect_by_id_not_found(test_client):
    """Test retrieval of non-existent connect by ID."""
    response = test_client.get("/apis/v1/datasource/connect/507f1f77bcf86cd799439011")

    assert response.status_code == 404


# ============================================================================
# CREATE Connect Tests
# ============================================================================


@pytest.mark.asyncio
async def test_create_connect_volcengine_success(test_client, test_user):
    """Test successful creation of different datasource types."""
    for ds_type in [DataSourceType.Aliyun, DataSourceType.Volcengine, DataSourceType.Zabbix]:
        payload = create_connect_payload(f"new_{ds_type.value}_connect", ds_type)
        response = test_client.post("/apis/v1/datasource/connect/", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert data["data"]["type"] == ds_type.value.capitalize()

        # Verify it was saved to database
        created = await Connect.get(data["data"]["_id"])
        assert created is not None
        assert created.type == ds_type


# ============================================================================
# UPDATE Connect Tests
# ============================================================================


@pytest.mark.asyncio
async def test_update_connect_success(test_client, aliyun_connect, test_user):
    """Test successful update of a connect."""
    update_payload = {
        "aliyun_access_key_id": "updated_access_key",
        "aliyun_access_key_secret": "updated_secret",
    }

    response = test_client.put(
        f"/apis/v1/datasource/connect/{aliyun_connect.id}",
        json=update_payload,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Connect updated successfully"
    assert data["data"]["_id"] == str(aliyun_connect.id)

    # Verify update in database
    updated = await Connect.get(aliyun_connect.id)
    assert updated is not None


@pytest.mark.asyncio
async def test_delete_connect_not_found(test_client):
    """Test deletion of non-existent connect."""
    response = test_client.delete("/apis/v1/datasource/connect/507f1f77bcf86cd799439011")

    assert response.status_code in [400, 404]


# ============================================================================
# Test Connection Endpoint Tests
# ============================================================================


@pytest.mark.asyncio
async def test_test_connect_volcengine(test_client):
    """Test connection test for different datasource types."""
    for ds_type, client_class in [
        (DataSourceType.Aliyun, "AliyunClient"),
        (DataSourceType.Volcengine, "VolcengineClient"),
        (DataSourceType.Zabbix, "ZabbixClient"),
    ]:
        mock_client = MagicMock()
        mock_client.test_connection = MagicMock()
        mock_client.create_default_mediatype = MagicMock()
        mock_client.create_default_action = MagicMock()

        with patch(
            f"veaiops.handler.routers.apis.v1.datasource.connect.{client_class}",
            return_value=mock_client,
        ):
            payload = create_connect_payload("test_connect", ds_type)

            response = test_client.post(
                "/apis/v1/datasource/connect/dail",
                json=payload,
            )

            assert response.status_code == 200
            data = response.json()
            assert data["message"] == "Connection test successful"
            mock_client.test_connection.assert_called_once()


@pytest.mark.asyncio
async def test_test_connect_unsupported_type(test_client):
    """Test connection test with unsupported data source type."""
    payload = {
        "name": "test_connect",
        "type": "UnsupportedType",
    }

    response = test_client.post(
        "/apis/v1/datasource/connect/dail",
        json=payload,
    )

    assert response.status_code == 422


# ============================================================================
# Aliyun Project Meta Tests
# ============================================================================


@pytest.mark.asyncio
async def test_describe_aliyun_project_meta_not_found(test_client):
    """Test project meta endpoint with non-existent connect."""
    payload = {"project": None}

    response = test_client.post(
        "/apis/v1/datasource/connect/507f1f77bcf86cd799439011/describe-project-meta",
        json=payload,
    )

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_describe_aliyun_project_meta_wrong_type(test_client, volcengine_connect):
    """Test project meta endpoint with non-Aliyun connect."""
    payload = {"project": None}

    response = test_client.post(
        f"/apis/v1/datasource/connect/{volcengine_connect.id}/describe-project-meta",
        json=payload,
    )

    assert response.status_code == 404


# ============================================================================
# Aliyun Metric Meta Tests
# ============================================================================


@pytest.mark.asyncio
async def test_describe_aliyun_metric_meta_list_not_found(test_client):
    """Test metric meta list endpoint with non-existent connect."""
    payload = AliyunMetricMetaListPayload(
        namespace="acs_ecs_dashboard",
        metric_name=None,
    )

    response = test_client.post(
        "/apis/v1/datasource/connect/507f1f77bcf86cd799439011/describe-metric-meta-list",
        json=payload.model_dump(),
    )

    # Should return 404 when connect not found
    assert response.status_code in [404, 500]


@pytest.mark.asyncio
async def test_describe_aliyun_metric_meta_list_wrong_type(test_client, volcengine_connect):
    """Test metric meta list endpoint with non-Aliyun connect."""
    payload = AliyunMetricMetaListPayload(
        namespace="acs_ecs_dashboard",
        metric_name=None,
    )

    response = test_client.post(
        f"/apis/v1/datasource/connect/{volcengine_connect.id}/describe-metric-meta-list",
        json=payload.model_dump(),
    )

    # Should return 404 or error when connect type is wrong
    assert response.status_code in [404, 500]


# ============================================================================
# Aliyun Contact Group Tests
# ============================================================================


@pytest.mark.asyncio
async def test_describe_aliyun_contact_group_list_not_found(test_client):
    """Test contact group list endpoint with non-existent connect."""
    response = test_client.post(
        "/apis/v1/datasource/connect/507f1f77bcf86cd799439011/describe-contact-group-list",
    )

    assert response.status_code in [404, 500]


@pytest.mark.asyncio
async def test_describe_aliyun_contact_group_list_wrong_type(test_client, volcengine_connect):
    """Test contact group list endpoint with non-Aliyun connect."""
    response = test_client.post(
        f"/apis/v1/datasource/connect/{volcengine_connect.id}/describe-contact-group-list",
    )

    assert response.status_code in [404, 500]


# ============================================================================
# Aliyun Search Instances Tests
# ============================================================================


@pytest.mark.asyncio
async def test_search_aliyun_instances_connect_not_found(test_client):
    """Test search instances endpoint with non-existent connect."""
    payload = AliyunMetricConfig(
        connect_name="non_existent_connect",
        region="cn-beijing",
        namespace="acs_ecs_dashboard",
        metric_name="CPUUtilization",
        dimensions=[{"InstanceId": "i-test"}],
    )

    response = test_client.post(
        "/apis/v1/datasource/connect/aliyun/metrics/instances",
        json=payload.model_dump(),
    )

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_search_aliyun_instances_with_valid_connect(test_client, aliyun_connect):
    """Test search instances endpoint with valid Aliyun connect."""
    payload = AliyunMetricConfig(
        connect_name=aliyun_connect.name,
        region="cn-beijing",
        namespace="acs_ecs_dashboard",
        metric_name="CPUUtilization",
        dimensions=[{"InstanceId": "i-test"}],
    )

    mock_response = MagicMock()
    mock_response.body.datapoints = "[]"
    mock_response.body.next_token = None

    mock_client = MagicMock()
    mock_client.get_metric_data.return_value = mock_response

    with patch(
        "veaiops.handler.routers.apis.v1.datasource.connect.AliyunClient",
        return_value=mock_client,
    ):
        with patch(
            "veaiops.handler.routers.apis.v1.datasource.connect.decrypt_secret_value",
            return_value="decrypted_secret",
        ):
            response = test_client.post(
                "/apis/v1/datasource/connect/aliyun/metrics/instances",
                json=payload.model_dump(),
            )

            assert response.status_code == 200
            data = response.json()
            assert data["message"] == "success"
            assert isinstance(data["data"], list)


@pytest.mark.asyncio
async def test_search_aliyun_instances_with_multiple_data_points(test_client, aliyun_connect):
    """Test search instances with multiple data points and deduplication."""
    payload = AliyunMetricConfig(
        connect_name=aliyun_connect.name,
        region="cn-beijing",
        namespace="acs_ecs_dashboard",
        metric_name="CPUUtilization",
        dimensions=[{"InstanceId": "i-test"}],
    )

    # Multiple data points with same instance - should be deduplicated
    mock_response = MagicMock()
    mock_response.body.datapoints = '[{"timestamp": 1234567890, "InstanceId": "i-123", "Value": 50}, {"timestamp": 1234567891, "InstanceId": "i-123", "Value": 55}]'  # noqa: E501
    mock_response.body.next_token = None

    mock_client = MagicMock()
    mock_client.get_metric_data.return_value = mock_response

    with patch(
        "veaiops.handler.routers.apis.v1.datasource.connect.AliyunClient",
        return_value=mock_client,
    ):
        with patch(
            "veaiops.handler.routers.apis.v1.datasource.connect.decrypt_secret_value",
            return_value="decrypted_secret",
        ):
            response = test_client.post(
                "/apis/v1/datasource/connect/aliyun/metrics/instances",
                json=payload.model_dump(),
            )

            assert response.status_code == 200
            data = response.json()
            assert data["message"] == "success"
            # Should only have 1 unique instance after deduplication
            assert len(data["data"]) == 1


@pytest.mark.asyncio
async def test_describe_aliyun_project_meta_with_pagination(test_client):
    """Test project meta endpoint pagination parameters."""
    payload = {"project": None}

    response = test_client.post(
        "/apis/v1/datasource/connect/507f1f77bcf86cd799439011/describe-project-meta",
        json=payload,
        params={"skip": 0, "limit": 50},
    )

    # Should return 404 since connect doesn't exist
    assert response.status_code in [404, 500]


@pytest.mark.asyncio
async def test_create_connect_missing_credentials(test_client, test_user):
    """Test creation of connect with missing credentials."""
    # Missing required fields
    payload = {
        "name": "incomplete_connect",
        "type": "Aliyun",
        # Missing aliyun_access_key_id and aliyun_access_key_secret
    }

    response = test_client.post("/apis/v1/datasource/connect/", json=payload)

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_update_connect_partial(test_client, aliyun_connect, test_user):
    """Test partial update of a connect."""
    update_payload = {
        "aliyun_access_key_id": "new_key_only",
        # Other fields not provided
    }

    response = test_client.put(
        f"/apis/v1/datasource/connect/{aliyun_connect.id}",
        json=update_payload,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Connect updated successfully"


@pytest.mark.asyncio
async def test_get_all_connects_with_large_skip(test_client):
    """Test retrieval with skip larger than total."""
    response = test_client.get(
        "/apis/v1/datasource/connect/",
        params={"skip": 10000, "limit": 10},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 0


@pytest.mark.asyncio
async def test_search_aliyun_instances_pagination(test_client, aliyun_connect):
    """Test search instances with pagination (next_token)."""
    payload = AliyunMetricConfig(
        connect_name=aliyun_connect.name,
        region="cn-beijing",
        namespace="acs_ecs_dashboard",
        metric_name="CPUUtilization",
        dimensions=[{"InstanceId": "i-test"}],
    )

    # First response with next_token
    mock_response_1 = MagicMock()
    mock_response_1.body.datapoints = '[{"timestamp": 1234567890, "InstanceId": "i-1", "Value": 50}]'
    mock_response_1.body.next_token = "token_page_2"

    # Second response with no next_token
    mock_response_2 = MagicMock()
    mock_response_2.body.datapoints = '[{"timestamp": 1234567891, "InstanceId": "i-2", "Value": 55}]'
    mock_response_2.body.next_token = None

    mock_client = MagicMock()
    mock_client.get_metric_data.side_effect = [mock_response_1, mock_response_2]

    with patch(
        "veaiops.handler.routers.apis.v1.datasource.connect.AliyunClient",
        return_value=mock_client,
    ):
        with patch(
            "veaiops.handler.routers.apis.v1.datasource.connect.decrypt_secret_value",
            return_value="decrypted_secret",
        ):
            response = test_client.post(
                "/apis/v1/datasource/connect/aliyun/metrics/instances",
                json=payload.model_dump(),
            )

            assert response.status_code == 200
            data = response.json()
            assert data["message"] == "success"
            # Should have 2 instances from both pages
            assert len(data["data"]) == 2
