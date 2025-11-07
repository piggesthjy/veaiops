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

import type React from 'react';

/**
 * 智能阈值趋势数据类型
 */
export interface ThresholdTrendData {
  period: string;
  success: number;
  failed: number;
}

/**
 * 事件趋势数据类型
 */
export interface EventTrendData {
  period: string;
  count: number;
}

/**
 * 消息趋势数据类型
 */
export interface MessageTrendData {
  period: string;
  count: number;
}

/**
 * 系统资源概览项目类型
 */
export interface SystemOverviewItem {
  name: string;
  value: number;
  icon: React.ReactNode;
}

/**
 * 系统资源概览数据类型
 */
export interface SystemOverviewData {
  category: string;
  items: SystemOverviewItem[];
}

/**
 * 统计数据检查结果类型
 */
export interface StatisticsDataCheck {
  hasData: boolean;
  hasThresholdData: boolean;
  hasEventData: boolean;
  hasMessageData: boolean;
}
