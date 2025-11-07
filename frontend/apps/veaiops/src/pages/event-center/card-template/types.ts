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

/**
 * 卡片模版管理相关类型定义

 */

// 导入生成的API类型
import type { AgentTemplate, ChannelType } from 'api-generate';

/**
 * Agent类型枚举 - 基于生成的API类型
 */
export type AgentType = 'CHATOPS' | 'INTELLIGENT_THRESHOLD' | 'ONCALL';

export const AGENT_TYPE_OPTIONS = [
  {
    label: '内容识别Agent',
    value: 'chatops_interest_agent',
    color: 'blue',
  },
  {
    label: '主动回复Agent',
    value: 'chatops_proactive_reply_agent',
    color: 'green',
  },
  {
    label: '被动回复Agent',
    value: 'chatops_reactive_reply_agent',
    color: 'orange',
  },
  {
    label: '智能阈值Agent',
    value: 'intelligent_threshold_agent',
    color: 'purple',
  },
];

// 原有的过滤选项（排除智能阈值Agent）- 用于某些场景
export const AGENT_OPTIONS_FILTER = AGENT_TYPE_OPTIONS.filter(
  (item) => item.value !== 'intelligent_threshold_agent',
);

// 仅智能阈值Agent选项 - 用于智能阈值模块
export const AGENT_OPTIONS_THRESHOLD_FILTER = AGENT_TYPE_OPTIONS.filter(
  (item) => item.value === 'intelligent_threshold_agent',
);

// 事件中心订阅管理：仅 内容识别Agent 和 智能阈值Agent
export const AGENT_OPTIONS_EVENT_CENTER_SUBSCRIPTION =
  AGENT_TYPE_OPTIONS.filter(
    (item) =>
      item.value === 'chatops_interest_agent' ||
      item.value === 'intelligent_threshold_agent',
  );

// Oncall订阅管理：仅 内容识别Agent
export const AGENT_OPTIONS_ONCALL_SUBSCRIPTION = AGENT_TYPE_OPTIONS.filter(
  (item) => item.value === 'chatops_interest_agent',
);

// Oncall历史事件：内容识别、被动回复、主动回复Agent（排除智能阈值）
export const AGENT_OPTIONS_ONCALL_HISTORY = AGENT_TYPE_OPTIONS.filter(
  (item) => item.value !== 'intelligent_threshold_agent',
);

// 事件中心历史事件：所有Agent类型
export const AGENT_OPTIONS_EVENT_CENTER_HISTORY = AGENT_TYPE_OPTIONS;

export const AGENT_TYPE_MAP = AGENT_TYPE_OPTIONS.reduce(
  (acc, cur) => {
    acc[cur.value] = cur;
    return acc;
  },
  {} as Record<string, { label: string; value: string; color: string }>,
);

/**
 * Agent模版记录接口 - 扩展生成的API类型
 */
export interface AgentTemplateRecord extends AgentTemplate {
  [key: string]: unknown; // 添加索引签名以满足BaseRecord约束
}

/**
 * Agent模版查询参数
 */
export interface AgentTemplateQuery {
  /** Agent类型筛选 */
  agents?: string[];
  /** 通道类型筛选 */
  channels?: ChannelType[];
  /** 模版ID搜索 */
  templateId?: string;
  /** 模版名称搜索 */
  name?: string;
  /** 是否启用 */
  is_active?: boolean;
  /** 创建时间范围 */
  createTimeRanges?: number[];
  /** 分页参数 */
  skip?: number;
  /** 每页大小 */
  limit?: number;
}

/**
 * 引导步骤类型
 */
export interface GuideStep {
  /** 步骤标题 */
  title: string;
  /** 步骤描述 */
  description: string;
  /** 步骤图标 */
  icon?: React.ReactNode;
  /** 是否完成 */
  completed?: boolean;
  /** 操作按钮 */
  action?: {
    text: string;
    onClick: () => void;
  };
}
