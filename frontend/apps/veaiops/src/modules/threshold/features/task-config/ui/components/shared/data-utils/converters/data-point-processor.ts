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
import type { TimeseriesDataPoint } from '../../types';
import type { ConversionStats, TimeseriesBackendItem } from '../types';
import { getLabelValue, parseToNumber } from '../utils';

/**
 * 处理单个数据点
 */
export const processDataPoint = ({
  rawTimestamp,
  rawValue,
  seriesIndex,
  dataIndex,
  stats,
  data,
}: {
  rawTimestamp: string | number;
  rawValue: unknown;
  seriesIndex: number;
  dataIndex: number;
  stats: ConversionStats;
  data: TimeseriesDataPoint[];
}): void => {
  // 边界检查：时间戳必须是数字
  if (typeof rawTimestamp !== 'number' || !Number.isFinite(rawTimestamp)) {
    stats.skippedTimestampCount++;
    // ✅ 正确：使用 logger 记录警告
    logger.warn({
      message: `Invalid timestamp at series ${seriesIndex}, index ${dataIndex}`,
      data: { seriesIndex, index: dataIndex, rawTimestamp },
      source: 'DataUtils',
      component: 'processDataPoint',
    });
    return;
  }

  // 边界检查：时间戳范围合理性（1970-2100年之间）
  const MIN_TIMESTAMP = 0; // 1970-01-01
  const MAX_TIMESTAMP = 4102444800; // 2100-01-01
  if (rawTimestamp < MIN_TIMESTAMP || rawTimestamp > MAX_TIMESTAMP) {
    stats.skippedTimestampCount++;
    // ✅ 正确：使用 logger 记录警告
    logger.warn({
      message: `Timestamp out of reasonable range at series ${seriesIndex}, index ${dataIndex}`,
      data: {
        seriesIndex,
        index: dataIndex,
        rawTimestamp,
        MIN_TIMESTAMP,
        MAX_TIMESTAMP,
      },
      source: 'DataUtils',
      component: 'processDataPoint',
    });
    return;
  }

  const timestampDate = new Date(rawTimestamp * 1000);

  // 边界检查：Date 对象必须有效
  if (Number.isNaN(timestampDate.getTime())) {
    stats.skippedTimestampCount++;
    return;
  }

  const timestamp = timestampDate.toISOString();
  stats.totalSamples++;

  const actualValue = parseToNumber(rawValue);

  // 边界检查：值必须是有效数字
  if (actualValue !== undefined) {
    // 边界检查：值的合理性（可选，根据业务需求）
    // 例如：过滤掉异常大的值
    const MAX_REASONABLE_VALUE = Number.MAX_SAFE_INTEGER;
    const MIN_REASONABLE_VALUE = -Number.MAX_SAFE_INTEGER;

    if (
      actualValue >= MIN_REASONABLE_VALUE &&
      actualValue <= MAX_REASONABLE_VALUE
    ) {
      data.push({
        timestamp,
        value: actualValue,
        type: '实际值',
      });
    } else {
      stats.skippedValueCount++;
      // ✅ 正确：使用 logger 记录警告
      logger.warn({
        message: `Value out of reasonable range at series ${seriesIndex}, index ${dataIndex}`,
        data: { seriesIndex, index: dataIndex, actualValue },
        source: 'DataUtils',
        component: 'processDataPoint',
      });
    }
  } else {
    stats.skippedValueCount++;
  }
};

/**
 * 处理时间序列项
 */
export const processTimeseriesItem = ({
  item,
  seriesIndex,
  stats,
  data,
  allTimestamps,
}: {
  item: TimeseriesBackendItem;
  seriesIndex: number;
  stats: ConversionStats;
  data: TimeseriesDataPoint[];
  allTimestamps: Set<string>;
}): void => {
  const { timestamps } = item;
  const { values } = item;
  const labels = item.labels || {};

  // 边界检查：timestamps 和 values 长度可能不一致，取最小值
  const loopLength = Math.min(timestamps.length, values.length);

  if (timestamps.length !== values.length) {
    // ✅ 正确：使用 logger 记录警告
    logger.warn({
      message: `Timestamp and value arrays have different lengths for series ${seriesIndex}`,
      data: {
        seriesIndex,
        timestampsLength: timestamps.length,
        valuesLength: values.length,
      },
      source: 'DataUtils',
      component: 'processTimeseriesItem',
    });
  }

  // 获取标签值
  const hostname = getLabelValue({ obj: labels, key: 'hostname' });
  const itemid = getLabelValue({ obj: labels, key: 'itemid' });
  const instanceId = getLabelValue({ obj: labels, key: 'instance_id' });

  // 边界检查：生成有意义的系列名称（预留，未来可能用于图表系列标识）
  let _seriesIdentifier = '';
  if (hostname) {
    _seriesIdentifier = hostname;
  } else if (itemid) {
    _seriesIdentifier = `ID:${itemid}`;
  } else if (instanceId) {
    _seriesIdentifier = instanceId;
  } else {
    _seriesIdentifier = `series-${seriesIndex + 1}`;
  }

  // 处理每个数据点
  for (let i = 0; i < loopLength; i++) {
    const rawTimestamp = timestamps[i];
    const rawValue = values[i];

    processDataPoint({
      rawTimestamp,
      rawValue,
      seriesIndex,
      dataIndex: i,
      stats,
      data,
    });

    // 记录时间戳到集合中（用于后续添加阈值线）
    if (typeof rawTimestamp === 'number' && Number.isFinite(rawTimestamp)) {
      const timestampDate = new Date(rawTimestamp * 1000);
      if (!Number.isNaN(timestampDate.getTime())) {
        allTimestamps.add(timestampDate.toISOString());
      }
    }
  }
};
