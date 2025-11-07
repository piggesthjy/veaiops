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

from veaiops.handler.errors import RecordNotFoundError
from veaiops.handler.services.config import delete, toggle_active
from veaiops.schema.documents import Connect, InformStrategy, User


@pytest.mark.asyncio
async def test_toggle_active_success(test_user):
    """Test successful toggle of active status."""
    # Arrange
    assert test_user.is_active is True
    uid = test_user.id

    # Act
    response = await toggle_active(User, uid, False)

    # Assert
    assert "successfully" in response.message
    updated_user = await User.get(uid)
    assert updated_user.is_active is False


@pytest.mark.asyncio
async def test_toggle_active_enable(test_user):
    """Test enabling an inactive user."""
    # Arrange
    test_user.is_active = False
    await test_user.save()
    uid = test_user.id

    # Act
    response = await toggle_active(User, uid, True)

    # Assert
    assert "successfully" in response.message
    updated_user = await User.get(uid)
    assert updated_user.is_active is True


@pytest.mark.asyncio
async def test_toggle_active_not_found():
    """Test toggle_active with non-existent record."""
    # Arrange
    from beanie import PydanticObjectId

    fake_uid = PydanticObjectId()

    # Act & Assert
    with pytest.raises(RecordNotFoundError) as exc_info:
        await toggle_active(User, fake_uid, False)

    assert "not found" in str(exc_info.value.detail)


@pytest.mark.asyncio
async def test_toggle_active_updates_timestamp(test_user):
    """Test that toggle_active updates the updated_at timestamp."""
    # Arrange
    uid = test_user.id

    # Act
    await toggle_active(User, uid, False)

    # Assert
    updated_user = await User.get(uid)
    # The updated_at timestamp should be set by toggle_active
    assert updated_user.updated_at is not None
    assert updated_user.is_active is False


@pytest.mark.asyncio
async def test_delete_success(test_user):
    """Test successful deletion of a record."""
    # Arrange
    uid = test_user.id

    # Act
    response = await delete(User, uid)

    # Assert
    assert "deleted successfully" in response.message
    deleted_user = await User.get(uid)
    assert deleted_user is None


@pytest.mark.asyncio
async def test_delete_not_found():
    """Test delete with non-existent record."""
    # Arrange
    from beanie import PydanticObjectId

    fake_uid = PydanticObjectId()

    # Act & Assert
    with pytest.raises(RecordNotFoundError) as exc_info:
        await delete(User, fake_uid)

    assert "not found" in str(exc_info.value.detail)


@pytest.mark.asyncio
async def test_delete_with_connect(test_connect):
    """Test deletion with Connect document."""
    # Arrange
    uid = test_connect.id

    # Act
    response = await delete(Connect, uid)

    # Assert
    assert "deleted successfully" in response.message
    deleted_connect = await Connect.get(uid)
    assert deleted_connect is None


@pytest.mark.asyncio
async def test_toggle_active_with_inform_strategy(test_inform_strategy):
    """Test toggle_active with InformStrategy document."""
    # Arrange
    uid = test_inform_strategy.id
    assert test_inform_strategy.is_active is True

    # Act
    response = await toggle_active(InformStrategy, uid, False)

    # Assert
    assert "successfully" in response.message
    updated_strategy = await InformStrategy.get(uid)
    assert updated_strategy.is_active is False


@pytest.mark.asyncio
async def test_toggle_active_idempotent(test_user):
    """Test that toggling to the same state is idempotent."""
    # Arrange
    uid = test_user.id
    assert test_user.is_active is True

    # Act - toggle to True (already True)
    response = await toggle_active(User, uid, True)

    # Assert
    assert "successfully" in response.message
    updated_user = await User.get(uid)
    assert updated_user.is_active is True
