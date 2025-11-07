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

from datetime import datetime
from typing import Any, List, Optional

from beanie import PydanticObjectId
from beanie.operators import GTE, LTE, In
from fastapi import APIRouter, BackgroundTasks, Body, Query, Request, status

from veaiops.handler.errors import BadRequestError, RecordNotFoundError
from veaiops.handler.services.event import (
    convert_interest_to_event,
    convert_proactive_to_event,
    convert_reactive_to_event,
)
from veaiops.handler.services.event.consume import consume_event
from veaiops.handler.services.event.converter.intelligent_threshold import convert_intelligent_threshold_alarm_to_event
from veaiops.schema.base.intelligent_threshold import (
    AliyunAlarmNotification,
    VolcengineAlarmPayload,
    ZabbixAlarmPayload,
)
from veaiops.schema.documents import AgentNotification, Event
from veaiops.schema.models import APIResponse, PaginatedAPIResponse
from veaiops.schema.types import (
    EVENT_STATUS_MAP,
    AgentType,
    DataSourceType,
    EventLevel,
    EventShowStatus,
)
from veaiops.utils.log import logger

router = APIRouter(prefix="/event")


@router.post("/chatops/", response_model=APIResponse[str], status_code=status.HTTP_201_CREATED)
async def create_chatops_event(notification: AgentNotification, background_tasks: BackgroundTasks) -> APIResponse[str]:
    """Create a chatops event."""
    logger.info(f"Creating chatops event with data: {notification.model_dump()}")
    if notification.agent_type == AgentType.CHATOPS_INTEREST:
        event = await convert_interest_to_event(notification)
    elif notification.agent_type == AgentType.CHATOPS_REACTIVE_REPLY:
        event = await convert_reactive_to_event(notification)
    elif notification.agent_type == AgentType.CHATOPS_PROACTIVE_REPLY:
        event = await convert_proactive_to_event(notification)
    else:
        logger.error(f"Unsupported agent type: {notification.agent_type}")
        raise BadRequestError(message="Unsupported Agent Type")

    if event is None:
        logger.info("No event created due to unmet conditions")
        raise BadRequestError(message="Event creation conditions not met")

    await event.save()

    background_tasks.add_task(consume_event, event=event)

    logger.info(f"Chatops event {event.id} created successfully")
    return APIResponse(data=str(event.id))


@router.get("/{event_id}", response_model=APIResponse[Event])
async def get_event(event_id: PydanticObjectId) -> APIResponse[Event]:
    """Get an event."""
    logger.info(f"Reading event with id: {event_id}")
    event = await Event.get(event_id)
    if not event:
        logger.warning(f"Event {event_id} not found")
        raise RecordNotFoundError(message="Event not found")
    logger.info(f"Event {event_id} get successfully")
    return APIResponse(data=event)


@router.get("/", response_model=PaginatedAPIResponse[List[Event]])
async def get_events(
    agent_type: Optional[List[AgentType]] = Query(None),
    show_status: Optional[List[EventShowStatus]] = Query(None),
    event_level: Optional[List[EventLevel]] = Query(None),
    region: Optional[List[str]] = Query(None),
    projects: Optional[List[str]] = Query(None),
    products: Optional[List[str]] = Query(None),
    customers: Optional[List[str]] = Query(None),
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    sort_order: str = Query("desc", enum=["asc", "desc"], description="Sort order by creation time"),
    skip: int = 0,
    limit: int = 100,
) -> PaginatedAPIResponse[List[Event]]:
    """Retrieve a list of events.

    Args:
        agent_type (AgentType): AgentTypes,
        show_status (Optional[List[EventShowStatus]]): EventShowStatus,
        event_level (Optional[List[EventLevel]]): EventLevel,
        region (List[str]): Region,
        projects (List[str]): Projects,
        products (List[str]): Products,
        customers (List[str]): Customers,
        start_time (datetime): Start time,
        end_time (datetime): End time,
        sort_order (str): Sort order by creation time,
        skip (int): Skip count,
        limit (int): Limit count,

    Returns:
        list of Events.
    """
    conditions: List[Any] = []
    if agent_type:
        conditions.append(In(Event.agent_type, agent_type))
    if show_status:
        event_statuses = []
        for s in show_status:
            event_statuses.extend(EVENT_STATUS_MAP.get(s, []))
        if event_statuses:
            conditions.append(In(Event.status, list(set(event_statuses))))
    if event_level:
        conditions.append(In(Event.event_level, event_level))
    if region:
        conditions.append(In(Event.region, region))
    if products:
        conditions.append(In(Event.interest_products, products))
    if projects:
        conditions.append(In(Event.interest_projects, projects))
    if customers:
        conditions.append(In(Event.interest_customers, customers))
    if start_time:
        conditions.append(GTE(Event.created_at, start_time))
    if end_time:
        conditions.append(LTE(Event.created_at, end_time))

    query = Event.find(*conditions)
    total = await query.count()
    sort_field = Event.created_at
    if sort_order == "desc":
        query = query.sort(-sort_field)
    else:
        query = query.sort(sort_field)
    events = await query.skip(skip).limit(limit).to_list()
    logger.info(f"Found {len(events)} events")
    return PaginatedAPIResponse(data=events, total=total, skip=skip, limit=limit)


@router.post("/intelligent_threshold/volcengine/", response_model=APIResponse[str], status_code=status.HTTP_200_OK)
async def create_volcengine_intelligent_threshold_event(
    background_tasks: BackgroundTasks,
    raw_data: VolcengineAlarmPayload = Body(...),
) -> APIResponse[str]:
    """Create an intelligent threshold event from Volcengine alarm payload."""
    logger.info(f"Creating intelligent threshold event from Volcengine with data: {raw_data}")

    events = await convert_intelligent_threshold_alarm_to_event(DataSourceType.Volcengine, raw_data)

    if events is None:
        logger.info("No event created due to conversion failure")
        raise BadRequestError(message="Failed to convert alarm to event")

    for event in events:
        # Trigger the consumption process in the background
        background_tasks.add_task(consume_event, event=event)
        logger.info(f"Intelligent threshold event {event.id} created or updated successfully")

    return APIResponse(data=",".join(str(event.id) for event in events))


@router.post("/intelligent_threshold/zabbix/", response_model=APIResponse[str], status_code=status.HTTP_200_OK)
async def create_zabbix_intelligent_threshold_event(
    background_tasks: BackgroundTasks,
    raw_data: ZabbixAlarmPayload = Body(...),
) -> APIResponse[str]:
    """Create an intelligent threshold event from Zabbix alarm payload."""
    logger.info(f"Creating intelligent threshold event from Zabbix with data: {raw_data}")

    events = await convert_intelligent_threshold_alarm_to_event(DataSourceType.Zabbix, raw_data)

    if events is None:
        logger.info("No event created due to conversion failure")
        raise BadRequestError(message="Failed to convert alarm to event")

    for event in events:
        # Trigger the consumption process in the background
        background_tasks.add_task(consume_event, event=event)
        logger.info(f"Intelligent threshold event {event.id} created or updated successfully")

    return APIResponse(data=",".join(str(event.id) for event in events))


@router.post("/intelligent_threshold/aliyun/form/", response_model=APIResponse[str], status_code=status.HTTP_200_OK)
async def create_aliyun_intelligent_threshold_event_form(
    background_tasks: BackgroundTasks,
    request: Request,
) -> APIResponse[str]:
    """Create an intelligent threshold event from Aliyun form data."""
    # Parse form data
    form_data = await request.form()

    # Log the raw form data for debugging
    logger.info(f"Received Aliyun form data: {dict(form_data)}")

    # Helper function to handle 'null' string values and other edge cases
    def parse_value(value):
        if value is None or value == "null" or value == "":
            return None
        return value

    def parse_custom_labels(value):
        if not value or value == "null" or value == "":
            return None
        try:
            # The value is a string like '{key1=value1, key2=value2}'
            # Remove the curly braces and split by comma
            items = value.strip("{}").split(", ")
            labels = []
            for item in items:
                key, val = item.split("=")
                labels.append({"label": key, "value": val})
            return labels
        except Exception as e:
            logger.error(f"Error parsing customLabels: {e}")
            return None

    alarm_payload = AliyunAlarmNotification(
        lastTime=parse_value(form_data.get("lastTime")),
        rawMetricName=parse_value(form_data.get("rawMetricName")),
        expression=parse_value(form_data.get("expression")),
        metricName=parse_value(form_data.get("metricName")),
        instanceName=parse_value(form_data.get("instanceName")),
        signature=parse_value(form_data.get("signature")),
        groupId=parse_value(form_data.get("groupId")),
        regionName=parse_value(form_data.get("regionName")),
        productGroupName=parse_value(form_data.get("productGroupName")),
        metricProject=parse_value(form_data.get("metricProject")),
        userId=parse_value(form_data.get("userId")),
        curValue=parse_value(form_data.get("curValue")),
        alertName=parse_value(form_data.get("alertName")),
        regionId=parse_value(form_data.get("regionId")),
        namespace=parse_value(form_data.get("namespace")),
        triggerLevel=parse_value(form_data.get("triggerLevel")),
        alertState=parse_value(form_data.get("alertState")),
        preTriggerLevel=parse_value(form_data.get("preTriggerLevel")),
        ruleId=parse_value(form_data.get("ruleId")),
        dimensions=parse_value(form_data.get("dimensions")),
        customLabels=parse_custom_labels(form_data.get("customLabels")),
    )

    logger.info(f"Creating intelligent threshold event from Aliyun form data: {alarm_payload}")

    events = await convert_intelligent_threshold_alarm_to_event(DataSourceType.Aliyun, alarm_payload)

    if events is None:
        logger.info("No event created due to conversion failure")
        raise BadRequestError(message="Failed to convert alarm to event")

    for event in events:
        # Trigger the consumption process in the background
        background_tasks.add_task(consume_event, event=event)
        logger.info(f"Intelligent threshold event {event.id} created or updated successfully")

    return APIResponse(data=",".join(str(event.id) for event in events))
