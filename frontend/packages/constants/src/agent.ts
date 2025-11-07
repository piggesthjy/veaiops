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
 * Agent 类型相关常量定义
 * 统一的 Agent 类型配置，供全局使用
 */

/**
 * ⚠️ 注意：AgentType 枚举定义在 @veaiops/api-client
 *
 * ✅ 单一数据源原则：
 * - AgentType 枚举从 @veaiops/api-client 导入（不在此处重新导出，避免中转）
 * - AGENT_TYPE_OPTIONS 等配置常量在此处定义（UI 展示配置）
 *
 * 使用方式：
 * ```typescript
 * // 导入枚举
 * import { AgentType } from '@veaiops/api-client';
 * // 导入配置常量
 * import { AGENT_TYPE_OPTIONS } from '@veaiops/constants';
 *
 * // 使用枚举值
 * const type = AgentType.CHATOPS_INTEREST_AGENT;
 * // 查找配置
 * const config = AGENT_TYPE_OPTIONS.find(opt => opt.value === AgentType.CHATOPS_INTEREST_AGENT);
 * ```
 */

// ✅ 作为使用方，导入 AgentType 用于类型定义和值比较
import { AgentType } from '@veaiops/api-client';

/**
 * Agent 类型选项配置（带颜色和中文标签）
 *
 * 注意：value 值使用 AgentType 枚举
 */
export const AGENT_TYPE_OPTIONS = [
  {
    label: '内容识别Agent',
    value: AgentType.CHATOPS_INTEREST_AGENT,
    color: 'blue',
  },
  {
    label: '主动回复Agent',
    value: AgentType.CHATOPS_PROACTIVE_REPLY_AGENT,
    color: 'green',
  },
  {
    label: '被动回复Agent',
    value: AgentType.CHATOPS_REACTIVE_REPLY_AGENT,
    color: 'orange',
  },
  {
    label: '智能阈值Agent',
    value: AgentType.INTELLIGENT_THRESHOLD_AGENT,
    color: 'purple',
  },
] as const;

/**
 * Agent 类型映射
 */
export const AGENT_TYPE_MAP = AGENT_TYPE_OPTIONS.reduce(
  (acc, cur) => {
    acc[cur.value] = cur;
    return acc;
  },
  {} as Record<AgentType, (typeof AGENT_TYPE_OPTIONS)[number]>,
);

/**
 * Agent 过滤选项（不包含智能阈值）
 */
export const AGENT_OPTIONS_FILTER = AGENT_TYPE_OPTIONS.filter(
  (item) => item.value !== AgentType.INTELLIGENT_THRESHOLD_AGENT,
);

/**
 * 智能阈值筛选选项
 */
export const AGENT_OPTIONS_THRESHOLD_FILTER = AGENT_TYPE_OPTIONS.filter(
  (item) => item.value === AgentType.INTELLIGENT_THRESHOLD_AGENT,
);

/**
 * 事件中心订阅选项
 */
export const AGENT_OPTIONS_EVENT_CENTER_SUBSCRIPTION =
  AGENT_TYPE_OPTIONS.filter(
    (item) =>
      item.value === AgentType.CHATOPS_INTEREST_AGENT ||
      item.value === AgentType.INTELLIGENT_THRESHOLD_AGENT,
  );

/**
 * Oncall 订阅选项
 */
export const AGENT_OPTIONS_ONCALL_SUBSCRIPTION = AGENT_TYPE_OPTIONS.filter(
  (item) => item.value === AgentType.CHATOPS_INTEREST_AGENT,
);

/**
 * Oncall 历史选项
 */
export const AGENT_OPTIONS_ONCALL_HISTORY = AGENT_TYPE_OPTIONS.filter(
  (item) => item.value !== AgentType.INTELLIGENT_THRESHOLD_AGENT,
);

/**
 * 事件中心历史选项（全部）
 */
export const AGENT_OPTIONS_EVENT_CENTER_HISTORY = AGENT_TYPE_OPTIONS;
