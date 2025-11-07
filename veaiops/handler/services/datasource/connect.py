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

from typing import Any, Dict, Optional

from veaiops.handler.errors import BadRequestError
from veaiops.schema.documents import Connect
from veaiops.schema.documents.datasource.base import DataSource
from veaiops.schema.types import DataSourceType
from veaiops.utils.crypto import EncryptedSecretStr


async def create_connect(
    name: str, datasource_type: DataSourceType, credentials: Dict[str, Any], created_user: str
) -> Connect:
    """Create a new Connect object with the provided credentials.

    Args:
        name (str): The name of the connection
        datasource_type (DataSourceType): The type of data source
        credentials (Dict[str, Any]): The credentials for the connection
        created_user (str): The user who created the connection

    Returns:
        Connect: The created Connect object

    Raises:
        ValueError: If credentials are invalid for the specified type
    """
    # Filter out None values from credentials
    filtered_credentials = {k: v for k, v in credentials.items() if v is not None}

    # Validate credentials based on type
    if datasource_type == DataSourceType.Volcengine:
        required_keys = {"volcengine_access_key_id", "volcengine_access_key_secret"}
        if not required_keys.issubset(filtered_credentials.keys()):
            missing = required_keys - filtered_credentials.keys()
            raise ValueError(f"Missing required Volcengine credentials: {missing}")
        # Create EncryptedSecretStr object directly
        filtered_credentials["volcengine_access_key_secret"] = EncryptedSecretStr(
            credentials["volcengine_access_key_secret"]
        )
    elif datasource_type == DataSourceType.Zabbix:
        required_keys = {"zabbix_api_url", "zabbix_api_user", "zabbix_api_password"}
        if not required_keys.issubset(filtered_credentials.keys()):
            missing = required_keys - filtered_credentials.keys()
            raise ValueError(f"Missing required Zabbix credentials: {missing}")
        # Create EncryptedSecretStr object directly
        filtered_credentials["zabbix_api_password"] = EncryptedSecretStr(credentials["zabbix_api_password"])
    elif datasource_type == DataSourceType.Aliyun:
        required_keys = {"aliyun_access_key_id", "aliyun_access_key_secret"}
        if not required_keys.issubset(filtered_credentials.keys()):
            missing = required_keys - filtered_credentials.keys()
            raise ValueError(f"Missing required Aliyun credentials: {missing}")
        filtered_credentials["aliyun_access_key_secret"] = EncryptedSecretStr(credentials["aliyun_access_key_secret"])

    # Add user information
    filtered_credentials["created_user"] = created_user
    filtered_credentials["updated_user"] = created_user

    # Create Connect object based on type and credentials
    connect = Connect(name=name, type=datasource_type, **filtered_credentials)

    # Save the connect object
    await connect.insert()

    return connect


async def update_connect(connect_id: str, update_data: Dict[str, Any], updated_user: str) -> Connect:
    """Update an existing Connect object.

    Args:
        connect_id (str): The ID of the Connect to update
        update_data (Dict[str, Any]): The data to update
        updated_user (str): The user who updated the connection

    Returns:
        Connect: The updated Connect object
    """
    # Find the connect by ID
    connect = await Connect.get(connect_id)

    if not connect:
        raise ValueError(f"Connect with ID {connect_id} not found")

    # Validate and filter update fields
    validated_data = Connect.validate_update_fields(update_data)

    # Update the connect object
    for key, value in validated_data.items():
        # Handle password encryption for Zabbix
        if key == "zabbix_api_password" and isinstance(value, str):
            value = EncryptedSecretStr(value)
        if key == "aliyun_access_key_secret" and isinstance(value, str):
            value = EncryptedSecretStr(value)
        if key == "volcengine_access_key_secret" and isinstance(value, str):
            value = EncryptedSecretStr(value)

        setattr(connect, key, value)

    # Update user information if provided
    connect.updated_user = updated_user

    # Save the updated connect
    await connect.save()

    return connect


async def get_connect_by_id(connect_id: str) -> Connect:
    """Get a Connect object by ID.

    Args:
        connect_id (str): The ID of the Connect to retrieve

    Returns:
        Connect: The Connect object
    """
    connect = await Connect.get(connect_id)
    return connect


async def get_all_connects(
    skip: int = 0,
    limit: int = 100,
    name: Optional[str] = None,
    datasource_type: Optional[DataSourceType] = None,
) -> tuple[list[Connect], int]:
    """Get all Connect objects with optional pagination and name filtering.

    Args:
        skip (int): Number of connects to skip
        limit (int): Maximum number of connects to return
        name (str): Optional name filter for fuzzy matching
        datasource_type (DataSourceType): Optional type filter

    Returns:
        tuple[list[Connect], int]: List of Connect objects and total count
    """
    # Build query based on provided parameters
    query = Connect.find({})
    if name:
        query = query.find({"name": {"$regex": name, "$options": "i"}})
    if datasource_type:
        query = query.find({"type": datasource_type})

    # Calculate total count
    total = await query.count()

    # Apply skip and limit
    connects = await query.skip(skip).limit(limit).to_list()

    return connects, total


async def delete_connect(connect_id: str) -> bool:
    """Delete a Connect object by ID.

    Args:
        connect_id (str): The ID of the Connect to delete

    Returns:
        bool: True if deletion was successful
    """
    connect = await Connect.get(connect_id)

    if not connect:
        raise ValueError(f"Connect with ID {connect_id} not found")

    # Check if any DataSource is using this connect
    datasource = await DataSource.find_all(fetch_links=True).to_list()
    for ds in datasource:
        if ds.connect.name == connect.name:
            raise BadRequestError(message=f"Cannot delete connect {connect.name} as it is being used by {ds.name}")

    await connect.delete()
    return True
