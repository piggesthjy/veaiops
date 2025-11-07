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
 * Oncall 模块类型定义
 * 与 openapi-specs/modules/oncall.json 保持一致
 */

// ============================================================
// Interest Rule 相关类型（主要规则类型）
// ============================================================

/**
 * 告警等级枚举
 */
export type AlertLevel = 'P0' | 'P1' | 'P2';

/**
 * 规则行为类别
 */
export type ActionCategory = 'Detect' | 'Filter';

/**
 * 规则检查类别
 */
export type InspectCategory = 'Semantic' | 'RE';

/**
 * Interest Rule（Oncall 规则）
 * 对应 API: Interest schema
 */
export interface OncallRule {
  /** 规则ID */
  _id: string;
  /** 规则名称 */
  name: string;
  /** 规则描述 */
  description?: string;
  /** 告警等级 */
  level?: AlertLevel;
  /** 正面示例 */
  examples_positive?: string[];
  /** 反面示例 */
  examples_negative?: string[];
  /** 行为类别 */
  action_category: ActionCategory;
  /** 检查类别 */
  inspect_category: InspectCategory;
  /** 正则表达式（当 inspect_category 为 'RE' 时使用） */
  regular_expression?: string;
  /** 检查历史消息数量 */
  inspect_history?: number;
  /** 告警抑制间隔 */
  silence_delta?: string;
  /** 是否激活 */
  is_active?: boolean;
  /** 创建时间 */
  created_at?: string;
  /** 更新时间 */
  updated_at?: string;
  /** 版本号 */
  version?: number;
}

/**
 * 规则更新请求
 * 对应 API: InterestUpdateRequest schema
 */
export interface OncallRuleUpdateRequest {
  /** 规则名称 */
  name?: string;
  /** 描述 */
  description?: string;
  /** 告警等级 */
  level?: AlertLevel;
  /** 告警抑制间隔 */
  silence_delta?: string;
  /** 是否启用状态 */
  is_active?: boolean;
  /** 正面示例（当检测类别为语义分析时可编辑） */
  examples_positive?: string[];
  /** 反面示例（当检测类别为语义分析时可编辑） */
  examples_negative?: string[];
  /** 正则表达式（当检测类别为正则表达式时可编辑） */
  regular_expression?: string;
}

// ============================================================
// Oncall Schedule 相关类型（值班计划）
// ============================================================

/**
 * 值班计划类型
 */
export type ScheduleType = 'daily' | 'weekly' | 'monthly' | 'custom';

/**
 * 值班参与者联系信息
 */
export interface ParticipantContactInfo {
  /** 电话 */
  phone?: string;
  /** 邮箱 */
  email?: string;
  /** 聊天ID */
  chat_id?: string;
}

/**
 * 值班参与者
 */
export interface OncallParticipant {
  /** 用户ID */
  user_id: string;
  /** 用户名 */
  user_name: string;
  /** 联系信息 */
  contact_info?: ParticipantContactInfo;
  /** 优先级 */
  priority?: number;
}

/**
 * 值班计划配置
 */
export interface OncallScheduleConfig {
  /** 轮换间隔（小时） */
  rotation_interval?: number;
  /** 开始时间 */
  start_time?: string;
  /** 结束时间 */
  end_time?: string;
  /** 时区 */
  timezone?: string;
  /** 工作日（0=周日，6=周六） */
  weekdays?: number[];
}

// Note: ScheduleConfig is defined in event-center module
// Use OncallScheduleConfig directly for oncall-specific scheduling

/**
 * 升级级别
 */
export interface EscalationLevel {
  /** 级别 */
  level?: number;
  /** 参与者 */
  participants?: string[];
  /** 超时时间 */
  timeout?: number;
}

/**
 * 升级策略
 */
export interface EscalationPolicy {
  /** 是否启用升级 */
  enabled?: boolean;
  /** 升级超时时间（分钟） */
  escalation_timeout?: number;
  /** 升级级别配置 */
  escalation_levels?: EscalationLevel[];
}

/**
 * 值班计划
 * 对应 API: OncallSchedule schema
 */
export interface OncallSchedule {
  /** 值班计划ID */
  id?: string;
  /** 关联的规则ID */
  rule_id: string;
  /** 值班计划名称 */
  name: string;
  /** 值班计划描述 */
  description?: string;
  /** 值班计划类型 */
  schedule_type: ScheduleType;
  /** 值班参与者列表 */
  participants: OncallParticipant[];
  /** 值班计划配置 */
  schedule_config: OncallScheduleConfig;
  /** 升级策略 */
  escalation_policy?: EscalationPolicy;
  /** 是否激活 */
  is_active?: boolean;
  /** 生效开始时间 */
  effective_start?: string;
  /** 生效结束时间 */
  effective_end?: string;
  /** 创建时间 */
  created_at?: string;
  /** 更新时间 */
  updated_at?: string;
}

/**
 * 值班计划创建请求
 * 对应 API: OncallScheduleCreateRequest schema
 */
export interface OncallScheduleCreateRequest {
  /** 值班计划名称 */
  name: string;
  /** 值班计划描述 */
  description?: string;
  /** 值班计划类型 */
  schedule_type: ScheduleType;
  /** 值班参与者列表 */
  participants: OncallParticipant[];
  /** 值班计划配置 */
  schedule_config: OncallScheduleConfig;
  /** 升级策略 */
  escalation_policy?: EscalationPolicy;
  /** 生效开始时间 */
  effective_start?: string;
  /** 生效结束时间 */
  effective_end?: string;
}

/**
 * 值班计划更新请求
 * 对应 API: OncallScheduleUpdateRequest schema
 */
export interface OncallScheduleUpdateRequest {
  /** 值班计划名称 */
  name?: string;
  /** 值班计划描述 */
  description?: string;
  /** 值班参与者列表 */
  participants?: OncallParticipant[];
  /** 值班计划配置 */
  schedule_config?: any; // ScheduleConfig 类型暂时未定义
  /** 升级策略 */
  escalation_policy?: EscalationPolicy;
  /** 是否激活 */
  is_active?: boolean;
  /** 生效开始时间 */
  effective_start?: string;
  /** 生效结束时间 */
  effective_end?: string;
}

// ============================================================
// API 请求参数类型
// ============================================================

/**
 * 获取 Oncall 规则列表的参数
 */
export interface GetOncallRulesParams {
  /** 渠道 */
  channel: string;
  /** 机器人ID */
  bot_id: string;
}

/**
 * 获取值班计划列表的参数
 */
export interface GetOncallSchedulesParams {
  /** 渠道 */
  channel: string;
  /** 机器人ID */
  bot_id: string;
  /** 跳过数量 */
  skip?: number;
  /** 限制数量 */
  limit?: number;
  /** 开始时间 */
  start_time?: string;
  /** 结束时间 */
  end_time?: string;
}
