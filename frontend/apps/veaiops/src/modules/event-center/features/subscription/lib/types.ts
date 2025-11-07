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
 * 事件中心订阅规则相关类型定义
 *
 * 优化说明：
 * - 优先使用 api-generate 中的类型：SubscribeRelationWithAttributes, SubscribeRelationCreate, SubscribeRelationUpdate
 * - 以下类型仅保留用于兼容旧代码，新代码应使用 api-generate 中的类型
 */

// 优先使用 api-generate 中的类型
export type {
  SubscribeRelationWithAttributes,
  SubscribeRelationCreate,
  SubscribeRelationUpdate,
} from "api-generate";

/**
 * @deprecated 已废弃，请使用 api-generate 中的 SubscribeRelationWithAttributes
 *
 * 如果需要自定义字段，请基于 SubscribeRelationWithAttributes 扩展：
 * ```typescript
 * interface CustomSubscriptionData extends SubscribeRelationWithAttributes {
 *   // 仅添加前端特有字段
 *   customField?: string;
 * }
 * ```
 */
export interface SubscriptionRule {
  id: string;
  name: string;
  description?: string;
  event_types: string[];
  filter_conditions: FilterCondition[];
  notification_config: NotificationConfig;
  enabled: boolean;
  priority: number;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

export interface FilterCondition {
  field: string;
  operator: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "contains" | "regex";
  value: string | number | boolean;
  logic_operator?: "and" | "or";
}

export interface NotificationConfig {
  channels: NotificationChannel[];
  template_id?: string;
  custom_template?: string;
  throttle_config?: ThrottleConfig;
}

export interface NotificationChannel {
  type: "email" | "sms" | "webhook" | "lark" | "dingtalk";
  config: Record<string, any>;
  enabled: boolean;
}

export interface ThrottleConfig {
  enabled: boolean;
  interval: number; // 秒
  max_count: number;
}

/**
 * 订阅规则表格数据类型
 * @deprecated 建议直接使用 SubscribeRelationWithAttributes 类型（来自 api-generate）
 */
export type SubscriptionRuleTableData = SubscriptionRule;

export interface SubscriptionRuleCreateRequest {
  name: string;
  description?: string;
  event_types: string[];
  filter_conditions: FilterCondition[];
  notification_config: NotificationConfig;
  enabled?: boolean;
  priority?: number;
}

/**
 * @deprecated 已废弃，请使用 api-generate 中的 SubscribeRelationUpdate
 */
export interface SubscriptionRuleUpdateRequest {
  name?: string;
  description?: string;
  event_types?: string[];
  filter_conditions?: FilterCondition[];
  notification_config?: NotificationConfig;
  enabled?: boolean;
  priority?: number;
}

/**
 * 订阅规则查询参数
 * 如果 api-generate 中有对应类型应替换
 */
export interface SubscriptionRuleQuery {
  name?: string;
  event_types?: string[];
  enabled?: boolean;
  current?: number;
  pageSize?: number;
}
