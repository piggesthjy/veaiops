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

# Service functions for AlarmSyncRecord
from datetime import datetime, timezone
from typing import List, Optional
from urllib.parse import urljoin

from beanie import PydanticObjectId

from veaiops.handler.errors import RecordNotFoundError
from veaiops.metrics.datasource_factory import DataSourceFactory
from veaiops.schema.documents import DataSource, IntelligentThresholdTask, IntelligentThresholdTaskVersion
from veaiops.schema.documents.intelligent_threshold.alarm_sync_record import AlarmSyncRecord, RuleOperations
from veaiops.schema.models.base import TimeRange
from veaiops.schema.models.intelligent_threshold.alarm import SyncAlarmRulesPayload, SyncAlarmRulesResponse
from veaiops.schema.types import AlarmSyncRecordStatus, DataSourceType
from veaiops.settings import WebhookSettings, get_settings


async def list_alarm_sync_records(
    task_id: Optional[PydanticObjectId] = None,
    task_version_id: Optional[PydanticObjectId] = None,
    status: Optional[AlarmSyncRecordStatus] = None,
    created_at_range: Optional[TimeRange] = None,
    skip: int = 0,
    limit: int = 100,
) -> tuple[List[AlarmSyncRecord], int]:
    """List and filter alarm sync records with pagination."""
    query_conditions = {}
    if task_id:
        query_conditions["task_id"] = task_id
    if task_version_id:
        query_conditions["task_version_id"] = task_version_id
    if status:
        query_conditions["status"] = status
    if created_at_range:
        start = datetime.fromtimestamp(created_at_range.start_time, tz=timezone.utc)
        end = datetime.fromtimestamp(created_at_range.end_time, tz=timezone.utc)
        query_conditions["created_at"] = {"$gte": start, "$lte": end}

    query = AlarmSyncRecord.find(query_conditions).sort(-AlarmSyncRecord.created_at)
    total_count = await query.count()
    records = await query.skip(skip).limit(limit).to_list()

    return records, total_count


async def sync_alarm_rules_service(sync_config: SyncAlarmRulesPayload) -> SyncAlarmRulesResponse:
    """Synchronize alarm rules based on the result of an intelligent threshold task version."""
    # Create a record to track the sync operation

    alarm_sync_record = AlarmSyncRecord(
        task_id=sync_config.task_id,
        task_version_id=sync_config.task_version_id,
        contact_group_ids=sync_config.contact_group_ids,
        alert_methods=sync_config.alert_methods,
        alarm_level=sync_config.alarm_level,
        total=0,
        created=0,
        updated=0,
        deleted=0,
        failed=0,
    )
    await alarm_sync_record.insert()

    try:
        # Get the task from database using task_id
        task = await IntelligentThresholdTask.get(sync_config.task_id)
        if not task:
            raise RecordNotFoundError(message=f"IntelligentThresholdTask with ID {sync_config.task_id} not found")

        # Get the task version from database using both task_id and task_version_id
        task_version = await IntelligentThresholdTaskVersion.get(sync_config.task_version_id)
        if not task_version:
            raise RecordNotFoundError(
                message=(
                    f"IntelligentThresholdTaskVersion with ID {sync_config.task_version_id} "
                    f"and task_id {sync_config.task_id} not found"
                )
            )

        # Get associated datasource meta
        datasource_meta = await DataSource.find_one({"_id": task.datasource_id, "is_active": True})
        if not datasource_meta:
            raise RecordNotFoundError(message="Associated datasource metadata not found")

        await datasource_meta.fetch_link(DataSource.connect)

        # Initialize alarm rule manager and sync rules
        datasource = DataSourceFactory.create_datasource(datasource_meta)

        # Determine webhook URL
        webhook_url: Optional[str] = sync_config.webhook
        if not webhook_url:
            base_path = "/apis/v1/manager/event-center/event/intelligent_threshold/"
            path_map = {
                DataSourceType.Volcengine: "volcengine/",
                DataSourceType.Zabbix: "zabbix/",
                DataSourceType.Aliyun: "aliyun/form/",
            }
            base_url = get_settings(WebhookSettings).event_center_external_url.rstrip("/") + "/"
            try:
                suffix = path_map[datasource_meta.type]
            except KeyError:
                raise ValueError(f"Unsupported datasource type: {datasource_meta.type}")
            webhook_url = urljoin(base_url, base_path + suffix)

        sync_results = await datasource.sync_rules_for_intelligent_threshold_task(
            task=task,
            task_version=task_version,
            contact_group_ids=sync_config.contact_group_ids,
            alert_methods=sync_config.alert_methods,
            alarm_level=sync_config.alarm_level,
            webhook=webhook_url,
        )

        # Update the alarm sync record with results
        alarm_sync_record.total = sync_results.get("total", 0)
        alarm_sync_record.created = sync_results.get("created", 0)
        alarm_sync_record.updated = sync_results.get("updated", 0)
        alarm_sync_record.deleted = sync_results.get("deleted", 0)
        alarm_sync_record.failed = sync_results.get("failed", 0)
        alarm_sync_record.rule_operations = sync_results.get("rule_operations", RuleOperations())
        alarm_sync_record.status = AlarmSyncRecordStatus.SUCCESS
        await alarm_sync_record.save()

        return SyncAlarmRulesResponse(
            total=sync_results.get("total", 0),
            created=sync_results.get("created", 0),
            updated=sync_results.get("updated", 0),
            deleted=sync_results.get("deleted", 0),
            failed=sync_results.get("failed", 0),
            rule_operations=sync_results.get("rule_operations", RuleOperations()),
        )

    except Exception as e:
        # Update the alarm sync record with error information
        alarm_sync_record.status = AlarmSyncRecordStatus.FAILED
        alarm_sync_record.error_message = str(e)
        await alarm_sync_record.save()

        # Re-raise the exception to be handled by the caller
        raise


async def get_alarm_sync_records_by_task_id(task_id: PydanticObjectId) -> List[AlarmSyncRecord]:
    """Get all alarm sync records for a specific task ID."""
    return await AlarmSyncRecord.find(AlarmSyncRecord.task_id == task_id).sort(-AlarmSyncRecord.created_at).to_list()


async def get_alarm_sync_records_by_task_version_id(task_version_id: PydanticObjectId) -> List[AlarmSyncRecord]:
    """Get all alarm sync records for a specific task version ID."""
    return (
        await AlarmSyncRecord.find(AlarmSyncRecord.task_version_id == task_version_id)
        .sort(-AlarmSyncRecord.created_at)
        .to_list()
    )


async def get_recent_alarm_sync_records(limit: int = 100) -> List[AlarmSyncRecord]:
    """Get recent alarm sync records, sorted by creation time."""
    return await AlarmSyncRecord.find().sort(-AlarmSyncRecord.created_at).limit(limit).to_list()


async def get_alarm_sync_records_by_status(status: AlarmSyncRecordStatus) -> List[AlarmSyncRecord]:
    """Get alarm sync records by status."""
    return await AlarmSyncRecord.find(AlarmSyncRecord.status == status).sort(-AlarmSyncRecord.created_at).to_list()


async def cleanup_old_alarm_sync_records(days_to_keep: int = 30) -> int:
    """Clean up old alarm sync records older than specified days.

    Args:
        days_to_keep: Number of days to keep records. Records older than this will be deleted.

    Returns:
        int: Number of records deleted.
    """
    from datetime import datetime, timedelta, timezone

    # Calculate the cutoff date
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=days_to_keep)

    # Delete old records
    result = await AlarmSyncRecord.find(AlarmSyncRecord.created_at < cutoff_date).delete()

    return result.deleted_count
