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

from enum import Enum

from pydantic import BaseModel


class ChannelType(str, Enum):
    """Channel types supported by the system."""

    Lark = "Lark"
    DingTalk = "DingTalk"
    WeChat = "WeChat"
    Webhook = "Webhook"


class MsgSenderType(str, Enum):
    """Message sender type."""

    USER = "user"
    BOT = "bot"


class MetricType(str, Enum):
    """Metric type."""

    SelfDefined = "SelfDefined"
    SuccessRate = "SuccessRate"  # Value range: 0-1
    SuccessRate100 = "SuccessRate100"  # Value range: 0-100
    ErrorRate = "ErrorRate"  # Value range: 0-1
    ErrorRate100 = "ErrorRate100"  # Value range: 0-100
    CounterRate = (
        "CounterRate"  # Result of rate calculation for Counter type metrics in Prometheus, not necessarily an integer
    )
    Count = "Count"  # Integer value
    ErrorCount = "ErrorCount"  # Integer value, representing the number of errors (a decrease is not abnormal)
    FatalErrorCount = "FatalErrorCount"  # Integer value, where even a small change is abnormal
    Latency = "Latency"  # millisecond
    LatencySecond = "LatencySecond"  # second
    LatencyMicrosecond = "LatencyMicrosecond"  # microsecond
    ResourceUtilizationRate = "ResourceUtilizationRate"  # Value range: 0-1
    ResourceUtilizationRate100 = "ResourceUtilizationRate100"  # Value range: 0-100
    CPUUsedCore = "CPUUsedCore"  # 1 means 1 core is used
    MemoryUsedBytes = "MemoryUsedBytes"  # Memory usage in bytes
    Throughput = "Throughput"  # Integer value


class ChatType(str, Enum):
    """Chat types."""

    Group = "group"
    P2P = "p2p"


# ------- Interest Agents types ------- #
class InterestActionType(str, Enum):
    """Interest action categories."""

    Filter = "Filter"
    Detect = "Detect"


class InterestInspectType(str, Enum):
    """Interest inspect categories."""

    Semantic = "Semantic"
    RE = "RE"  # Regular Expression


class RespStatus(str, Enum):
    """Response status."""

    Success = "success"
    Fail = "fail"


class RespEvent(str, Enum):
    """Response event."""

    OtherEvent = "veaiops.other_event"
    UnknownEvent = "veaiops.unknown_event"
    MsgReceived = "veaiops.msg.receive"
    ChatBotAdded = "veaiops.chat.bot_added"


class AgentType(str, Enum):
    """Agent Type."""

    CHATOPS_INTEREST = "chatops_interest_agent"
    CHATOPS_PROACTIVE_REPLY = "chatops_proactive_reply_agent"
    CHATOPS_REACTIVE_REPLY = "chatops_reactive_reply_agent"

    INTELLIGENT_THRESHOLD = "intelligent_threshold_agent"


class EventLevel(str, Enum):
    """Event Level."""

    P0 = "P0"
    P1 = "P1"
    P2 = "P2"


class AttributeKey(str, Enum):
    """Attribute Key."""

    Project = "project"
    Customer = "customer"
    Product = "product"


class ChannelWebhookResp(BaseModel, extra="allow"):
    """Webhook Response for channel."""

    status: RespStatus = RespStatus.Success
    event: RespEvent = RespEvent.OtherEvent


class KBType(str, Enum):
    """KB Type."""

    Custom = "Custom"
    AutoQA = "AutoQA"
    AutoDoc = "AutoDoc"

    def __str__(self) -> str:
        return self.value

    def __format__(self, format_spec: str) -> str:
        return format(str(self), format_spec)


class EventStatus(int, Enum):
    """Event status codes."""

    INITIAL = 0
    SUBSCRIBED = 1
    CARD_BUILT = 2
    DISPATCHED = 3
    NONE_DISPATCH = 4
    CHATOPS_NOT_MATCHED = 11
    CHATOPS_RULE_FILTERED = 12
    CHATOPS_RULE_RESTRAINED = 13


class EventShowStatus(str, Enum):
    """Event show status with Chinese display names."""

    PENDING = "等待发送"
    SUCCESS = "发送成功"
    NOT_SUBSCRIBED = "未订阅"
    NOT_MATCHED = "未命中规则"
    FILTERED = "命中过滤规则"
    RESTRAINED = "告警抑制"


EVENT_STATUS_MAP = {
    EventShowStatus.PENDING: [EventStatus.INITIAL, EventStatus.SUBSCRIBED, EventStatus.CARD_BUILT],
    EventShowStatus.SUCCESS: [EventStatus.DISPATCHED],
    EventShowStatus.NOT_SUBSCRIBED: [EventStatus.NONE_DISPATCH],
    EventShowStatus.NOT_MATCHED: [EventStatus.CHATOPS_NOT_MATCHED],
    EventShowStatus.FILTERED: [EventStatus.CHATOPS_RULE_FILTERED],
    EventShowStatus.RESTRAINED: [EventStatus.CHATOPS_RULE_RESTRAINED],
}


class DataSourceType(str, Enum):
    """Data source type enum."""

    Zabbix = "Zabbix"
    Aliyun = "Aliyun"
    Volcengine = "Volcengine"


class IntelligentThresholdTaskStatus(str, Enum):
    """Intelligent threshold task status."""

    LAUNCHING = "Launching"
    RUNNING = "Running"
    STOPPED = "Stopped"
    SUCCESS = "Success"
    FAILED = "Failed"


class IntelligentThresholdDirection(str, Enum):
    """Intelligent threshold Direction."""

    UP = "up"
    DOWN = "down"
    BOTH = "both"


class TaskPriority(int, Enum):
    """Task priority levels for intelligent threshold calculation."""

    LOW = 1
    NORMAL = 2
    HIGH = 3
    URGENT = 4


class CitationType(str, Enum):
    """Type for Citations."""

    Document = "Document"
    QA = "QA"
    Tool = "Tool"


class AutoIntelligentThresholdTaskStatus(int, Enum):
    """Auto intelligent threshold task status."""

    PENDING = 1
    PROCESSING = 2
    COMPLETED = 3


class AutoIntelligentThresholdTaskDetailStatus(int, Enum):
    """Auto intelligent threshold task detail status."""

    PENDING = 1
    PROCESSING = 2
    COMPLETED = 3


class AutoIntelligentThresholdTaskDetailTaskStatus(int, Enum):
    """Auto intelligent threshold task detail task status."""

    PENDING = 1
    PROCESSING = 2
    SUCCESS = 3
    FAILED = 4


class AutoIntelligentThresholdTaskAlarmInjectStatus(int, Enum):
    """Auto intelligent threshold task alarm inject status."""

    INITIALIZED = 0
    PENDING = 1
    SUCCESS = 2
    FAILED = 3


class AlarmSyncRecordStatus(int, Enum):
    """Alarm sync record execution status."""

    INITIALIZED = 0
    SUCCESS = 1
    FAILED = 2


class VolcRegion(str, Enum):
    """Volcengine region."""


class TOSRegion(str, Enum):
    """TOSRegion region."""

    CN_Beijing = "cn-beijing"
    CN_Shanghai = "cn-shanghai"
    CN_Guangzhou = "cn-guangzhou"
    CN_Hongkong = "cn-hongkong"
    AP_Southeast_1 = "ap-southeast-1"
    AP_Southeast_3 = "ap-southeast-3"


class NetworkType(str, Enum):
    """Network type."""

    Public = "public"
    Internal = "internal"


class FeedbackActionType(str, Enum):
    """Feedback action type."""

    Public = "public"
    Like = "like"
    Dislike = "dislike"
    Feedback = "feedback"
    Redirect = "redirect"
