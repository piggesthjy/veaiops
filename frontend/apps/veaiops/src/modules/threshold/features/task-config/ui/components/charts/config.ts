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

import type { LineConfig } from '@ant-design/plots';
import { formatDateTime } from '@veaiops/utils';
import type { TimeseriesDataPoint } from '../shared/types';
import { COLOR_MAP, SERIES_ALIAS_MAP } from './constants';
import type { AxisDensityOptions } from './types';

/**
 * 生成时序图表配置
 */
export const getChartConfig = (
  data: TimeseriesDataPoint[],
  options: AxisDensityOptions = {},
): LineConfig => {
  const uniqueTimestamps = Array.from(
    new Set(data.map((d) => String(d.timestamp))),
  );
  const MAX_TICKS = options.maxXTicks ?? 8;
  const MIN_TICKS = 3; // 最少显示3个刻度
  // 计算实际刻度数：不低于最小值，不超过最大值
  const actualTicks = Math.min(
    Math.max(uniqueTimestamps.length, MIN_TICKS),
    MAX_TICKS,
  );

  // 提取唯一的 type 值并按固定顺序排序
  const uniqueTypes = [...new Set(data.map((d) => d.type))];
  // 如果数据为空，使用默认的完整类型列表，避免图例消失
  const orderedTypes =
    uniqueTypes.length > 0
      ? ['实际值', '上阈值', '下阈值'].filter((t) =>
          uniqueTypes.includes(t as TimeseriesDataPoint['type']),
        )
      : ['实际值', '上阈值', '下阈值'];
  const colorRange = orderedTypes.map(
    (type) => COLOR_MAP[type as TimeseriesDataPoint['type']],
  );

  // 大数据量渲染优化阈值
  const LARGE_DATA_THRESHOLD = 2000;
  const isLargeDataset = data.length > LARGE_DATA_THRESHOLD;

  // 计算x轴domain
  const xDomain = options.timeRange
    ? [options.timeRange[0].getTime(), options.timeRange[1].getTime()]
    : undefined;

  return {
    data,
    // 将时间轴显式转为 Date，确保使用连续时间比例尺（time scale）
    xField: (d: any) => new Date(d.timestamp),
    yField: 'value',
    seriesField: 'type',
    // 显式声明颜色通道，确保按 type 着色并驱动图例
    colorField: 'type',
    // 大数据量禁用平滑以降低计算开销
    smooth: !isLargeDataset,
    autoFit: true,
    // 添加内边距，为底部x轴标签预留空间（水平标签需要较多空间）
    appendPadding: [10, 10, 40, 10], // [上, 右, 下, 左]
    // 大数据量关闭动画
    animation: isLargeDataset
      ? false
      : {
          appear: {
            animation: 'path-in',
            duration: 1000,
          },
        },
    // 使用 scale 配置：颜色映射 + x 轴连续时间比例尺
    scale: {
      // 在比例尺层强制刻度数量，并关闭 nice，避免被对齐到整天只剩 1 刻度
      x: {
        type: 'time',
        nice: false,
        tickCount: actualTicks,
        // 如果提供了时间范围，强制x轴显示完整的时间范围
        ...(xDomain && {
          domain: xDomain,
        }),
      },
      y: { nice: true, domainMin: 0 }, // 确保y轴从0开始
      color: {
        domain: orderedTypes, // 明确指定 domain，确保顺序
        range: colorRange, // 对应的颜色数组
      },
    },
    // 使用 style 回调配置虚线样式（注意：参数是 data 数组，不是单个 datum）
    style: {
      lineWidth: 2,
      lineDash: (seriesData: any[]) => {
        // seriesData 是当前系列的所有数据点
        if (seriesData && seriesData.length > 0) {
          const type = seriesData[0].type as TimeseriesDataPoint['type'];
          const isThreshold = type === '上阈值' || type === '下阈值';

          return isThreshold ? [4, 4] : undefined;
        }
        return undefined;
      },
    },
    legend: {
      position: 'top' as const,
      itemName: {
        formatter: (text?: string) => {
          const label =
            (text && SERIES_ALIAS_MAP[text as TimeseriesDataPoint['type']]) ||
            text ||
            '';
          return label;
        },
      },
      marker: {
        symbol: 'line',
        style: {
          lineWidth: 2,
        },
      },
    },
    axis: {
      x: {
        position: 'bottom',
        title: null,
        // 轴线配置
        line: true,
        lineLineWidth: 1,
        lineStroke: '#e5e7eb',
        // 刻度线配置
        tick: true,
        tickLength: 4,
        tickLineWidth: 1,
        tickStroke: '#e5e7eb',
        tickCount: actualTicks,
        // 刻度值(标签)配置
        label: true,
        labelFormatter: (d: string | Date) => formatDateTime(d),
        labelFontSize: 11,
        labelFill: '#4E5969',
        labelSpacing: 8, // 刻度值到其对应刻度的间距
        labelAlign: 'horizontal', // 始终保持水平
        labelAutoRotate: false, // 禁用自动旋转
        // 手动过滤标签，避免重叠
        labelFilter: (_datum: any, index: number, data?: any[]) => {
          // 防御性检查：如果 data 未定义或为空，显示所有标签
          if (!data || !Array.isArray(data)) {
            return true;
          }

          const totalLabels = data.length;

          // 总是显示第一个和最后一个（优先级最高）
          if (index === 0 || index === totalLabels - 1) {
            return true;
          }

          // 标签少时全部显示
          if (totalLabels <= 6) {
            return true;
          }

          // 根据总标签数动态计算显示间隔
          const interval = Math.ceil(totalLabels / 6);
          return index % interval === 0;
        },
        transform: [
          {
            type: 'hide', // 隐藏重叠的标签
            keepHeader: true, // 保留第一个标签
            keepTail: true, // 保留最后一个标签
          },
        ],
        tickFilter: undefined,
      },
      y: {
        position: 'left',
        title: null,
        // 轴线配置
        line: true,
        lineLineWidth: 1,
        lineStroke: '#e5e7eb',
        // 刻度线配置
        tick: true,
        tickLength: 4,
        tickLineWidth: 1,
        tickStroke: '#e5e7eb',
        // 刻度值(标签)配置
        label: true,
        labelFormatter: (text: string) => {
          const numeric = Number(text);
          return Number.isFinite(numeric) ? numeric.toFixed(2) : String(text);
        },
        labelFontSize: 11,
        labelFill: '#4E5969',
      },
    },
    meta: {
      timestamp: {
        type: 'time',
        formatter: (value: string | Date) => formatDateTime(value),
      },
      value: {
        alias: '值',
        formatter: (value: number) =>
          Number.isFinite(value) ? Number(value).toFixed(2) : String(value),
      },
      type: {
        alias: '线条',
        formatter: (value: TimeseriesDataPoint['type']) =>
          SERIES_ALIAS_MAP[value] || value,
      },
    },
    // Tooltip will be configured在具体组件中覆盖
    // 大数据量关闭散点以减少 DOM/绘制
    point: isLargeDataset
      ? undefined
      : {
          size: 2,
          shape: 'circle',
        },
  };
};
