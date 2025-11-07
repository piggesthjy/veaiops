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
import pytest_asyncio
from beanie import PydanticObjectId

from veaiops.handler.errors import RecordNotFoundError
from veaiops.handler.routers.apis.v1.system_config.bot_attribute import (
    create_bot_attribute,
    delete_bot_attribute,
    delete_bot_attributes,
    get_bot_attribute,
    get_bot_attributes,
    update_bot_attribute,
)
from veaiops.schema.documents import Bot, BotAttribute, User
from veaiops.schema.models.config import BotAttributePayload
from veaiops.schema.types import AttributeKey, ChannelType


@pytest_asyncio.fixture
async def test_bot_attribute(test_user: User, test_bot: Bot):
    """Fixture to create and clean up a test bot attribute."""
    bot_attribute = BotAttribute(
        channel=test_bot.channel,
        bot_id=test_bot.bot_id,
        name=AttributeKey.Customer,
        value="test_customer_001",
        created_user=test_user.username,
        updated_user=test_user.username,
    )
    await bot_attribute.insert()
    yield bot_attribute
    if bot_attribute.id:
        existing = await BotAttribute.get(bot_attribute.id)
        if existing:
            await existing.delete()


@pytest_asyncio.fixture
async def test_bot_attributes(test_user: User, test_bot: Bot):
    """Fixture to create multiple test bot attributes."""
    attributes = [
        BotAttribute(
            channel=test_bot.channel,
            bot_id=test_bot.bot_id,
            name=AttributeKey.Customer,
            value=f"customer_{i:03d}",
            created_user=test_user.username,
            updated_user=test_user.username,
        )
        for i in range(1, 6)
    ]
    await BotAttribute.insert_many(attributes)
    yield attributes
    for attr in attributes:
        if attr.id:
            existing = await BotAttribute.get(attr.id)
            if existing:
                await existing.delete()


@pytest.mark.asyncio
async def test_create_bot_attribute_success(test_user: User, test_bot: Bot):
    """Test successfully creating bot attributes."""
    # Arrange
    payload = BotAttributePayload(
        channel=test_bot.channel,
        bot_id=test_bot.bot_id,
        name=AttributeKey.Customer,
        values=["new_customer_001", "new_customer_002"],
    )

    # Act
    response = await create_bot_attribute(bot_attribute=payload, current_user=test_user)

    # Assert
    assert response.data is not None
    assert len(response.data) == 2
    assert response.data[0].value == "new_customer_001"
    assert response.data[1].value == "new_customer_002"
    assert response.data[0].created_user == test_user.username

    # Cleanup
    for attr in response.data:
        if attr.id:
            existing = await BotAttribute.get(attr.id)
            if existing:
                await existing.delete()


@pytest.mark.asyncio
async def test_create_bot_attribute_with_existing_values(test_user: User, test_bot_attribute: BotAttribute):
    """Test creating bot attributes with some existing values."""
    # Arrange
    payload = BotAttributePayload(
        channel=test_bot_attribute.channel,
        bot_id=test_bot_attribute.bot_id,
        name=test_bot_attribute.name,
        values=[test_bot_attribute.value, "new_customer_003"],
    )

    # Act
    response = await create_bot_attribute(bot_attribute=payload, current_user=test_user)

    # Assert
    assert response.data is not None
    assert len(response.data) == 1
    assert response.data[0].value == "new_customer_003"

    # Cleanup
    if response.data[0].id:
        existing = await BotAttribute.get(response.data[0].id)
        if existing:
            await existing.delete()


@pytest.mark.asyncio
async def test_create_bot_attribute_all_duplicates(test_user: User, test_bot_attribute: BotAttribute):
    """Test creating bot attributes when all values already exist."""
    # Arrange
    payload = BotAttributePayload(
        channel=test_bot_attribute.channel,
        bot_id=test_bot_attribute.bot_id,
        name=test_bot_attribute.name,
        values=[test_bot_attribute.value],
    )

    # Act
    response = await create_bot_attribute(bot_attribute=payload, current_user=test_user)

    # Assert
    assert response.data is not None
    assert len(response.data) == 0


@pytest.mark.asyncio
async def test_create_bot_attribute_bot_not_found(test_user: User):
    """Test creating bot attributes when bot doesn't exist."""
    # Arrange
    payload = BotAttributePayload(
        channel=ChannelType.Lark,
        bot_id="non_existent_bot",
        name=AttributeKey.Customer,
        values=["value1"],
    )

    # Act & Assert
    with pytest.raises(RecordNotFoundError) as exc_info:
        await create_bot_attribute(bot_attribute=payload, current_user=test_user)

    assert "Can not find Bot" in str(exc_info.value)


@pytest.mark.asyncio
async def test_create_bot_attribute_inactive_bot(test_user: User, test_bot: Bot):
    """Test creating bot attributes when bot is inactive."""
    # Arrange
    test_bot.is_active = False
    await test_bot.save()

    payload = BotAttributePayload(
        channel=test_bot.channel,
        bot_id=test_bot.bot_id,
        name=AttributeKey.Customer,
        values=["value1"],
    )

    # Act & Assert
    with pytest.raises(RecordNotFoundError) as exc_info:
        await create_bot_attribute(bot_attribute=payload, current_user=test_user)

    assert "Can not find Bot" in str(exc_info.value)

    # Restore bot state
    test_bot.is_active = True
    await test_bot.save()


@pytest.mark.asyncio
async def test_get_bot_attribute(test_bot_attribute: BotAttribute):
    """Test successfully getting a bot attribute by ID and error handling."""
    # Test success case
    assert test_bot_attribute.id is not None
    response = await get_bot_attribute(bot_attribute_id=test_bot_attribute.id)
    assert response.data is not None
    assert response.data.id == test_bot_attribute.id

    # Test not found case
    fake_id = PydanticObjectId()
    with pytest.raises(RecordNotFoundError) as exc_info:
        await get_bot_attribute(bot_attribute_id=fake_id)
    assert "Bot attribute not found" in str(exc_info.value)


@pytest.mark.asyncio
async def test_get_bot_attributes(test_bot_attributes):
    """Test getting bot attributes with various filters and pagination."""
    # Test without filters
    response = await get_bot_attributes(skip=0, limit=10, names=None, value=None)
    assert response.data is not None
    assert len(response.data) >= 5

    # Test with pagination
    response = await get_bot_attributes(skip=2, limit=2, names=None, value=None)
    assert response.data is not None
    assert len(response.data) == 2

    # Test with name filter
    response = await get_bot_attributes(skip=0, limit=10, names=[AttributeKey.Customer], value=None)
    assert response.data is not None
    for attr in response.data:
        assert attr.name == AttributeKey.Customer

    # Test with value filter
    response = await get_bot_attributes(skip=0, limit=10, names=None, value="customer")
    assert response.data is not None
    for attr in response.data:
        assert "customer" in attr.value.lower()

    # Test with multiple filters
    response = await get_bot_attributes(skip=0, limit=10, names=[AttributeKey.Customer], value="customer")
    assert response.data is not None
    for attr in response.data:
        assert attr.name == AttributeKey.Customer
        assert "customer" in attr.value.lower()


@pytest.mark.asyncio
async def test_update_and_delete_bot_attribute_errors(test_user: User, test_bot_attribute: BotAttribute):
    """Test updating/deleting bot attribute and error handling."""
    # Test update success
    new_value = "updated_customer_001"
    assert test_bot_attribute.id is not None
    response = await update_bot_attribute(
        bot_attribute_id=test_bot_attribute.id,
        value=new_value,
        current_user=test_user,
    )
    assert response.data is not None
    assert response.data.value == new_value

    # Test update not found
    fake_id = PydanticObjectId()
    with pytest.raises(RecordNotFoundError) as exc_info:
        await update_bot_attribute(bot_attribute_id=fake_id, value="new_value", current_user=test_user)
    assert "Bot attribute not found or deleted" in str(exc_info.value)


@pytest.mark.asyncio
async def test_delete_bot_attribute(test_user: User, test_bot: Bot):
    """Test deleting bot attribute and error handling."""
    # Create a temporary attribute
    temp_attr = BotAttribute(
        channel=test_bot.channel,
        bot_id=test_bot.bot_id,
        name=AttributeKey.Customer,
        value="temp_customer",
        created_user=test_user.username,
        updated_user=test_user.username,
    )
    await temp_attr.insert()

    # Test delete success
    assert temp_attr.id is not None
    response = await delete_bot_attribute(bot_attribute_id=temp_attr.id)
    assert response.message == "BotAttribute deleted successfully"

    # Verify deletion
    deleted = await BotAttribute.get(temp_attr.id)
    assert deleted is None

    # Test delete not found
    fake_id = PydanticObjectId()
    with pytest.raises(RecordNotFoundError) as exc_info:
        await delete_bot_attribute(bot_attribute_id=fake_id)
    assert "Bot attribute not found or deleted" in str(exc_info.value)


@pytest.mark.asyncio
async def test_delete_bot_attributes_by_names(test_user: User, test_bot: Bot):
    """Test deleting multiple bot attributes by names and error cases."""
    # Create temporary attributes
    attributes = [
        BotAttribute(
            channel=test_bot.channel,
            bot_id=test_bot.bot_id,
            name=AttributeKey.Customer,
            value=f"batch_customer_{i}",
            created_user=test_user.username,
            updated_user=test_user.username,
        )
        for i in range(1, 4)
    ]
    await BotAttribute.insert_many(attributes)

    # Test delete by names success
    response = await delete_bot_attributes(
        channel=test_bot.channel,
        bot_id=test_bot.bot_id,
        names=[AttributeKey.Customer],
    )
    assert response.message == "BotAttributes deleted successfully"

    # Verify deletion
    remaining = await BotAttribute.find(
        {"channel": test_bot.channel, "bot_id": test_bot.bot_id, "name": AttributeKey.Customer}
    ).to_list()
    assert len(remaining) == 0

    # Test delete with empty names - should raise error
    with pytest.raises(RecordNotFoundError) as exc_info:
        await delete_bot_attributes(channel=test_bot.channel, bot_id=test_bot.bot_id, names=[])
    assert "Bot attribute not found" in str(exc_info.value)

    # Test delete with no match - should succeed (idempotent)
    response = await delete_bot_attributes(
        channel=test_bot.channel,
        bot_id="non_existent_bot",
        names=[AttributeKey.Customer],
    )
    assert response.message == "BotAttributes deleted successfully"
