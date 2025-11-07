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

import { useStatisticsLogic } from '@ec/statistics';
import type React from 'react';
import { StatisticsCharts } from './statistics-charts';
import { StatisticsOverview } from './statistics-overview';

/**
 * 统计管理页面
 * 提供事件中心的统计数据展示功能
 *
 * 架构特点：
 * - 使用自定义Hook封装业务逻辑
 * - 组件职责单一，易于维护
 * - 状态管理与UI渲染分离
 * - 支持配置化和扩展
 * - 提供丰富的图表和统计信息
 */
const StatisticsManagement: React.FC = () => {
  // 使用自定义Hook获取所有业务逻辑
  const {
    // 状态
    loading,
    statisticsData,
    timeRange,

    // 事件处理器
    handleTimeRangeChange,
    handleRefresh,
  } = useStatisticsLogic();

  return (
    <div className="statistics-management">
      {/* 统计概览组件 */}
      <StatisticsOverview
        loading={loading}
        statisticsData={statisticsData}
        timeRange={timeRange}
        onTimeRangeChange={handleTimeRangeChange}
        onRefresh={handleRefresh}
      />

      {/* 统计图表组件 */}
      <StatisticsCharts loading={loading} statisticsData={statisticsData} />
    </div>
  );
};

export default StatisticsManagement;
