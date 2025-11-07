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

import { ensureArray } from '@veaiops/utils';
import type { StrategyIdItem } from './types';

/**
 * 从策略ID项中提取字符串ID
 *
 * 处理三种类型的输入：
 * 1. 对象类型：{ id: "xxx", collection: "xxx" }
 * 2. 字符串类型："xxx"
 * 3. 数字类型：123
 *
 * @param item - 可能是字符串、数字或包含id的对象
 * @returns 提取的字符串ID，如果无法提取则返回空字符串
 *
 * @example
 * ```ts
 * extractStrategyId({ id: "123" }) // "123"
 * extractStrategyId("456") // "456"
 * extractStrategyId(789) // "789"
 * extractStrategyId(null) // ""
 * extractStrategyId({ id: "  123  " }) // "123" (自动trim)
 * ```
 */
export const extractStrategyId = (item: StrategyIdItem): string => {
  // 处理 null 和 undefined
  if (item == null) {
    return '';
  }

  // 处理对象类型：{ id: "xxx", collection: "xxx" }
  if (typeof item === 'object' && 'id' in item && item.id != null) {
    return String(item.id).trim();
  }

  // 处理字符串和数字类型
  if (typeof item === 'string' || typeof item === 'number') {
    return String(item).trim();
  }

  // 其他类型返回空字符串
  return '';
};

/**
 * 规范化策略ID数组
 *
 * 将各种格式的策略ID数组转换为字符串数组，自动处理以下情况：
 * - 对象数组：提取id字段
 * - 混合类型数组：统一转换为字符串
 * - 单个值：转换为单元素数组
 * - null/undefined：返回空数组
 * - 过滤掉空字符串和无效值
 *
 * @param strategyIds - 原始策略ID数据（可能是数组、单个值或null）
 * @returns 规范化后的字符串数组
 *
 * @example
 * ```ts
 * // 处理对象数组
 * normalizeStrategyIds([{ id: "123" }, { id: "456" }])
 * // ["123", "456"]
 *
 * // 处理混合类型
 * normalizeStrategyIds(["123", 456, null, { id: "789" }])
 * // ["123", "456", "789"]
 *
 * // 处理空值
 * normalizeStrategyIds(null) // []
 * normalizeStrategyIds([]) // []
 *
 * // 处理单个值
 * normalizeStrategyIds("123") // ["123"]
 * ```
 */
export const normalizeStrategyIds = (strategyIds: unknown): string[] => {
  return ensureArray(strategyIds)
    .map((item) => extractStrategyId(item as StrategyIdItem))
    .filter((id) => id.length > 0);
};
