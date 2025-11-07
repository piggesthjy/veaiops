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

import pytest

from veaiops.handler.services.datasource.connect import (
    create_connect,
    delete_connect,
    get_all_connects,
    get_connect_by_id,
    update_connect,
)
from veaiops.schema.types import DataSourceType


@pytest.mark.asyncio
async def test_create_connect_volcengine():
    """Test creating a Volcengine datasource connection."""
    # Act
    connect = await create_connect(
        name="Volcengine Test",
        datasource_type=DataSourceType.Volcengine,
        credentials={
            "volcengine_access_key_id": "test_key",
            "volcengine_access_key_secret": "test_secret",
        },
        created_user="test_user",
    )

    # Assert
    assert connect is not None
    assert connect.name == "Volcengine Test"
    assert connect.type == DataSourceType.Volcengine
    assert connect.volcengine_access_key_id == "test_key"
    assert connect.created_user == "test_user"
    assert connect.updated_user == "test_user"

    # Cleanup
    await connect.delete()


@pytest.mark.asyncio
async def test_create_connect_zabbix():
    """Test creating a Zabbix datasource connection."""
    # Act
    connect = await create_connect(
        name="Zabbix Test",
        datasource_type=DataSourceType.Zabbix,
        credentials={
            "zabbix_api_url": "http://zabbix.example.com",
            "zabbix_api_user": "admin",
            "zabbix_api_password": "password123",
        },
        created_user="admin_user",
    )

    # Assert
    assert connect is not None
    assert connect.name == "Zabbix Test"
    assert connect.type == DataSourceType.Zabbix
    assert connect.zabbix_api_url == "http://zabbix.example.com"
    assert connect.zabbix_api_user == "admin"

    # Cleanup
    await connect.delete()


@pytest.mark.asyncio
async def test_create_connect_aliyun():
    """Test creating an Aliyun datasource connection."""
    # Act
    connect = await create_connect(
        name="Aliyun Test",
        datasource_type=DataSourceType.Aliyun,
        credentials={
            "aliyun_access_key_id": "aliyun_key",
            "aliyun_access_key_secret": "aliyun_secret",
        },
        created_user="aliyun_user",
    )

    # Assert
    assert connect is not None
    assert connect.name == "Aliyun Test"
    assert connect.type == DataSourceType.Aliyun
    assert connect.aliyun_access_key_id == "aliyun_key"

    # Cleanup
    await connect.delete()


@pytest.mark.asyncio
async def test_create_connect_missing_volcengine_credentials():
    """Test creating connection with missing Volcengine credentials."""
    # Act & Assert
    with pytest.raises(ValueError, match="Missing required Volcengine credentials"):
        await create_connect(
            name="Volcengine Missing Creds",
            datasource_type=DataSourceType.Volcengine,
            credentials={
                "volcengine_access_key_id": "test_key",
                # Missing secret
            },
            created_user="test_user",
        )


@pytest.mark.asyncio
async def test_create_connect_missing_zabbix_credentials():
    """Test creating connection with missing Zabbix credentials."""
    # Act & Assert
    with pytest.raises(ValueError, match="Missing required Zabbix credentials"):
        await create_connect(
            name="Zabbix Missing Creds",
            datasource_type=DataSourceType.Zabbix,
            credentials={
                "zabbix_api_url": "http://zabbix.example.com",
                # Missing user and password
            },
            created_user="test_user",
        )


@pytest.mark.asyncio
async def test_create_connect_missing_aliyun_credentials():
    """Test creating connection with missing Aliyun credentials."""
    # Act & Assert
    with pytest.raises(ValueError, match="Missing required Aliyun credentials"):
        await create_connect(
            name="Aliyun Missing Creds",
            datasource_type=DataSourceType.Aliyun,
            credentials={
                "aliyun_access_key_id": "aliyun_key",
                # Missing secret
            },
            created_user="test_user",
        )


@pytest.mark.asyncio
async def test_create_connect_filters_none_values():
    """Test that create_connect filters out None values from credentials."""
    # Act
    connect = await create_connect(
        name="Filter None Test",
        datasource_type=DataSourceType.Aliyun,
        credentials={
            "aliyun_access_key_id": "key",
            "aliyun_access_key_secret": "secret",
            "zabbix_api_url": None,  # Should be filtered
            "volcengine_access_key_id": None,  # Should be filtered
        },
        created_user="test_user",
    )

    # Assert
    assert connect is not None
    assert connect.type == DataSourceType.Aliyun

    # Cleanup
    await connect.delete()


@pytest.mark.asyncio
async def test_update_connect_is_active():
    """Test updating a connection's is_active status."""
    # Arrange
    connect = await create_connect(
        name="Original Name",
        datasource_type=DataSourceType.Aliyun,
        credentials={
            "aliyun_access_key_id": "key",
            "aliyun_access_key_secret": "secret",
        },
        created_user="user1",
    )
    assert connect.is_active is True
    connect_id = str(connect.id)

    # Act
    updated = await update_connect(
        connect_id,
        {"is_active": False},
        "user2",
    )

    # Assert
    assert updated.is_active is False
    assert updated.updated_user == "user2"

    # Cleanup
    await updated.delete()


@pytest.mark.asyncio
async def test_update_connect_zabbix_password():
    """Test updating a Zabbix connection password."""
    # Arrange
    connect = await create_connect(
        name="Zabbix Update Test",
        datasource_type=DataSourceType.Zabbix,
        credentials={
            "zabbix_api_url": "http://zabbix.example.com",
            "zabbix_api_user": "admin",
            "zabbix_api_password": "old_password",
        },
        created_user="user1",
    )
    connect_id = str(connect.id)

    # Act
    updated = await update_connect(
        connect_id,
        {"zabbix_api_password": "new_password"},
        "user2",
    )

    # Assert
    assert updated.updated_user == "user2"

    # Cleanup
    await updated.delete()


@pytest.mark.asyncio
async def test_update_connect_aliyun_credentials():
    """Test updating Aliyun credentials."""
    # Arrange
    connect = await create_connect(
        name="Aliyun Update Test",
        datasource_type=DataSourceType.Aliyun,
        credentials={
            "aliyun_access_key_id": "old_key",
            "aliyun_access_key_secret": "old_secret",
        },
        created_user="user1",
    )
    connect_id = str(connect.id)

    # Act
    updated = await update_connect(
        connect_id,
        {
            "aliyun_access_key_id": "new_key",
            "aliyun_access_key_secret": "new_secret",
        },
        "user2",
    )

    # Assert
    assert updated.aliyun_access_key_id == "new_key"
    assert updated.updated_user == "user2"

    # Cleanup
    await updated.delete()


@pytest.mark.asyncio
async def test_update_connect_not_found():
    """Test updating a non-existent connection."""
    from beanie import PydanticObjectId

    # Act & Assert
    with pytest.raises(ValueError, match="not found"):
        await update_connect(
            str(PydanticObjectId()),
            {"is_active": False},
            "user",
        )


@pytest.mark.asyncio
async def test_get_connect_by_id():
    """Test getting a connection by ID."""
    # Arrange
    connect = await create_connect(
        name="Get By ID Test",
        datasource_type=DataSourceType.Aliyun,
        credentials={
            "aliyun_access_key_id": "key",
            "aliyun_access_key_secret": "secret",
        },
        created_user="user",
    )
    connect_id = connect.id

    # Act
    retrieved = await get_connect_by_id(str(connect_id))

    # Assert
    assert retrieved is not None
    assert retrieved.id == connect_id
    assert retrieved.name == "Get By ID Test"

    # Cleanup
    await connect.delete()


@pytest.mark.asyncio
async def test_get_connect_by_id_not_found():
    """Test getting a non-existent connection by ID."""
    from beanie import PydanticObjectId

    # Act
    result = await get_connect_by_id(str(PydanticObjectId()))

    # Assert
    assert result is None


@pytest.mark.asyncio
async def test_get_all_connects_no_filter():
    """Test getting all connections without filters."""
    # Arrange - create two test connections
    connect1 = await create_connect(
        name="Connect 1",
        datasource_type=DataSourceType.Aliyun,
        credentials={
            "aliyun_access_key_id": "key1",
            "aliyun_access_key_secret": "secret1",
        },
        created_user="user",
    )
    connect2 = await create_connect(
        name="Connect 2",
        datasource_type=DataSourceType.Zabbix,
        credentials={
            "zabbix_api_url": "http://zabbix.example.com",
            "zabbix_api_user": "admin",
            "zabbix_api_password": "password",
        },
        created_user="user",
    )

    # Act
    connects, total = await get_all_connects(skip=0, limit=100)

    # Assert
    assert total >= 2
    assert len(connects) >= 2

    # Cleanup
    await connect1.delete()
    await connect2.delete()


@pytest.mark.asyncio
async def test_get_all_connects_with_name_filter():
    """Test getting connections with name filter."""
    # Arrange
    connect = await create_connect(
        name="Unique Name Filter Test",
        datasource_type=DataSourceType.Aliyun,
        credentials={
            "aliyun_access_key_id": "key",
            "aliyun_access_key_secret": "secret",
        },
        created_user="user",
    )

    # Act
    connects, total = await get_all_connects(skip=0, limit=100, name="Unique Name")

    # Assert
    assert total >= 1
    found = any(c.id == connect.id for c in connects)
    assert found

    # Cleanup
    await connect.delete()


@pytest.mark.asyncio
async def test_get_all_connects_with_type_filter():
    """Test getting connections with datasource type filter."""
    # Arrange
    connect = await create_connect(
        name="Type Filter Test",
        datasource_type=DataSourceType.Volcengine,
        credentials={
            "volcengine_access_key_id": "key",
            "volcengine_access_key_secret": "secret",
        },
        created_user="user",
    )

    # Act
    connects, total = await get_all_connects(skip=0, limit=100, datasource_type=DataSourceType.Volcengine)

    # Assert
    assert total >= 1
    found = any(c.id == connect.id for c in connects)
    assert found

    # Cleanup
    await connect.delete()


@pytest.mark.asyncio
async def test_get_all_connects_pagination():
    """Test pagination of connections list."""
    # Arrange
    connects_created = []
    for i in range(5):
        connect = await create_connect(
            name=f"Pagination Test {i}",
            datasource_type=DataSourceType.Aliyun,
            credentials={
                "aliyun_access_key_id": f"key{i}",
                "aliyun_access_key_secret": f"secret{i}",
            },
            created_user="user",
        )
        connects_created.append(connect)

    # Act
    page1, total1 = await get_all_connects(skip=0, limit=2)
    page2, total2 = await get_all_connects(skip=2, limit=2)

    # Assert
    assert len(page1) <= 2
    assert len(page2) <= 2
    assert total1 == total2

    # Cleanup
    for connect in connects_created:
        await connect.delete()


@pytest.mark.asyncio
async def test_get_all_connects_empty_result():
    """Test getting connections with filter that matches nothing."""
    # Act
    connects, total = await get_all_connects(name="NonexistentFilterXYZ123", skip=0, limit=100)

    # Assert
    assert len(connects) == 0
    assert total == 0


@pytest.mark.asyncio
async def test_delete_connect_not_found():
    """Test deleting a non-existent connection."""
    from beanie import PydanticObjectId

    # Act & Assert
    with pytest.raises(ValueError, match="not found"):
        await delete_connect(str(PydanticObjectId()))


@pytest.mark.asyncio
async def test_create_connect_with_empty_credentials():
    """Test creating connection with incomplete credentials dict."""
    # Act & Assert
    with pytest.raises(ValueError, match="Missing required"):
        await create_connect(
            name="Empty Credentials",
            datasource_type=DataSourceType.Aliyun,
            credentials={},
            created_user="user",
        )


@pytest.mark.asyncio
async def test_update_connect_volcengine_secret():
    """Test updating Volcengine connection credentials."""
    # Arrange
    connect = await create_connect(
        name="Volcengine Update Test",
        datasource_type=DataSourceType.Volcengine,
        credentials={
            "volcengine_access_key_id": "old_id",
            "volcengine_access_key_secret": "old_secret",
        },
        created_user="user1",
    )
    connect_id = str(connect.id)

    # Act
    updated = await update_connect(
        connect_id,
        {"volcengine_access_key_secret": "new_secret"},
        "user2",
    )

    # Assert
    assert updated.updated_user == "user2"
    assert updated.volcengine_access_key_id == "old_id"

    # Cleanup
    await updated.delete()


@pytest.mark.asyncio
async def test_get_all_connects_name_case_insensitive():
    """Test that name filter is case-insensitive."""
    # Arrange
    connect = await create_connect(
        name="CaseSensitive Test",
        datasource_type=DataSourceType.Aliyun,
        credentials={
            "aliyun_access_key_id": "key",
            "aliyun_access_key_secret": "secret",
        },
        created_user="user",
    )

    # Act - search with lowercase
    connects, total = await get_all_connects(skip=0, limit=100, name="casesensitive")

    # Assert
    assert total >= 1
    found = any(c.id == connect.id for c in connects)
    assert found

    # Cleanup
    await connect.delete()
