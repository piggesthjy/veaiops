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

import asyncio
from datetime import datetime, timezone
from typing import List, Optional

from veaiops.schema.base.intelligent_threshold import (
    AliyunAlarmNotification,
    BaseAlarmPayload,
    ResourceInfo,
    VolcengineAlarmNotification,
    VolcengineAlarmPayload,
    ZabbixAlarmPayload,
)
from veaiops.schema.documents import Event
from veaiops.schema.types import AgentType, DataSourceType, EventLevel
from veaiops.utils.log import logger


async def handle_volcengine_resource_event(
    alarm: VolcengineAlarmPayload,
    event_level: EventLevel,
    projects: List[str],
    customers: List[str],
    products: List[str],
    resources: List[ResourceInfo],
    event_type: str,
) -> Optional[List[Event]]:
    """Handle Volcengine resource events (alarms or recoveries).

    Args:
        alarm: Alarm payload
        event_level: Event level
        projects: Project list
        customers: Customer list
        products: Product list
        regions: Region list
        resources: Resource list
        event_type: Event type (Metric for alarm, MetricRecovered for recovery)

    Returns:
        List[Event]: List of event objects or None
    """
    if not resources:
        return None

    # Collect all alert_group_ids from resources that have them
    alert_group_ids = [resource.alert_group_id for resource in resources if resource.alert_group_id]

    # Create a mapping of alert_group_id to resource for easy lookup
    resource_map = {resource.alert_group_id: resource for resource in resources if resource.alert_group_id}

    existing_events = []
    # If we have alert_group_ids, batch query for existing events
    if alert_group_ids:
        # Calculate the timestamp from 1 hour ago (using the first resource's first_alert_time as reference)
        one_hour_ago = resources[0].first_alert_time - 3600  # 3600 seconds = 1 hour

        # Construct query conditions to find events with any of the alert_group_ids
        query_conditions = {
            "agent_type": AgentType.INTELLIGENT_THRESHOLD,
            "datasource_type": DataSourceType.Volcengine,
            "raw_data.resource.alert_group_id": {"$in": alert_group_ids},
            "updated_at": {"$gte": datetime.fromtimestamp(one_hour_ago, tz=timezone.utc)},
        }
        # Batch query for all existing events
        existing_events = await Event.find(query_conditions).to_list()

    # Create a mapping of alert_group_id to existing event for easy lookup
    existing_event_map = {
        event.raw_data.resource.alert_group_id: event
        for event in existing_events
        if event.raw_data and event.raw_data.resource
    }

    events = []
    # Process resources with alert_group_id
    for alert_group_id, resource in resource_map.items():
        existing_event = existing_event_map.get(alert_group_id)
        if existing_event:
            # If event already exists, update the event content
            existing_event.event_level = event_level
            existing_event.project = projects
            existing_event.customer = customers
            existing_event.product = products
            existing_event.region = [resource.region]
            existing_event.raw_data = VolcengineAlarmNotification(
                Type=alarm.type,
                AccountId=alarm.account_id,
                RuleName=alarm.rule_name,
                RuleId=alarm.rule_id,
                Namespace=alarm.namespace,
                SubNamespace=alarm.sub_namespace,
                Level=alarm.level,
                HappenedAt=alarm.happened_at,
                RuleCondition=alarm.rule_condition,
                Resource=resource,
                Project=alarm.project,
                Tags=alarm.tags,
            )
            existing_event.updated_at = datetime.now(timezone.utc)
            events.append(existing_event)
        elif event_type == "Metric":
            # If event doesn't exist and it's an alarm event, create a new event
            new_event = Event(
                agent_type=AgentType.INTELLIGENT_THRESHOLD,
                datasource_type=DataSourceType.Volcengine,
                event_level=event_level,
                raw_data=VolcengineAlarmNotification(
                    Type=alarm.type,
                    AccountId=alarm.account_id,
                    RuleName=alarm.rule_name,
                    RuleId=alarm.rule_id,
                    Namespace=alarm.namespace,
                    SubNamespace=alarm.sub_namespace,
                    Level=alarm.level,
                    HappenedAt=alarm.happened_at,
                    RuleCondition=alarm.rule_condition,
                    Resource=resource,
                    Project=alarm.project,
                    Tags=alarm.tags,
                ),
                project=projects,
                customer=customers,
                product=products,
                region=[resource.region],
                created_at=datetime.now(timezone.utc),
            )
            events.append(new_event)

    # Save all events concurrently
    if events:
        await asyncio.gather(*[event.save() if event.id else event.insert() for event in events])

    # Return the list of events or None if no events were created/updated
    return events if events else None


async def handle_aliyun_resource_event(
    alarm: AliyunAlarmNotification,
    event_level: EventLevel,
    projects: List[str],
    customers: List[str],
    products: List[str],
) -> Optional[List[Event]]:
    """Handle Aliyun resource event creation/update."""
    event = Event(
        agent_type=AgentType.INTELLIGENT_THRESHOLD,
        datasource_type=DataSourceType.Aliyun,
        event_level=event_level,
        raw_data=alarm,
        project=projects,
        customer=customers,
        product=products,
        region=[alarm.regionId] if alarm.regionId else [],
    )

    await event.save()

    return [event]


async def handle_aliyun_resource_event_with_merge(
    alarm: AliyunAlarmNotification,
    event_level: EventLevel,
    projects: List[str],
    customers: List[str],
    products: List[str],
    event_type: str,
) -> Optional[List[Event]]:
    """Handle Aliyun resource events (alarms or recoveries) with event merging.

    For Aliyun, we merge events based on dimensions and rule ID, not resource-specific information
    like Volcengine.

    Args:
        alarm: Alarm payload
        event_level: Event level
        projects: Project list
        customers: Customer list
        products: Product list
        event_type: Event type (ALERT for alarm, OK for recovery)

    Returns:
        List[Event]: List of event objects or None
    """
    # For Aliyun, we use ruleId and dimensions for merging

    # Query for existing events with the same merge key in the last hour
    one_hour_ago = int(datetime.now().timestamp()) - 3600
    query_conditions = {
        "agent_type": AgentType.INTELLIGENT_THRESHOLD,
        "datasource_type": DataSourceType.Aliyun,
        "raw_data.ruleId": alarm.ruleId,
        "raw_data.dimensions": alarm.dimensions,  # This will match exact dimension objects
        "updated_at": {"$gte": datetime.fromtimestamp(one_hour_ago, tz=timezone.utc)},
    }

    # Find existing events with the same ruleId and dimensions
    existing_events = await Event.find(query_conditions).sort("-updated_at").to_list()

    # For recovery events, we might want to find the corresponding alarm event
    if event_type == "OK":
        if existing_events:
            # Get the most recent event
            latest_event = existing_events[0]

            # If the latest event is an ALERT, create a new recovery event
            # If the latest event is already an OK, update it (merge recoveries)
            if hasattr(latest_event.raw_data, "alertState") and latest_event.raw_data.alertState == "ALERT":
                # Create new recovery event
                event = Event(
                    agent_type=AgentType.INTELLIGENT_THRESHOLD,
                    datasource_type=DataSourceType.Aliyun,
                    event_level=event_level,
                    raw_data=alarm,
                    project=projects,
                    customer=customers,
                    product=products,
                    region=[alarm.regionId] if alarm.regionId else [],
                    created_at=datetime.now(timezone.utc),
                )
                await event.save()
                return [event]
            else:
                # Update existing recovery event (merge multiple recoveries)
                latest_event.event_level = event_level
                latest_event.project = projects
                latest_event.customer = customers
                latest_event.product = products
                latest_event.region = [alarm.regionId] if alarm.regionId else []
                latest_event.raw_data = alarm
                latest_event.updated_at = datetime.now(timezone.utc)

                await latest_event.save()
                return [latest_event]
        else:
            # If no existing event found, create a new recovery event
            event = Event(
                agent_type=AgentType.INTELLIGENT_THRESHOLD,
                datasource_type=DataSourceType.Aliyun,
                event_level=event_level,
                raw_data=alarm,
                project=projects,
                customer=customers,
                product=products,
                region=[alarm.regionId] if alarm.regionId else [],
                created_at=datetime.now(timezone.utc),
            )
            await event.save()
            return [event]
    else:
        # For alarm events
        if existing_events:
            # Get the most recent event
            latest_event = existing_events[0]

            # If the latest event is also an ALERT, update it (merge alerts)
            # If the latest event is an OK, create a new alert event
            if hasattr(latest_event.raw_data, "alertState") and latest_event.raw_data.alertState == "ALERT":
                # Update existing alert event (merge multiple alerts)
                latest_event.event_level = event_level
                latest_event.project = projects
                latest_event.customer = customers
                latest_event.product = products
                latest_event.region = [alarm.regionId] if alarm.regionId else []
                latest_event.raw_data = alarm
                latest_event.updated_at = datetime.now(timezone.utc)

                await latest_event.save()
                return [latest_event]
            else:
                # Create new alert event after recovery
                event = Event(
                    agent_type=AgentType.INTELLIGENT_THRESHOLD,
                    datasource_type=DataSourceType.Aliyun,
                    event_level=event_level,
                    raw_data=alarm,
                    project=projects,
                    customer=customers,
                    product=products,
                    region=[alarm.regionId] if alarm.regionId else [],
                    created_at=datetime.now(timezone.utc),
                )
                await event.save()
                return [event]
        else:
            # Create new alert event
            event = Event(
                agent_type=AgentType.INTELLIGENT_THRESHOLD,
                datasource_type=DataSourceType.Aliyun,
                event_level=event_level,
                raw_data=alarm,
                project=projects,
                customer=customers,
                product=products,
                region=[alarm.regionId] if alarm.regionId else [],
                created_at=datetime.now(timezone.utc),
            )
            await event.save()
            return [event]


async def convert_volcengine_alarm_to_event(alarm: VolcengineAlarmPayload) -> Optional[List[Event]]:
    """Convert Volcengine alarm payload to Event.

    Args:
        alarm (VolcengineAlarmPayload): The Volcengine alarm payload to be converted.

    Returns:
        Event: Event object to create or None
    """
    # Extract relevant information from the alarm payload
    event_level = EventLevel.P2  # Default level
    if alarm.level == "critical":
        event_level = EventLevel.P0
    elif alarm.level == "warning":
        event_level = EventLevel.P1
    elif alarm.level == "notice":
        event_level = EventLevel.P2

    # Extract project, customer, product information from tags if available
    projects = []
    customers = []
    products = []

    if alarm.tags:
        for tag in alarm.tags:
            # Handle tags with numeric suffixes (projects_01, projects_02, etc.)
            if tag.key.startswith("projects_"):
                # Check if the last two characters are digits
                suffix = tag.key[9:]  # Get the part after "projects_"
                if len(suffix) == 2 and suffix.isdigit():
                    projects.append(tag.value)
            elif tag.key.startswith("customers_"):
                # Check if the last two characters are digits
                suffix = tag.key[10:]  # Get the part after "customers_"
                if len(suffix) == 2 and suffix.isdigit():
                    customers.append(tag.value)
            elif tag.key.startswith("products_"):
                # Check if the last two characters are digits
                suffix = tag.key[9:]  # Get the part after "products_"
                if len(suffix) == 2 and suffix.isdigit():
                    products.append(tag.value)

    # Handle different logic based on alarm type
    if alarm.type == "Metric":
        # Handle alarm events
        return await handle_volcengine_resource_event(
            alarm, event_level, projects, customers, products, alarm.resources, "Metric"
        )

    elif alarm.type == "MetricRecovered":
        # Handle recovery events
        return await handle_volcengine_resource_event(
            alarm, event_level, projects, customers, products, alarm.recovered_resources, "MetricRecovered"
        )

    else:
        # For unsupported event types, log and return None
        logger.warning(f"Unsupported alarm type: {alarm.type}")
        return None


async def convert_intelligent_threshold_alarm_to_event(
    source: DataSourceType, alarm: BaseAlarmPayload
) -> Optional[List[Event]]:
    """Convert intelligent threshold alarm payload to Event based on source type.

    Args:
        source (DataSourceType): The data source type (Aliyun, Volcengine, Zabbix)
        alarm: The alarm payload to be converted

    Returns:
        Event: Event object to create or None
    """
    try:
        if source == DataSourceType.Volcengine:
            if isinstance(alarm, VolcengineAlarmPayload):
                return await convert_volcengine_alarm_to_event(alarm)
            else:
                logger.error(f"Mismatch between source {source} and alarm type {type(alarm)}")
                return None
        elif source == DataSourceType.Aliyun:
            if isinstance(alarm, AliyunAlarmNotification):
                return await convert_aliyun_alarm_to_event(alarm)
            else:
                logger.error(f"Mismatch between source {source} and alarm type {type(alarm)}")
                return None
        elif source == DataSourceType.Zabbix:
            if isinstance(alarm, ZabbixAlarmPayload):
                return await convert_zabbix_alarm_to_event(alarm)
            else:
                logger.error(f"Mismatch between source {source} and alarm type {type(alarm)}")
                return None
        else:
            logger.error(f"Unsupported data source type: {source}")
            return None
    except Exception as e:
        logger.error(f"Error converting alarm to event: {e}")
        return None


async def convert_aliyun_alarm_to_event(alarm: AliyunAlarmNotification) -> Optional[List[Event]]:
    """Convert Aliyun alarm payload to Event."""
    event_level = EventLevel.P2  # Default level
    if alarm.triggerLevel == "CRITICAL":
        event_level = EventLevel.P0
    elif alarm.triggerLevel == "WARN":
        event_level = EventLevel.P1
    elif alarm.triggerLevel == "INFO":
        event_level = EventLevel.P2

    projects = []
    customers = []
    products = []

    if alarm.customLabels:
        for label in alarm.customLabels:
            if label.label.startswith("projects_"):
                suffix = label.label[9:]
                if len(suffix) == 2 and suffix.isdigit():
                    projects.append(label.value)
            elif label.label.startswith("customers_"):
                suffix = label.label[10:]
                if len(suffix) == 2 and suffix.isdigit():
                    customers.append(label.value)
            elif label.label.startswith("products_"):
                suffix = label.label[9:]
                if len(suffix) == 2 and suffix.isdigit():
                    products.append(label.value)

    # Handle different logic based on alertState
    if alarm.alertState == "ALERT":
        # Handle alarm events
        return await handle_aliyun_resource_event_with_merge(alarm, event_level, projects, customers, products, "ALERT")
    elif alarm.alertState == "OK":
        # Handle recovery events
        return await handle_aliyun_resource_event_with_merge(alarm, event_level, projects, customers, products, "OK")
    else:
        # For unsupported event types, use the original handler
        return await handle_aliyun_resource_event(alarm, event_level, projects, customers, products)


async def handle_zabbix_resource_event_with_merge(
    alarm: ZabbixAlarmPayload,
    event_level: EventLevel,
    projects: List[str],
    customers: List[str],
    products: List[str],
    event_type: str,
) -> Optional[List[Event]]:
    """Handle Zabbix resource events (alarms or recoveries) with event merging.

    For Zabbix, we merge events based on host_id and item_id, not resource-specific information
    like Volcengine.

    Args:
        alarm: Alarm payload
        event_level: Event level
        projects: Project list
        customers: Customer list
        products: Product list
        event_type: Event type (PROBLEM for alarm, OK for recovery)

    Returns:
        List[Event]: List of event objects or None
    """
    # For Zabbix, we use host_id and item_id for merging
    params = alarm.params

    # Query for existing events with the same merge key in the last hour
    one_hour_ago = int(datetime.now().timestamp()) - 3600
    query_conditions = {
        "agent_type": AgentType.INTELLIGENT_THRESHOLD,
        "datasource_type": DataSourceType.Zabbix,
        "raw_data.host_id": params.host_id,
        "raw_data.item_id": params.item_id,
        "updated_at": {"$gte": datetime.fromtimestamp(one_hour_ago, tz=timezone.utc)},
    }

    # Find existing events with the same host_id and item_id
    existing_events = await Event.find(query_conditions).sort("-updated_at").limit(1).to_list()

    # For recovery events (OK), we might want to find the corresponding alarm event
    if event_type == "OK":
        if existing_events:
            # Get the most recent event
            latest_event = existing_events[0]

            # If the latest event is a PROBLEM, create a new recovery event
            # If the latest event is already an OK, update it (merge recoveries)
            if hasattr(latest_event.raw_data, "trigger_status") and latest_event.raw_data.trigger_status == "PROBLEM":
                # Create new recovery event
                event = Event(
                    agent_type=AgentType.INTELLIGENT_THRESHOLD,
                    datasource_type=DataSourceType.Zabbix,
                    event_level=event_level,
                    raw_data=params.model_dump(),
                    project=projects,
                    customer=customers,
                    product=products,
                    region=[],
                    created_at=datetime.now(timezone.utc),
                )
                await event.save()
                return [event]
            else:
                # Update existing recovery event (merge multiple recoveries)
                latest_event.event_level = event_level
                latest_event.project = projects
                latest_event.customer = customers
                latest_event.product = products
                latest_event.region = []
                latest_event.raw_data = params.model_dump()
                latest_event.updated_at = datetime.now(timezone.utc)

                await latest_event.save()
                return [latest_event]
        else:
            # If no existing event found, create a new recovery event
            event = Event(
                agent_type=AgentType.INTELLIGENT_THRESHOLD,
                datasource_type=DataSourceType.Zabbix,
                event_level=event_level,
                raw_data=params.model_dump(),
                project=projects,
                customer=customers,
                product=products,
                region=[],
                created_at=datetime.now(timezone.utc),
            )
            await event.save()
            return [event]
    else:
        # For alarm events (PROBLEM)
        if existing_events:
            # Get the most recent event
            latest_event = existing_events[0]

            # If the latest event is also a PROBLEM, update it (merge alerts)
            # If the latest event is an OK, create a new alert event
            if hasattr(latest_event.raw_data, "trigger_status") and latest_event.raw_data.trigger_status == "PROBLEM":
                # Update existing alert event (merge multiple alerts)
                latest_event.event_level = event_level
                latest_event.project = projects
                latest_event.customer = customers
                latest_event.product = products
                latest_event.region = []
                latest_event.raw_data = params.model_dump()
                latest_event.updated_at = datetime.now(timezone.utc)

                await latest_event.save()
                return [latest_event]
            else:
                # Create new alert event after recovery
                event = Event(
                    agent_type=AgentType.INTELLIGENT_THRESHOLD,
                    datasource_type=DataSourceType.Zabbix,
                    event_level=event_level,
                    raw_data=params.model_dump(),
                    project=projects,
                    customer=customers,
                    product=products,
                    region=[],
                    created_at=datetime.now(timezone.utc),
                )
                await event.save()
                return [event]
        else:
            # Create new alert event
            event = Event(
                agent_type=AgentType.INTELLIGENT_THRESHOLD,
                datasource_type=DataSourceType.Zabbix,
                event_level=event_level,
                raw_data=params.model_dump(),
                project=projects,
                customer=customers,
                product=products,
                region=[],
                created_at=datetime.now(timezone.utc),
            )
            await event.save()
            return [event]


async def convert_zabbix_alarm_to_event(alarm: ZabbixAlarmPayload) -> Optional[List[Event]]:
    """Convert Zabbix alarm payload to Events.

    Returns:
        Optional[List[Event]]: Created events or None.
    """
    params = alarm.params
    # Map Zabbix severity to EventLevel. Assuming params.severity is a string.
    event_level = EventLevel.P2  # Default level
    if hasattr(params, "message"):
        if "Severity: High" in params.message or "Severity: Disaster" in params.message:
            event_level = EventLevel.P0
        elif "Severity: Average" in params.message or "Severity: Warning" in params.message:
            event_level = EventLevel.P1

    # Extract project, customer, product information from tags if available
    projects = []
    customers = []
    products = []

    if hasattr(params, "tags") and params.tags:
        for tag in params.tags:
            if hasattr(tag, "tag") and hasattr(tag, "value"):
                if tag.tag.startswith("projects_"):
                    suffix = tag.tag[9:]
                    if len(suffix) == 2 and suffix.isdigit():
                        projects.append(tag.value)
                elif tag.tag.startswith("customers_"):
                    suffix = tag.tag[10:]
                    if len(suffix) == 2 and suffix.isdigit():
                        customers.append(tag.value)
                elif tag.tag.startswith("products_"):
                    suffix = tag.tag[9:]
                    if len(suffix) == 2 and suffix.isdigit():
                        products.append(tag.value)

    # Handle different logic based on trigger_status
    if params.trigger_status == "PROBLEM":
        # Handle alarm events
        return await handle_zabbix_resource_event_with_merge(
            alarm, event_level, projects, customers, products, "PROBLEM"
        )
    elif params.trigger_status == "OK":
        # Handle recovery events
        return await handle_zabbix_resource_event_with_merge(alarm, event_level, projects, customers, products, "OK")
    else:
        # For unsupported event types, create a simple event
        event = Event(
            agent_type=AgentType.INTELLIGENT_THRESHOLD,
            datasource_type=DataSourceType.Zabbix,
            event_level=event_level,
            raw_data=params.model_dump(),
            project=projects,
            customer=customers,
            product=products,
            region=[],  # Zabbix alarms are not typically region-specific
            created_at=datetime.now(timezone.utc),
        )
        await event.save()
        return [event]
