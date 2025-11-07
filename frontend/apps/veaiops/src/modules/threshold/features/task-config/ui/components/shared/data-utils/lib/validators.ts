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

import { logger } from '@veaiops/utils';

/**
 * 后端返回的时序数据项结构
 * 支持多个数据源（Volcengine、Aliyun、Zabbix）的通用格式
 */
export interface TimeseriesBackendItem {
  timestamps: Array<string | number>;
  values: Array<number | string | null>;
  labels?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * 验证时间序列项的有效性
 */
export const validateTimeseriesItem = (
  item: unknown,
): item is TimeseriesBackendItem => {
  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    return false;
  }

  const typedItem = item as TimeseriesBackendItem;

  // timestamps 和 values 必须是数组
  if (
    !Array.isArray(typedItem.timestamps) ||
    !Array.isArray(typedItem.values)
  ) {
    return false;
  }

  // 至少要有一个数据点
  if (typedItem.timestamps.length === 0 || typedItem.values.length === 0) {
    return false;
  }

  return true;
};

/**
 * 安全的数值解析函数
 */
export const parseToNumber = (value: unknown): number | undefined => {
  if (value === null || value === undefined) {
    return undefined;
  }

  // 边界检查：已经是数字
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }

  // 边界检查：字符串转数字
  if (typeof value === 'string') {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : undefined;
  }

  return undefined;
};

/**
 * 验证时间戳的有效性
 */
export const validateTimestamp = (rawTimestamp: unknown): boolean => {
  if (typeof rawTimestamp !== 'number' || !Number.isFinite(rawTimestamp)) {
    return false;
  }

  // 边界检查：时间戳范围合理性（1970-2100年之间）
  const MIN_TIMESTAMP = 0; // 1970-01-01
  const MAX_TIMESTAMP = 4102444800; // 2100-01-01
  if (rawTimestamp < MIN_TIMESTAMP || rawTimestamp > MAX_TIMESTAMP) {
    return false;
  }

  return true;
};

/**
 * 验证值的合理性
 */
export const validateValueRange = (value: number): boolean => {
  const MAX_REASONABLE_VALUE = Number.MAX_SAFE_INTEGER;
  const MIN_REASONABLE_VALUE = -Number.MAX_SAFE_INTEGER;

  return (
    value >= MIN_REASONABLE_VALUE && value <= MAX_REASONABLE_VALUE
  );
};
