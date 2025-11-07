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

import { Line } from '@ant-design/plots';

import { useMemo } from 'react';

import type { TimeseriesDataPoint } from '../shared/types';
import { getChartConfig } from './config';
import { createTooltipIndex, renderTooltip } from './tooltip-utils';

export interface TimeseriesChartProps {
  timeseriesData: TimeseriesDataPoint[];
  className?: string;
  timeRange?: [Date, Date]; // 添加时间范围参数
}

export const TimeseriesChart: React.FC<TimeseriesChartProps> = ({
  timeseriesData,
  className = 'w-full h-[500px]',
  timeRange,
}) => {
  // 预构建 tooltip 数据索引，按 timestamp 聚合（避免 hover 时每次 O(n) 过滤）
  const tooltipIndexByTimestamp = useMemo(() => {
    return createTooltipIndex(timeseriesData);
  }, [timeseriesData]);

  const lineConfig = {
    ...getChartConfig(timeseriesData, {
      // maxXTicks: 8,
      // xLabelOptionalAngles: [0, 25, 45, 60],
      timeRange, // 传递时间范围
    }),
    // 使用 G2 v5 Tooltip API：通过 title/items 配置内容，由 interaction.tooltip.render 渲染
    tooltip: {
      // 标题使用 ISO，便于作为索引键
      title: (d: any) => new Date(d.timestamp).toISOString(),
      // items 走默认通道，这里不强制声明，render 中按索引自定义
    },
    interaction: {
      tooltip: {
        shared: true,
        series: true,
        crosshairs: true,
        // 提高等待时间，降低渲染频率
        wait: 120,
        render: (_event: any, { title }: any) => {
          return renderTooltip(_event, { title }, tooltipIndexByTimestamp);
        },
      },
    },
  };

  return (
    <div className={className}>
      <Line {...lineConfig} />
    </div>
  );
};
