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
import type { MetricThresholdResult } from 'api-generate';
import type { TimeseriesDataPoint } from '../types';
import { extractThresholdConfig } from './lib/threshold-processors';
import { validateTimeseriesItem } from './lib/validators';
import type { TimeseriesBackendItem } from './lib/validators';
import { addThresholdLines, processTimeseriesItem } from './utils';

/**
 * 转换后端返回的时序数据为图表所需格式的参数接口
 */
export interface ConvertTimeseriesDataParams {
  backendData: TimeseriesBackendItem[];
  metric: MetricThresholdResult;
}

/**
 * 转换后端返回的时序数据为图表所需格式
 *
 * @param params - 包含 backendData 和 metric 的参数对象
 * @returns 转换后的图表数据点数组
 */
export const convertTimeseriesData = ({
  backendData,
  metric,
}: ConvertTimeseriesDataParams): TimeseriesDataPoint[] => {
  const data: TimeseriesDataPoint[] = [];

  // 统计信息（用于调试和监控）
  let totalSamples = 0;
  const skippedValueCount = 0;
  const skippedTimestampCount = 0;
  let invalidItemCount = 0;

  // 边界检查：metric 必须存在
  if (!metric) {
    // ✅ 正确：使用 logger 记录错误
    logger.error({
      message: 'metric is required',
      data: {},
      source: 'DataUtils',
      component: 'convertTimeseriesData',
    });
    return [];
  }

  // 边界检查：backendData 必须是数组
  if (!Array.isArray(backendData)) {
    // ✅ 正确：使用 logger 记录错误
    logger.error({
      message: 'backendData must be an array',
      data: { backendDataType: typeof backendData },
      source: 'DataUtils',
      component: 'convertTimeseriesData',
    });
    return [];
  }

  // 边界检查：空数组直接返回
  if (backendData.length === 0) {
    // ✅ 正确：使用 logger 记录信息
    logger.info({
      message: 'backendData is empty',
      data: {},
      source: 'DataUtils',
      component: 'convertTimeseriesData',
    });
    return [];
  }

  // 提取阈值配置
  const thresholdConfig = extractThresholdConfig(metric);

  // 用于存储所有唯一的时间戳，用于添加阈值线
  const allTimestamps = new Set<string>();

  // 边界检查：验证每个时间序列项的有效性
  backendData.forEach((item, seriesIndex) => {
    if (!validateTimeseriesItem(item)) {
      invalidItemCount++;
      return;
    }

    const itemData = processTimeseriesItem({
      item,
      seriesIndex,
      thresholdConfig,
      allTimestamps,
    });

    data.push(...itemData);
    totalSamples += item.timestamps.length;
  });

  // 边界检查：如果所有数据都被跳过了
  if (allTimestamps.size === 0) {
    // ✅ 正确：使用 logger 记录警告
    logger.warn({
      message: 'All timestamps were skipped',
      data: {
        totalSamples,
        skippedTimestamps: skippedTimestampCount,
        skippedValues: skippedValueCount,
        invalidItems: invalidItemCount,
      },
      source: 'DataUtils',
      component: 'convertTimeseriesData',
    });
    return [];
  }

  // 为所有唯一的时间戳添加阈值线
  const thresholdData = addThresholdLines({
    allTimestamps,
    thresholdConfig,
  });
  data.push(...thresholdData);

  // 边界检查：最终数据不应为空
  if (data.length === 0) {
    // ✅ 正确：使用 logger 记录警告
    logger.warn({
      message: 'Final data array is empty after processing',
      data: {},
      source: 'DataUtils',
      component: 'convertTimeseriesData',
    });
    return [];
  }

  // 按时间戳排序
  try {
    const sortedData = data.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();

      // 边界检查：排序时处理 NaN
      if (Number.isNaN(timeA) || Number.isNaN(timeB)) {
        // ✅ 正确：使用 logger 记录错误
        logger.error({
          message: 'Invalid timestamp during sorting',
          data: {
            timestampA: a.timestamp,
            timestampB: b.timestamp,
            timeA,
            timeB,
          },
          source: 'DataUtils',
          component: 'convertTimeseriesData',
        });
        return 0;
      }

      return timeA - timeB;
    });

    // 输出统计信息
    if (
      skippedValueCount > 0 ||
      skippedTimestampCount > 0 ||
      invalidItemCount > 0
    ) {
      // ✅ 正确：使用 logger 记录信息
      logger.info({
        message: 'convertTimeseriesData completed with warnings',
        data: {
          totalSamples,
          skippedTimestamps: skippedTimestampCount,
          skippedValues: skippedValueCount,
          invalidItems: invalidItemCount,
          finalDataPoints: sortedData.length,
          uniqueTimestamps: allTimestamps.size,
        },
        source: 'DataUtils',
        component: 'convertTimeseriesData',
      });
    }

    return sortedData;
  } catch (sortError: unknown) {
    // ✅ 正确：使用 logger 记录错误，并透出实际错误信息
    const errorObj =
      sortError instanceof Error ? sortError : new Error(String(sortError));
    logger.error({
      message: 'Error during sorting',
      data: {
        error: errorObj.message,
        stack: errorObj.stack,
        errorObj,
      },
      source: 'DataUtils',
      component: 'convertTimeseriesData',
    });
    // 如果排序失败，返回未排序的数据
    return data;
  }
};
