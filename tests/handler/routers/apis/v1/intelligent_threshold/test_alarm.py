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

"""Tests for intelligent threshold alarm router."""

import pytest

from veaiops.schema.documents import AlarmSyncRecord
from veaiops.schema.types import AlarmSyncRecordStatus, EventLevel


def test_list_alarm_sync_records_basic(test_client, test_task, test_task_version, test_alarm_sync_record):
    """Test listing alarm sync records."""
    # Act
    response = test_client.get(
        f"/apis/v1/intelligent-threshold/alarm/sync-records/"
        f"?task_id={test_task.id}&task_version_id={test_task_version.id}&skip=0&limit=100"
    )

    # Assert
    assert response.status_code == 200
    response_data = response.json()
    assert response_data["message"] == "Successfully retrieved alarm sync records"
    assert response_data["total"] >= 1
    assert len(response_data["data"]) >= 1


def test_list_alarm_sync_records_with_status_filter(test_client, test_task, test_task_version, test_alarm_sync_record):
    """Test listing alarm sync records with status filter."""
    # Act
    response = test_client.get(
        f"/apis/v1/intelligent-threshold/alarm/sync-records/"
        f"?task_id={test_task.id}&task_version_id={test_task_version.id}"
        f"&status={AlarmSyncRecordStatus.SUCCESS.value}&skip=0&limit=100"
    )

    # Assert
    assert response.status_code == 200
    response_data = response.json()
    assert response_data["total"] >= 1
    assert all(record["status"] == AlarmSyncRecordStatus.SUCCESS.value for record in response_data["data"])


@pytest.mark.asyncio
async def test_list_alarm_sync_records_pagination(test_client, test_task, test_task_version):
    """Test pagination of alarm sync records."""
    # Create multiple records
    for i in range(3):
        await AlarmSyncRecord(
            task_id=test_task.id,
            task_version_id=test_task_version.id,
            status=AlarmSyncRecordStatus.SUCCESS,
            contact_group_ids=[f"group_{i}"],
            webhook="http://test.com/webhook",
            alert_methods=["email"],
            alarm_level=EventLevel.P2,
            total=i,
            created=i,
            updated=0,
            deleted=0,
            failed=0,
        ).insert()

    # Act
    response = test_client.get(
        f"/apis/v1/intelligent-threshold/alarm/sync-records/"
        f"?task_id={test_task.id}&task_version_id={test_task_version.id}&skip=0&limit=2"
    )

    # Assert
    assert response.status_code == 200
    response_data = response.json()
    assert len(response_data["data"]) == 2
    assert response_data["total"] >= 3

    # Cleanup
    await AlarmSyncRecord.find({"task_id": test_task.id, "task_version_id": test_task_version.id}).delete()


@pytest.mark.asyncio
async def test_sync_alarm_rules_datasource_not_found(test_client, test_task, test_task_version):
    """Test syncing alarm rules when datasource is not found."""
    # Arrange - Deactivate the datasource
    test_task.datasource_id = None
    await test_task.save()

    payload = {
        "task_id": str(test_task.id),
        "task_version_id": str(test_task_version.id),
        "contact_group_ids": ["test_group"],
        "alert_methods": ["email"],
        "alarm_level": EventLevel.P2.value,
    }

    # Act
    response = test_client.post("/apis/v1/intelligent-threshold/alarm/sync", json=payload)

    # Assert - This should fail because datasource is None
    assert response.status_code in [404, 500]  # Could be 404 or 500 depending on error handling

    # Cleanup
    await AlarmSyncRecord.find({"task_id": test_task.id}).delete()
