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
 * ⚠️ 注意：EventLevel 枚举定义在 @veaiops/api-client
 *
 * ✅ 单一数据源原则：
 * - EventLevel 枚举从 @veaiops/api-client 导入（不在此处重新导出，避免中转）
 * - EVENT_LEVEL_OPTIONS 等配置常量在此处定义（UI 展示配置）
 *
 * 使用方式：
 * ```typescript
 * // 导入枚举
 * import { EventLevel } from '@veaiops/api-client';
 * // 导入配置常量
 * import { EVENT_LEVEL_OPTIONS } from '@veaiops/constants';
 *
 * // 使用枚举值
 * const level = EventLevel.P0;
 * // 查找配置
 * const config = EVENT_LEVEL_OPTIONS.find(opt => opt.value === EventLevel.P0);
 * ```
 */

// ✅ 作为使用方，导入 EventLevel 用于类型定义和值比较
import { EventLevel } from '@veaiops/api-client';

/**
 * 事件级别选项配置（带颜色和中文标签）
 *
 * 注意：value 值使用 EventLevel 枚举
 */
export const EVENT_LEVEL_OPTIONS = [
  { label: 'P0', value: EventLevel.P0, extra: { color: 'red' } },
  { label: 'P1', value: EventLevel.P1, extra: { color: 'orange' } },
  { label: 'P2', value: EventLevel.P2, extra: { color: 'blue' } },
] as const;

/**
 * 事件级别映射表
 * 用于快速查找配置
 */
export const EVENT_LEVEL_MAP = EVENT_LEVEL_OPTIONS.reduce(
  (acc, cur) => {
    acc[cur.value] = cur;
    return acc;
  },
  {} as Record<EventLevel, (typeof EVENT_LEVEL_OPTIONS)[number]>,
);

/**
 * 事件级别颜色映射
 */
export const EVENT_LEVEL_COLOR_MAP: Record<EventLevel, string> = {
  [EventLevel.P0]: 'red',
  [EventLevel.P1]: 'orange',
  [EventLevel.P2]: 'blue',
};

/**
 * 事件级别文本映射
 */
export const EVENT_LEVEL_TEXT_MAP: Record<EventLevel, string> = {
  [EventLevel.P0]: 'P0',
  [EventLevel.P1]: 'P1',
  [EventLevel.P2]: 'P2',
};
