// Copyright 2025 Beijing Volcano Engine Technology Co., Ltd. and/or its affiliates
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { Badge, Button } from '@arco-design/web-react';
import { IconEye } from '@arco-design/web-react/icon';
import type { Event, EventLevel } from '@veaiops/api-client';
import { AgentType, EventStatus } from '@veaiops/api-client';
import type React from 'react';
import { CellRender } from '../cell-render';
import type { ModernTableColumnProps } from '../custom-table/types/core/common';

const { CopyableText, CustomOutlineTag, CustomOutlineTagList, StampTime } =
  CellRender;

/**
 * 渲染事件ID
 */
export const renderEventId = (value: string) => {
  return <CopyableText text={value || ''} />;
};

/**
 * 渲染智能体类型
 */
export const renderAgentType = (value: AgentType) => {
  const agentTypeMap: Record<AgentType, string> = {
    [AgentType.INTELLIGENT_THRESHOLD_AGENT]: '智能阈值Agent',
    [AgentType.CHATOPS_INTEREST_AGENT]: '内容识别Agent',
    [AgentType.CHATOPS_PROACTIVE_REPLY_AGENT]: '主动回复Agent',
    [AgentType.CHATOPS_REACTIVE_REPLY_AGENT]: '被动回复Agent',
  };

  return <CustomOutlineTag>{agentTypeMap[value] || value}</CustomOutlineTag>;
};

/**
 * 渲染状态（EventStatus 数值转中文显示状态）
 * 使用 Badge 组件显示，参考 origin/feat/web-v2 实现
 *
 * 状态映射关系（对应后端 EventStatus 枚举）：
 * - 0 (INITIAL): 初始状态 → 等待发送
 * - 1 (SUBSCRIBED): 订阅匹配完成 → 等待发送
 * - 2 (CARD_BUILT): 卡片已构造 → 等待发送
 * - 3 (DISPATCHED): 已发送 → 发送成功
 * - 4 (NONE_DISPATCH): 无订阅匹配 → 未订阅
 * - 11 (CHATOPS_NOT_MATCHED): ChatOps未匹配 → 未命中规则
 * - 12 (CHATOPS_RULE_FILTERED): ChatOps规则过滤 → 命中过滤规则
 * - 13 (CHATOPS_RULE_RESTRAINED): ChatOps规则限制 → 告警抑制
 */
export const renderStatus = (value?: number | null) => {
  if (value === undefined || value === null) {
    return <span style={{ color: '#86909C' }}>-</span>;
  }

  // 状态配置映射
  const statusConfigMap: Record<
    number,
    {
      text: string;
      status: 'success' | 'error' | 'processing' | 'warning' | 'default';
    }
  > = {
    // 等待发送状态（0, 1, 2）
    [EventStatus.INITIAL]: { text: '等待发送', status: 'processing' },
    [EventStatus.SUBSCRIBED]: { text: '等待发送', status: 'processing' },
    [EventStatus.CARD_BUILT]: { text: '等待发送', status: 'processing' },
    // 发送成功（3）
    [EventStatus.DISTRIBUTED]: { text: '发送成功', status: 'success' },
    // 未订阅（4）
    [EventStatus.NO_DISTRIBUTION]: { text: '未订阅', status: 'warning' },
    // ChatOps 相关状态（11, 12, 13）
    [EventStatus.CHATOPS_NO_MATCH]: { text: '未命中规则', status: 'warning' },
    [EventStatus.CHATOPS_RULE_FILTERED]: {
      text: '命中过滤规则',
      status: 'error',
    },
    [EventStatus.CHATOPS_RULE_LIMITED]: { text: '告警抑制', status: 'error' },
  };

  const config = statusConfigMap[value] || {
    text: `未知状态(${value})`,
    status: 'default' as const,
  };

  return <Badge status={config.status} text={config.text} />;
};

/**
 * 渲染事件级别
 */
export const renderEventLevel = (value: EventLevel) => {
  return <CustomOutlineTag>{value || '未知'}</CustomOutlineTag>;
};

/**
 * 渲染项目列表
 */
export const renderProjectList = (value: string[]) => {
  if (!value || value.length === 0) {
    return <span style={{ color: '#86909C' }}>-</span>;
  }

  if (value.length === 1) {
    return <CustomOutlineTag>{value[0]}</CustomOutlineTag>;
  }

  return (
    <CustomOutlineTagList
      dataList={value.map((item) => ({ name: item }))}
      maxCount={3}
    />
  );
};

/**
 * 渲染时间戳
 */
export const renderTimestamp = (value: string) => {
  return <StampTime time={value} />;
};

/**
 * 渲染操作列
 */
export const renderActions = ({
  record,
  onViewDetail,
  customActions,
}: {
  record: Event;
  onViewDetail?: (record: Event) => void;
  customActions?: (record: Event) => React.ReactNode;
}) => {
  return (
    <div className="flex items-center gap-2">
      {onViewDetail && (
        <Button
          type="text"
          size="small"
          icon={<IconEye />}
          onClick={() => onViewDetail(record)}
        >
          查看详情
        </Button>
      )}
      {customActions && customActions(record)}
    </div>
  );
};

/**
 * 获取统一的历史事件列配置
 */
export const getEventHistoryColumns = ({
  onViewDetail,
  customActions,
}: {
  onViewDetail?: (record: Event) => void;
  customActions?: (record: Event) => React.ReactNode;
}): ModernTableColumnProps<Event>[] => [
  {
    title: '事件ID',
    dataIndex: '_id',
    key: 'event_id',
    width: 180,
    fixed: 'left',
    ellipsis: true,
    render: renderEventId,
  },
  {
    title: '智能体',
    dataIndex: 'agent_type',
    key: 'agent_type',
    width: 120,
    render: renderAgentType,
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 120,
    render: renderStatus,
  },
  {
    title: '事件级别',
    dataIndex: 'event_level',
    key: 'event_level',
    width: 80,
    render: renderEventLevel,
  },
  {
    title: '项目',
    dataIndex: 'project',
    key: 'project',
    width: 140,
    ellipsis: true,
    render: renderProjectList,
  },
  {
    title: '创建时间',
    dataIndex: 'created_at',
    key: 'created_at',
    width: 160,
    sorter: true,
    defaultSortOrder: 'descend',
    render: renderTimestamp,
  },
  {
    title: '更新时间',
    dataIndex: 'updated_at',
    key: 'updated_at',
    width: 160,
    render: renderTimestamp,
  },
  {
    title: '操作',
    key: 'actions',
    width: 120,
    fixed: 'right',
    render: (_: unknown, record: Event) =>
      renderActions({ record, onViewDetail, customActions }),
  },
];
