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


from datetime import datetime, timezone
from typing import List, Optional

from beanie import PydanticObjectId
from fastapi import APIRouter, Query

from veaiops.handler.errors import BadRequestError
from veaiops.handler.services.intelligent_threshold.alarm import (
    list_alarm_sync_records as list_alarm_sync_records_service,
    sync_alarm_rules_service,
)
from veaiops.schema.documents.intelligent_threshold.alarm_sync_record import AlarmSyncRecord
from veaiops.schema.models.base import APIResponse, PaginatedAPIResponse, TimeRange
from veaiops.schema.models.intelligent_threshold.alarm import SyncAlarmRulesPayload, SyncAlarmRulesResponse
from veaiops.schema.types import AlarmSyncRecordStatus

alarm_router = APIRouter(prefix="/alarm", tags=["IntelligentThresholdAlarm"])


@alarm_router.get("/sync-records/", response_model=PaginatedAPIResponse[List[AlarmSyncRecord]])
async def list_alarm_sync_records(
    task_id: PydanticObjectId = Query(..., description="Filter by task ID"),
    task_version_id: PydanticObjectId = Query(..., description="Filter by task version ID"),
    status: Optional[AlarmSyncRecordStatus] = Query(None, description="Filter by status"),
    start_time: Optional[datetime] = Query(None, description="Start of created_at time range"),
    end_time: Optional[datetime] = Query(None, description="End of created_at time range"),
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of items to return"),
) -> PaginatedAPIResponse[List[AlarmSyncRecord]]:
    """List and filter alarm sync records with pagination."""
    created_at_range = None
    if start_time and end_time:
        st = start_time.astimezone(timezone.utc)
        et = end_time.astimezone(timezone.utc)
        if st > et:
            raise BadRequestError(message="start_time not later than end_time")
        created_at_range = TimeRange(start_time=int(st.timestamp()), end_time=int(et.timestamp()))

    records, total = await list_alarm_sync_records_service(
        task_id=task_id,
        task_version_id=task_version_id,
        status=status,
        created_at_range=created_at_range,
        skip=skip,
        limit=limit,
    )

    return PaginatedAPIResponse(
        message="Successfully retrieved alarm sync records",
        data=records,
        skip=skip,
        limit=limit,
        total=total,
    )


@alarm_router.post(
    "/sync",
    response_model=APIResponse[SyncAlarmRulesResponse],
    description="Synchronize alarm rules based on IntelligentThresholdTaskVersion result",
)
async def sync_alarm_rules(sync_config: SyncAlarmRulesPayload) -> APIResponse[SyncAlarmRulesResponse]:
    """Synchronize alarm rules based on the result of an intelligent threshold task version."""
    result = await sync_alarm_rules_service(sync_config)
    return APIResponse(
        message="success",
        data=result,
    )
