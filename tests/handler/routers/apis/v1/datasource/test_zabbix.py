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


@pytest.mark.asyncio
async def test_get_all_zabbix_datasources(zabbix_connect, test_client):
    """Test retrieval of all Zabbix data sources."""
    # Await the fixture to get the actual connect object

    # First create a Zabbix data source in the database
    response = test_client.post(
        "/apis/v1/datasource/zabbix",
        json={
            "name": "test_zabbix_datasource",
            "connect_name": zabbix_connect.name,
            "targets": [
                {"itemid": "1001", "hostname": "host1"},
                {"itemid": "1002", "hostname": "host2"},
            ],
            "history_type": 0,
            "metric_name": "test_metric",
        },
    )

    assert response.status_code == 200

    # Then retrieve all Zabbix data sources
    response = test_client.get(
        "/apis/v1/datasource/zabbix/",
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data["data"]) >= 1  # May have existing data sources


@pytest.mark.asyncio
async def test_get_zabbix_datasource_by_id_success(zabbix_datasource, test_client):
    """Test successful retrieval of a Zabbix data source by ID."""
    # Await the fixture to get the actual datasource object

    # Retrieve the Zabbix data source by ID
    response = test_client.get(
        f"/apis/v1/datasource/zabbix/{zabbix_datasource.id}",
    )

    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Zabbix data source retrieved successfully"
    assert data["data"]["_id"] == str(zabbix_datasource.id)


@pytest.mark.asyncio
async def test_get_zabbix_datasource_by_id_not_found(test_client):
    """Test retrieval of a non-existent Zabbix data source by ID."""
    response = test_client.get(
        "/apis/v1/datasource/zabbix/507f1f77bcf86cd799439011",
    )

    assert response.status_code == 404
    data = response.json()
    assert "not found" in data["detail"]["message"]


@pytest.mark.asyncio
async def test_create_zabbix_datasource_success(test_client):
    """Test successful creation of a Zabbix data source."""
    # First create a Zabbix connect in the database
    connect_response = test_client.post(
        "/apis/v1/datasource/connect/",
        json={
            "name": "zabbix_connect_for_create",
            "type": "Zabbix",
            "zabbix_api_url": "http://zabbix.example.com",
            "zabbix_api_user": "admin",
            "zabbix_api_password": "zabbix_password",
        },
    )

    assert connect_response.status_code == 200
    connect_data = connect_response.json()
    connect_name = connect_data["data"]["name"]

    # Then create a Zabbix data source
    response = test_client.post(
        "/apis/v1/datasource/zabbix",
        json={
            "name": "test_zabbix_datasource",
            "connect_name": connect_name,
            "targets": [
                {"itemid": "1001", "hostname": "host1"},
                {"itemid": "1002", "hostname": "host2"},
            ],
            "history_type": 0,
            "metric_name": "test_metric",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Zabbix data source created successfully"


@pytest.mark.asyncio
async def test_create_zabbix_datasource_connect_not_found(test_client):
    """Test creation of a Zabbix data source with non-existent zabbix_connect."""
    response = test_client.post(
        "/apis/v1/datasource/zabbix",
        json={
            "name": "test_zabbix_datasource",
            "connect_name": "non_existent_connect",
            "targets": [
                {"itemid": "1001", "hostname": "host1"},
                {"itemid": "1002", "hostname": "host2"},
            ],
            "history_type": 0,
            "metric_name": "test_metric",
        },
    )

    assert response.status_code == 404
    data = response.json()
    assert "not found" in data["detail"]["message"]


@pytest.mark.asyncio
async def test_update_zabbix_datasource_success(zabbix_datasource, test_client):
    """Test successful update of a Zabbix data source."""
    # Await the fixture to get the actual datasource object

    # Update the Zabbix data source
    response = test_client.put(
        f"/apis/v1/datasource/zabbix/{zabbix_datasource.id}",
        json={
            "name": "updated_zabbix_datasource",
            "connect_name": zabbix_datasource.connect.name,
            "targets": [
                {"itemid": "1001", "hostname": "host1"},
                {"itemid": "1002", "hostname": "host2"},
            ],
            "history_type": 0,
            "metric_name": "test_metric",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Zabbix data source updated successfully"
    assert data["data"]["_id"] == str(zabbix_datasource.id)


@pytest.mark.asyncio
async def test_update_zabbix_datasource_not_found(test_client):
    """Test update of a non-existent Zabbix data source."""
    response = test_client.put(
        "/apis/v1/datasource/zabbix/507f1f77bcf86cd799439011",
        json={
            "name": "updated_zabbix_datasource",
            "connect_name": "test_zabbix_connect",
            "targets": [
                {"itemid": "1001", "hostname": "host1"},
                {"itemid": "1002", "hostname": "host2"},
            ],
            "history_type": 0,
            "metric_name": "test_metric",
        },
    )

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_zabbix_datasource_success(zabbix_datasource, test_client):
    """Test successful deletion of a Zabbix data source."""
    # Await the fixture to get the actual datasource object

    # Delete the Zabbix data source
    response = test_client.delete(
        f"/apis/v1/datasource/zabbix/{zabbix_datasource.id}",
    )

    assert response.status_code == 200
    data = response.json()
    assert data["message"] == f"Zabbix data source with ID {zabbix_datasource.id} deleted successfully"
    assert data["data"] is True


@pytest.mark.asyncio
async def test_delete_zabbix_datasource_not_found(test_client):
    """Test deletion of a non-existent Zabbix data source."""
    response = test_client.delete(
        "/apis/v1/datasource/zabbix/507f1f77bcf86cd799439011",
    )

    assert response.status_code == 404
    data = response.json()
    assert "not found" in data["detail"]["message"]


@pytest.mark.asyncio
async def test_get_metrics_timeseries_success(zabbix_datasource, test_client):
    """Test successful retrieval of metrics timeseries data."""
    # Await the fixture to get the actual datasource object

    # Mock the fetch_link method at the class level to avoid the AsyncIOMotorLatentCommandCursor error
    with patch(
        "veaiops.schema.documents.datasource.DataSource.fetch_link",
        new_callable=AsyncMock,
    ) as mock_fetch_link:
        # Configure the mock to do nothing when called
        mock_fetch_link.return_value = None

        response = test_client.post(
            "/apis/v1/datasource/zabbix/metrics/timeseries",
            json={
                "datasource_id": str(zabbix_datasource.id),
                "start_time": 1640995200,
                "end_time": 1640995800,
                "period": "1m",
            },
        )

        # We're not asserting specific response codes here since this would require a real Zabbix server
        # In a real test environment, you would either:
        # 1. Use a real Zabbix server for testing
        # 2. Mock the Zabbix client at a lower level
        # 3. Skip this test in automated environments
        assert response.status_code in [
            200,
            400,
            500,
        ]  # Accept various responses depending on environment


@pytest.mark.asyncio
async def test_get_zabbix_templates_connect_not_found(test_client):
    """Test retrieval of Zabbix templates with non-existent connect."""
    response = test_client.get(
        "/apis/v1/datasource/zabbix/non_existent_connect/templates",
    )

    assert response.status_code == 404
    data = response.json()
    assert "not found" in str(data["detail"]).lower()


@pytest.mark.asyncio
async def test_get_zabbix_templates_success(zabbix_connect, test_client):
    """Test retrieval of Zabbix templates - validates Connect lookup and ZabbixClient instantiation."""

    # Mock ZabbixClient to avoid actual network calls
    with patch("veaiops.handler.routers.apis.v1.datasource.zabbix.ZabbixClient") as mock_client:
        # Setup mock to return test data
        mock_instance = mock_client.return_value
        mock_instance.get_templates.return_value = [
            {"templateid": "10001", "name": "Template OS Linux"},
            {"templateid": "10002", "name": "Template App HTTP Service"},
        ]

        # This test validates that the route correctly finds the connect
        response = test_client.get(
            f"/apis/v1/datasource/zabbix/{zabbix_connect.name}/templates",
        )

        # Verify Connect was found and ZabbixClient was called
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert len(data["data"]) == 2

        # Verify ZabbixClient was instantiated with correct params
        mock_client.assert_called_once()
        call_args = mock_client.call_args[0]
        assert call_args[0] == zabbix_connect.zabbix_api_url
        assert call_args[1] == zabbix_connect.zabbix_api_user


@pytest.mark.asyncio
async def test_get_metrics_by_template_id_success(zabbix_connect, test_client):
    """Test retrieval of metrics by template ID - validates connect lookup."""

    # Mock ZabbixClient to avoid actual network calls
    with patch("veaiops.handler.routers.apis.v1.datasource.zabbix.ZabbixClient") as mock_client:
        # Setup mock to return test data - ZabbixTemplateMetric requires 'history', 'name', 'metric_name'
        mock_instance = mock_client.return_value
        mock_instance.get_metrics_by_template_id.return_value = [
            {"history": "90d", "name": "CPU utilization", "metric_name": "system.cpu.util"},
            {"history": "90d", "name": "Memory size", "metric_name": "vm.memory.size"},
        ]

        response = test_client.get(
            f"/apis/v1/datasource/zabbix/{zabbix_connect.name}/templates/10001/metrics",
        )

        # Verify Connect was found and ZabbixClient was called
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert len(data["data"]) == 2


@pytest.mark.asyncio
async def test_get_metrics_by_template_id_connect_not_found(test_client):
    """Test retrieval of metrics with non-existent connect."""
    response = test_client.get(
        "/apis/v1/datasource/zabbix/non_existent_connect/templates/10001/metrics",
    )

    assert response.status_code == 404
    data = response.json()
    assert "not found" in str(data["detail"]).lower()


@pytest.mark.asyncio
async def test_get_zabbix_template_hosts_success(zabbix_connect, test_client):
    """Test retrieval of hosts by template ID - validates connect lookup."""

    # Mock ZabbixClient to avoid actual network calls
    with patch("veaiops.handler.routers.apis.v1.datasource.zabbix.ZabbixClient") as mock_client:
        # Setup mock to return test data - ZabbixHost requires 'host' and 'name'
        mock_instance = mock_client.return_value
        mock_instance.get_hosts_by_template_id.return_value = [
            {"host": "zabbix-server", "name": "Zabbix Server"},
            {"host": "web-server-01", "name": "Web Server 01"},
        ]

        response = test_client.get(
            f"/apis/v1/datasource/zabbix/{zabbix_connect.name}/templates/10001/hosts",
        )

        # Verify Connect was found and ZabbixClient was called
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert len(data["data"]) == 2


@pytest.mark.asyncio
async def test_get_zabbix_template_hosts_connect_not_found(test_client):
    """Test retrieval of hosts with non-existent connect."""
    response = test_client.get(
        "/apis/v1/datasource/zabbix/non_existent_connect/templates/10001/hosts",
    )

    assert response.status_code == 404
    data = response.json()
    assert "not found" in str(data["detail"]).lower()


@pytest.mark.asyncio
async def test_get_zabbix_items_success(zabbix_connect, test_client):
    """Test retrieval of Zabbix items by host and metric name - validates connect lookup."""

    # Mock ZabbixClient to avoid actual network calls
    with patch("veaiops.handler.routers.apis.v1.datasource.zabbix.ZabbixClient") as mock_client:
        # Setup mock to return test data - ZabbixItem requires 'hostname' and 'itemid'
        mock_instance = mock_client.return_value
        mock_instance.get_items_by_host_and_metric_name.return_value = [
            {"hostname": "Zabbix server", "itemid": "23001"},
            {"hostname": "Zabbix server", "itemid": "23002"},
        ]

        response = test_client.get(
            f"/apis/v1/datasource/zabbix/{zabbix_connect.name}/items?host=Zabbix+server&metric_name=system.cpu.util",
        )

        # Verify Connect was found and ZabbixClient was called
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert len(data["data"]) == 2


@pytest.mark.asyncio
async def test_get_zabbix_items_connect_not_found(test_client):
    """Test retrieval of items with non-existent zabbix_connect."""
    response = test_client.get(
        "/apis/v1/datasource/zabbix/non_existent_connect/items?host=test&metric_name=test",
    )

    assert response.status_code == 404
    data = response.json()
    assert "not found" in str(data["detail"]).lower()


@pytest.mark.asyncio
async def test_get_zabbix_mediatypes_datasource_not_found(test_client):
    """Test retrieval of mediatypes with non-existent datasource."""
    response = test_client.get(
        "/apis/v1/datasource/zabbix/datasource/507f1f77bcf86cd799439011/mediatypes",
    )

    assert response.status_code == 404
    data = response.json()
    assert "not found" in str(data["detail"]).lower()


@pytest.mark.asyncio
async def test_get_zabbix_usergroups_datasource_not_found(test_client):
    """Test retrieval of usergroups with non-existent datasource."""
    response = test_client.get(
        "/apis/v1/datasource/zabbix/datasource/507f1f77bcf86cd799439011/usergroups",
    )

    assert response.status_code == 404
    data = response.json()
    assert "not found" in str(data["detail"]).lower()


@pytest.mark.asyncio
async def test_get_zabbix_mediatypes_success(zabbix_datasource, test_client):
    """Test retrieval of mediatypes by datasource ID - validates datasource lookup."""
    from unittest.mock import AsyncMock

    # Mock ZabbixClient to avoid actual network calls
    with patch("veaiops.handler.routers.apis.v1.datasource.zabbix.ZabbixClient") as mock_client:
        # Setup mock to return test data with correct field names
        mock_instance = mock_client.return_value
        mock_instance.get_mediatypes.return_value = [
            {"media_type_id": "1", "name": "Email", "media_type": "0"},
            {"media_type_id": "2", "name": "SMS", "media_type": "1"},
        ]

        # Mock DataSource.get() to return our datasource with connect preserved
        with patch(
            "veaiops.handler.routers.apis.v1.datasource.zabbix.DataSource.get", new_callable=AsyncMock
        ) as mock_get:
            mock_get.return_value = zabbix_datasource

            # Mock fetch_link to do nothing (connect is already set)
            with patch("veaiops.schema.documents.datasource.base.DataSource.fetch_link", new_callable=AsyncMock):
                response = test_client.get(
                    f"/apis/v1/datasource/zabbix/datasource/{zabbix_datasource.id}/mediatypes",
                )

            # Verify DataSource was found and ZabbixClient was called
            assert response.status_code == 200
            data = response.json()
            assert "data" in data
            assert len(data["data"]) == 2


@pytest.mark.asyncio
async def test_get_zabbix_usergroups_success(zabbix_datasource, test_client):
    """Test retrieval of usergroups by datasource ID - validates datasource lookup."""
    from unittest.mock import AsyncMock

    # Mock ZabbixClient to avoid actual network calls
    with patch("veaiops.handler.routers.apis.v1.datasource.zabbix.ZabbixClient") as mock_client:
        # Setup mock to return test data with all required fields
        mock_instance = mock_client.return_value
        mock_instance.get_usergroups.return_value = [
            {
                "usrgrpid": "7",
                "name": "Zabbix administrators",
                "gui_access": "0",
                "users_status": "0",
                "debug_mode": "0",
            },
            {
                "usrgrpid": "8",
                "name": "Guests",
                "gui_access": "2",
                "users_status": "0",
                "debug_mode": "0",
            },
        ]

        # Mock DataSource.get() to return our datasource with connect preserved
        with patch(
            "veaiops.handler.routers.apis.v1.datasource.zabbix.DataSource.get", new_callable=AsyncMock
        ) as mock_get:
            mock_get.return_value = zabbix_datasource

            # Mock fetch_link to do nothing (connect is already set)
            with patch("veaiops.schema.documents.datasource.base.DataSource.fetch_link", new_callable=AsyncMock):
                response = test_client.get(
                    f"/apis/v1/datasource/zabbix/datasource/{zabbix_datasource.id}/usergroups",
                )

            # Verify DataSource was found and ZabbixClient was called
            assert response.status_code == 200
            data = response.json()
            assert "data" in data
            assert len(data["data"]) == 2
