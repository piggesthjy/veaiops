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

import { lazy } from 'react';

/**
 * 懒加载路由组件配置
 *
 * 统一管理所有路由的懒加载组件，实现代码分割，提升首屏加载性能
 *
 * 注意：此处使用 React.lazy(() => import(...)) 是允许的例外情况
 * - React.lazy 是 React 官方推荐的代码分割方式
 * - 用于路由级别的懒加载，提升首屏加载性能
 * - 类型安全由 React.lazy 保证，不会导致类型问题
 * - 这是框架级别的功能，不是业务代码中的动态 import
 *
 * ⚠️ 重要：必须使用字符串字面量，不能使用变量
 * - webpack 需要静态分析 import() 路径，无法处理变量表达式
 * - 使用字符串字面量可以消除 "Critical dependency" 警告
 * - 路径配置参考 pages-path.config.ts，但在此文件中直接使用字符串字面量
 *
 * 使用规范：
 * - 所有路由文件必须从此文件导入懒加载组件
 * - 页面路径统一在 pages-path.config.ts 中配置（用于文档和类型检查）
 * - 在此文件中使用字符串字面量，路径与 pages-path.config.ts 保持一致
 * - 使用路径别名（@/pages/*）替代相对路径，便于维护
 * - 新增页面时，先在 pages-path.config.ts 中添加路径配置，再在此文件中添加懒加载组件
 */

// 系统管理模块
export const SystemPages = {
  Monitor: lazy(() => import('@/pages/system/datasource')),
  Account: lazy(() => import('@/pages/system/account')),
  BotManagement: lazy(() => import('@/pages/system/bot')),
  Project: lazy(() => import('@/pages/system/project')),
  CardTemplate: lazy(() => import('@/pages/system/card-template')),
};

// 智能阈值模块
export const ThresholdPages = {
  Config: lazy(() => import('@/pages/threshold/config')),
  History: lazy(() => import('@/pages/threshold/history')),
  Template: lazy(() => import('@/pages/threshold/template')),
  Subscription: lazy(() => import('@/pages/threshold/subscription')),
};

// 事件中心模块
export const EventCenterPages = {
  History: lazy(() => import('@/pages/event-center/history')),
  Statistics: lazy(() => import('@/pages/event-center/statistics')),
  Strategy: lazy(() => import('@/pages/event-center/strategy')),
  SubscribeRelation: lazy(
    () => import('@/pages/event-center/subscribe-relation'),
  ),
};

// Oncall异动模块
export const OncallPages = {
  Config: lazy(() => import('@/pages/oncall/config')),
  History: lazy(() => import('@/pages/oncall/history')),
  Rules: lazy(() => import('@/pages/oncall/rules')),
  Statistics: lazy(() => import('@/pages/oncall/statistics')),
};

// 统计模块
export const StatisticsPages = {
  Overview: lazy(() => import('@/pages/statistics/overview')),
};

// 通用页面
export const CommonPages = {
  Login: lazy(() => import('@/pages/auth/login')),
  NotFound: lazy(() => import('@/pages/common/not-found')),
};
