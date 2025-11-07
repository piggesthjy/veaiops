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

import type { TimeseriesDataPoint } from '../../types';
import { parseToNumber } from '../utils';

/**
 * 处理阈值配置
 */
export const processThresholds = ({
  metric,
}: {
  metric: import('api-generate').MetricThresholdResult;
}): {
  upperBoundValue: number | undefined;
  lowerBoundValue: number;
  hasUpperBound: boolean;
  hasLowerBound: boolean;
} => {
  // 获取阈值配置
  const firstThreshold = metric.thresholds?.[0];

  const upperBoundValue = parseToNumber(firstThreshold?.upper_bound);
  // 下限阈值未设置时默认为0
  const lowerBoundValue = parseToNumber(firstThreshold?.lower_bound) ?? 0;
  const hasUpperBound =
    upperBoundValue !== undefined && Number.isFinite(upperBoundValue);
  // 下限阈值始终显示（未设置时默认为0）
  const hasLowerBound = true;

  return {
    upperBoundValue,
    lowerBoundValue,
    hasUpperBound,
    hasLowerBound,
  };
};

/**
 * 为所有唯一的时间戳添加阈值线
 */
export const addThresholdLines = ({
  allTimestamps,
  hasUpperBound,
  hasLowerBound,
  upperBoundValue,
  lowerBoundValue,
  data,
}: {
  allTimestamps: Set<string>;
  hasUpperBound: boolean;
  hasLowerBound: boolean;
  upperBoundValue: number | undefined;
  lowerBoundValue: number;
  data: TimeseriesDataPoint[];
}): void => {
  allTimestamps.forEach((timestamp) => {
    if (hasUpperBound && upperBoundValue !== undefined) {
      data.push({
        timestamp,
        value: upperBoundValue,
        type: '上阈值',
      });
    }

    if (hasLowerBound) {
      data.push({
        timestamp,
        value: lowerBoundValue,
        type: '下阈值',
      });
    }
  });
};
