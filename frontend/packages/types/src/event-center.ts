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
 * 事件中心相关类型定义
 * 基于 api-generate 类型，避免重复定义
 */

// 注意：api-generate 位于 apps/veaiops 中，packages 不应该直接依赖
// 这里使用类型别名，实际类型从 api-generate 导入

/**
 * 智能体类型枚举
 */
export type AgentType =
  | 'chatops_interest_agent'
  | 'chatops_proactive_reply_agent'
  | 'chatops_reactive_reply_agent'
  | 'intelligent_threshold_agent';

/**
 * 事件级别枚举
 */
export type EventLevel = 'P0' | 'P1' | 'P2';

// Event 类型需要从 api-generate 导入，这里只定义接口
export interface Event {
  _id?: string;
  event_id?: string;
  agent_type: AgentType;
  event_level: EventLevel;
  region?: string[];
  project?: string[];
  product?: string[];
  customer?: string[];
  raw_data: Record<string, unknown>;
  datasource_type: string;
  channel_msg?: Record<string, unknown>;
  status?: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * 事件查询参数
 * 对齐后端 API 参数（使用复数形式：projects, products, customers）
 */
export interface EventQueryParams {
  agentType?: AgentType | AgentType[];
  eventLevel?: EventLevel;
  status?: number[];
  region?: string[];
  projects?: string[];
  products?: string[];
  customers?: string[];
  startTime?: string;
  endTime?: string;
  skip?: number;
  limit?: number;
}

/**
 * 事件过滤器类型
 * 用于前端筛选表单（使用复数形式：projects, products, customers）
 */
export interface EventFilters {
  agentType?: AgentType[];
  eventLevel?: EventLevel | '';
  status?: number[];
  region?: string[];
  projects?: string[];
  products?: string[];
  customers?: string[];
  dateRange?: [string, string];
}

/**
 * 事件表格数据类型
 * 直接使用 api-generate 的 Event 类型
 */
export type EventTableData = Event;
