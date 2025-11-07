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

/**
 * 页面路径配置
 *
 * 统一管理所有路由页面的导入路径，实现配置化管理
 * 参考 Modern.js 源码的配置化方式，将路径抽取为配置
 *
 * 使用规范：
 * - 所有页面路径必须在此配置文件中定义
 * - 使用路径别名（@/pages/*）替代相对路径
 * - 路径配置按模块分组，便于维护
 */

// 系统管理模块页面路径
export const SYSTEM_PAGES_PATH = {
  Monitor: '@/pages/system/datasource',
  Account: '@/pages/system/account',
  BotManagement: '@/pages/system/bot',
  Project: '@/pages/system/project',
  CardTemplate: '@/pages/system/card-template',
} as const;

// 智能阈值模块页面路径
export const THRESHOLD_PAGES_PATH = {
  Config: '@/pages/threshold/config',
  History: '@/pages/threshold/history',
  Template: '@/pages/threshold/template',
  Subscription: '@/pages/threshold/subscription',
} as const;

// 事件中心模块页面路径
export const EVENT_CENTER_PAGES_PATH = {
  History: '@/pages/event-center/history',
  Statistics: '@/pages/event-center/statistics',
  Strategy: '@/pages/event-center/strategy',
  SubscribeRelation: '@/pages/event-center/subscribe-relation',
} as const;

// Oncall异动模块页面路径
export const ONCALL_PAGES_PATH = {
  Config: '@/pages/oncall/config',
  History: '@/pages/oncall/history',
  Rules: '@/pages/oncall/rules',
  Statistics: '@/pages/oncall/statistics',
} as const;

// 统计模块页面路径
export const STATISTICS_PAGES_PATH = {
  Overview: '@/pages/statistics/overview',
} as const;

// 通用页面路径
export const COMMON_PAGES_PATH = {
  Login: '@/pages/auth/login',
  NotFound: '@/pages/common/not-found',
} as const;

/**
 * 页面路径配置映射
 * 用于统一管理和访问所有页面路径
 */
export const PAGES_PATH_CONFIG = {
  system: SYSTEM_PAGES_PATH,
  threshold: THRESHOLD_PAGES_PATH,
  eventCenter: EVENT_CENTER_PAGES_PATH,
  oncall: ONCALL_PAGES_PATH,
  statistics: STATISTICS_PAGES_PATH,
  common: COMMON_PAGES_PATH,
} as const;
