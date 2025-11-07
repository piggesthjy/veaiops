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

import type { RouteConfig } from '@/types/route';
import React from 'react';
// 直接从 routes/config 目录导入，避免通过 config/index.ts 造成循环引用
// 使用 ../config 会解析到 routes/config/index.ts，不会经过 config/index.ts
import { ThresholdPages } from '../config';

/**
 * 智能阈值模块路由配置
 */
export const thresholdRoutes: RouteConfig[] = [
  // 智能阈值任务配置
  {
    path: '/threshold/config',
    element: React.createElement(ThresholdPages.Config),
    requireAuth: true,
  },
  // 指标模版管理
  {
    path: '/threshold/template',
    element: React.createElement(ThresholdPages.Template),
    requireAuth: true,
  },
  // 订阅规则
  {
    path: '/threshold/subscription',
    element: React.createElement(ThresholdPages.Subscription),
    requireAuth: true,
  },
  // 历史事件
  {
    path: '/threshold/history',
    element: React.createElement(ThresholdPages.History),
    requireAuth: true,
  },
];
