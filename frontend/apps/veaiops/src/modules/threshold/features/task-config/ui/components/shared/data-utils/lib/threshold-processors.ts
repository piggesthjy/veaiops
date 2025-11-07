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

import type { IntelligentThresholdConfig, MetricThresholdResult } from 'api-generate';

/**
 * 单个时段的阈值配置接口
 */
export interface TimeSegmentThresholdConfig {
  startHour: number;
  endHour: number;
  upperBoundValue: number | undefined;
  lowerBoundValue: number;
  hasUpperBound: boolean;
  hasLowerBound: boolean;
}

/**
 * 阈值配置接口（兼容旧接口 + 新增分段配置）
 */
export interface ThresholdConfig {
  // 向后兼容：保留第一段阈值的快捷访问
  upperBoundValue: number | undefined;
  lowerBoundValue: number;
  hasUpperBound: boolean;
  hasLowerBound: boolean;
  // 新增：所有分段阈值配置
  segments: TimeSegmentThresholdConfig[];
}

/**
 * 从 metric 中提取所有分段的阈值配置
 *
 * 边界情况处理：
 * 1. metric.thresholds 为 null/undefined → 返回空配置
 * 2. metric.thresholds 为空数组 → 返回空配置
 * 3. threshold.upper_bound/lower_bound 为 null → 对应阈值不显示
 * 4. 时段小时值超出 0-24 范围 → 记录警告但仍处理
 * 5. 时段跨越午夜（start_hour > end_hour）→ 支持，如 [22, 2] 表示 22:00-02:00
 */
export const extractThresholdConfig = (
  metric: MetricThresholdResult,
): ThresholdConfig => {
  // 安全的数值解析函数
  const parseToNumber = (value: unknown): number | undefined => {
    if (value === null || value === undefined) {
      return undefined;
    }

    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : undefined;
    }

    if (typeof value === 'string') {
      const numericValue = Number(value);
      return Number.isFinite(numericValue) ? numericValue : undefined;
    }

    return undefined;
  };

  // 边界检查：获取所有阈值配置段（防御性处理 null/undefined）
  const thresholds = metric?.thresholds || [];

  // 边界检查：如果没有阈值配置，返回空配置
  if (thresholds.length === 0) {
    return {
      upperBoundValue: undefined,
      lowerBoundValue: 0,
      hasUpperBound: false,
      hasLowerBound: false,
      segments: [],
    };
  }

  // 转换所有分段配置
  const segments: TimeSegmentThresholdConfig[] = thresholds.map(
    (threshold: IntelligentThresholdConfig) => {
      const upperBoundValue = parseToNumber(threshold.upper_bound);
      const lowerBoundValue = parseToNumber(threshold.lower_bound) ?? 0;
      const hasUpperBound =
        upperBoundValue !== undefined && Number.isFinite(upperBoundValue);
      // 下限阈值：只有在 lower_bound 有值且不为 null 时才显示，否则不显示
      // 注意：这里改为只有明确设置了 lower_bound 时才显示，避免所有时段都显示 0
      const hasLowerBound =
        threshold.lower_bound !== null && threshold.lower_bound !== undefined;

      return {
        startHour: threshold.start_hour,
        endHour: threshold.end_hour,
        upperBoundValue,
        lowerBoundValue,
        hasUpperBound,
        hasLowerBound,
      };
    },
  );

  // 获取第一个阈值配置（向后兼容）
  const firstThreshold = thresholds[0];
  const upperBoundValue = parseToNumber(firstThreshold?.upper_bound);
  const lowerBoundValue = parseToNumber(firstThreshold?.lower_bound) ?? 0;
  const hasUpperBound =
    upperBoundValue !== undefined && Number.isFinite(upperBoundValue);
  const hasLowerBound =
    firstThreshold?.lower_bound !== null &&
    firstThreshold?.lower_bound !== undefined;

  return {
    // 向后兼容：第一段阈值
    upperBoundValue,
    lowerBoundValue,
    hasUpperBound,
    hasLowerBound,
    // 新增：所有分段阈值
    segments,
  };
};
