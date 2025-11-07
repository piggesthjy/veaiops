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
 * 注意：Agent 类型相关常量已迁移到 agent.ts
 * 请从 '@veaiops/constants' 统一导入
 * 为避免重复导出，此处不再导出（已在 index.ts 中通过 export * from './agent' 导出）
 */

/**
 * ⚠️ 注意：EventStatus 枚举已迁移到 @veaiops/api-client
 *
 * ✅ 单一数据源原则：请直接从 @veaiops/api-client 导入，不通过 @veaiops/constants 中转
 *
 * 使用方式：
 * ```typescript
 * import { EventStatus } from '@veaiops/api-client';
 * // 或向后兼容路径
 * import { EventStatus } from 'api-generate';
 * ```
 *
 * 对应关系：
 * - OpenAPI 规范（event-center.json）: 使用 x-enum-varnames 定义语义化键名
 * - 生成的 TypeScript 枚举（@veaiops/api-client/models/event-status.ts）: 自动生成语义化枚举
 * - Python 后端枚举（veaiops/schema/types.py）: EventStatus 枚举
 *
 * 枚举值映射：
 * - INITIAL (0) ↔ Python EventStatus.INITIAL
 * - SUBSCRIBED (1) ↔ Python EventStatus.SUBSCRIBED
 * - CARD_BUILT (2) ↔ Python EventStatus.CARD_BUILT
 * - DISTRIBUTED (3) ↔ Python EventStatus.DISPATCHED
 * - NO_DISTRIBUTION (4) ↔ Python EventStatus.NONE_DISPATCH
 * - CHATOPS_NO_MATCH (11) ↔ Python EventStatus.CHATOPS_NOT_MATCHED
 * - CHATOPS_RULE_FILTERED (12) ↔ Python EventStatus.CHATOPS_RULE_FILTERED
 * - CHATOPS_RULE_LIMITED (13) ↔ Python EventStatus.CHATOPS_RULE_RESTRAINED
 *
 * ⚠️ 维护说明：
 * - 如需修改枚举值或键名，请修改 OpenAPI 规范（event-center.json）中的 x-enum-varnames
 * - 修改后运行 `pnpm generate:api` 重新生成
 * - 禁止在此处手动定义或重新导出 EventStatus
 */

/**
 * 事件状态选项
 * 对应后端 EventStatus 枚举
 * 注意：从应用内迁移，包含完整的事件状态定义
 */
export const EVENT_STATUS_OPTIONS = [
  { label: '初始化', value: 0, extra: { color: 'gray' } },
  { label: '已订阅', value: 1, extra: { color: 'blue' } },
  { label: '已构建卡片', value: 2, extra: { color: 'cyan' } },
  { label: '已分发', value: 3, extra: { color: 'green' } },
  { label: '无分发', value: 4, extra: { color: 'orange' } },
  { label: 'ChatOps未匹配', value: 11, extra: { color: 'red' } },
  { label: 'ChatOps规则过滤', value: 12, extra: { color: 'purple' } },
  { label: 'ChatOps规则限制', value: 13, extra: { color: 'magenta' } },
] as const;

/**
 * 事件状态映射
 */
export const EVENT_STATUS_MAP = EVENT_STATUS_OPTIONS.reduce(
  (acc, cur) => {
    acc[cur.value] = cur;
    return acc;
  },
  {} as Record<number, (typeof EVENT_STATUS_OPTIONS)[number]>,
);

/**
 * 事件类型选项
 */
export const EVENT_TYPE_OPTIONS = [
  { label: '系统告警', value: 'system_alert' },
  { label: '应用异常', value: 'app_exception' },
  { label: '性能告警', value: 'performance_alert' },
  { label: '安全事件', value: 'security_event' },
  { label: '业务异常', value: 'business_exception' },
  { label: '基础设施告警', value: 'infrastructure_alert' },
] as const;

/**
 * 优先级选项
 */
export const PRIORITY_OPTIONS = [
  { label: '紧急', value: 'critical', color: 'red' },
  { label: '高', value: 'high', color: 'orange' },
  { label: '中', value: 'medium', color: 'blue' },
  { label: '低', value: 'low', color: 'gray' },
] as const;
