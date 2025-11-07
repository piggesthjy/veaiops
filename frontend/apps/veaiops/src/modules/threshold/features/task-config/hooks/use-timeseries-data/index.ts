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

import type {
  IntelligentThresholdTask,
  MetricThresholdResult,
} from 'api-generate';
import { useMemo } from 'react';
import { useDataFetching } from './hooks/use-data-fetching';
import { prepareRequestParams } from './utils/prepare-params';

/**
 * 时序数据Hook参数接口
 */
export interface UseTimeseriesDataOptions {
  metric?: MetricThresholdResult;
  task?: IntelligentThresholdTask;
  timeRange: [Date, Date];
}

/**
 * 时序数据Hook
 * 提供时序数据的获取和处理功能
 */
export const useTimeseriesData = ({
  metric,
  task,
  timeRange,
}: UseTimeseriesDataOptions) => {
  // 准备请求参数的函数（使用 useMemo 稳定化）
  const prepareParams = useMemo(
    () => () =>
      prepareRequestParams({
        metric,
        task,
        timeRange,
      }),
    [metric, task, timeRange],
  );

  // 使用数据获取Hook
  const { loading, timeseriesData, fetchTimeseriesData } = useDataFetching({
    metric,
    timeRange,
    prepareRequestParams: prepareParams,
  });

  return {
    loading,
    timeseriesData,
    fetchTimeseriesData,
  };
};

// 导出类型
export type { RequestParams } from './types';
export type {
  ValidateInputsParams,
  ValidateTimeRangeParams,
  TimeRangeValidationResult,
  ProcessMetricLabelsParams,
} from './types';
