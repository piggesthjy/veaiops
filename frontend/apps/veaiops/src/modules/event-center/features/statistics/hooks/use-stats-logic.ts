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

import { Message } from '@arco-design/web-react';
import { IconRefresh } from '@arco-design/web-react/icon';
import React, { useState, useCallback, useEffect } from 'react';

/**
 * 统计数据类型
 */
export interface StatisticsData {
  // 总体统计
  totalEvents: number;
  totalStrategies: number;
  totalSubscriptions: number;
  activeSubscriptions: number;

  // 事件级别分布
  eventLevelDistribution: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };

  // 事件类型分布
  eventTypeDistribution: {
    alert: number;
    warning: number;
    info: number;
    error: number;
  };

  // 时间趋势数据
  eventTrend: Array<{
    date: string;
    count: number;
    level: string;
  }>;

  // 响应时间统计
  responseTimeStats: {
    average: number;
    min: number;
    max: number;
    p95: number;
  };

  // 成功率统计
  successRate: {
    total: number;
    success: number;
    failed: number;
    rate: number;
  };
}

/**
 * 时间范围类型
 */
export type TimeRange = '1h' | '24h' | '7d' | '30d';

/**
 * 统计逻辑Hook
 * 提供统计页面的所有业务逻辑
 */
export const useStatisticsLogic = () => {
  const [loading, setLoading] = useState(false);
  const [statisticsData, setStatisticsData] = useState<StatisticsData | null>(
    null,
  );
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');

  /**
   * 获取统计数据
   */
  const fetchStatistics = useCallback(
    async (_range: TimeRange = timeRange) => {
      try {
        setLoading(true);

        // 临时使用模拟数据，等待后端 API 实现
        const mockData: StatisticsData = {
          totalEvents: Math.floor(Math.random() * 10000) + 1000,
          totalStrategies: Math.floor(Math.random() * 100) + 10,
          totalSubscriptions: Math.floor(Math.random() * 200) + 20,
          activeSubscriptions: Math.floor(Math.random() * 150) + 15,

          eventLevelDistribution: {
            critical: Math.floor(Math.random() * 100) + 10,
            high: Math.floor(Math.random() * 200) + 50,
            medium: Math.floor(Math.random() * 500) + 100,
            low: Math.floor(Math.random() * 1000) + 200,
          },

          eventTypeDistribution: {
            alert: Math.floor(Math.random() * 300) + 50,
            warning: Math.floor(Math.random() * 400) + 100,
            info: Math.floor(Math.random() * 600) + 200,
            error: Math.floor(Math.random() * 200) + 30,
          },

          eventTrend: Array.from({ length: 24 }, (_, i) => ({
            date: new Date(
              Date.now() - (23 - i) * 60 * 60 * 1000,
            ).toISOString(),
            count: Math.floor(Math.random() * 100) + 10,
            level: ['critical', 'high', 'medium', 'low'][
              Math.floor(Math.random() * 4)
            ],
          })),

          responseTimeStats: {
            average: Math.random() * 2 + 0.5,
            min: Math.random() * 0.5,
            max: Math.random() * 5 + 2,
            p95: Math.random() * 3 + 1,
          },

          successRate: {
            total: Math.floor(Math.random() * 1000) + 500,
            success: 0,
            failed: 0,
            rate: 0,
          },
        };

        // 计算成功率
        mockData.successRate.success = Math.floor(
          mockData.successRate.total * (0.85 + Math.random() * 0.1),
        );
        mockData.successRate.failed =
          mockData.successRate.total - mockData.successRate.success;
        mockData.successRate.rate =
          (mockData.successRate.success / mockData.successRate.total) * 100;

        // 模拟网络延迟
        await new Promise((resolve) => setTimeout(resolve, 500));

        setStatisticsData(mockData);
      } catch (error: unknown) {
        // ✅ 正确：透出实际的错误信息
        const errorObj =
          error instanceof Error ? error : new Error(String(error));
        const errorMessage =
          error instanceof Error ? error.message : '获取统计数据失败，请重试';
        Message.error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [timeRange],
  );

  /**
   * 切换时间范围
   */
  const handleTimeRangeChange = useCallback(
    (range: TimeRange) => {
      setTimeRange(range);
      fetchStatistics(range);
    },
    [fetchStatistics],
  );

  /**
   * 刷新数据
   */
  const handleRefresh = useCallback(() => {
    fetchStatistics(timeRange);
    Message.success('数据已刷新');
  }, [fetchStatistics, timeRange]);

  // 初始化加载数据
  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  return {
    // 状态
    loading,
    statisticsData,
    timeRange,

    // 事件处理器
    handleTimeRangeChange,
    handleRefresh,
    fetchStatistics,
  };
};

/**
 * 统计页面操作按钮配置Hook
 * 提供页面工具栏操作按钮配置
 */
export const useStatisticsActionConfig = (onRefresh: () => void) => {
  const actions = [
    React.createElement(
      'div',
      {
        key: 'refresh',
      },
      React.createElement(
        'button',
        {
          type: 'button',
          className: 'arco-btn arco-btn-secondary',
          onClick: onRefresh,
        },
        [React.createElement(IconRefresh, { key: 'icon' }), '刷新'],
      ),
    ),
  ];

  return { actions };
};

/**
 * 图表配置Hook
 * 提供各种图表的配置选项
 */
export const useChartConfigs = (statisticsData: StatisticsData | null) => {
  // 事件级别分布饼图配置
  const eventLevelPieConfig = {
    data: statisticsData
      ? [
          {
            type: 'Critical',
            value: statisticsData.eventLevelDistribution.critical,
          },
          { type: 'High', value: statisticsData.eventLevelDistribution.high },
          {
            type: 'Medium',
            value: statisticsData.eventLevelDistribution.medium,
          },
          { type: 'Low', value: statisticsData.eventLevelDistribution.low },
        ]
      : [],
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    label: {
      type: 'outer',
      content: '{name} {percentage}',
    },
    interactions: [{ type: 'element-active' }],
  };

  // 事件趋势折线图配置
  const eventTrendLineConfig = {
    data: statisticsData?.eventTrend || [],
    xField: 'date',
    yField: 'count',
    seriesField: 'level',
    smooth: true,
    animation: {
      appear: {
        animation: 'path-in',
        duration: 1000,
      },
    },
  };

  // 事件类型柱状图配置
  const eventTypeBarConfig = {
    data: statisticsData
      ? [
          { type: 'Alert', value: statisticsData.eventTypeDistribution.alert },
          {
            type: 'Warning',
            value: statisticsData.eventTypeDistribution.warning,
          },
          { type: 'Info', value: statisticsData.eventTypeDistribution.info },
          { type: 'Error', value: statisticsData.eventTypeDistribution.error },
        ]
      : [],
    xField: 'value',
    yField: 'type',
    seriesField: 'type',
    legend: {
      position: 'top-left',
    },
  };

  return {
    eventLevelPieConfig,
    eventTrendLineConfig,
    eventTypeBarConfig,
  };
};
