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

// 静态导入路由配置（使用明确的相对路径，避免循环引用）
import { baseRoutes, notFoundRoute } from './base';
import {
  eventCenterRoutes,
  oncallRoutes,
  statisticsRoutes,
  systemRoutes,
  thresholdRoutes,
} from './modules';

/**
 * 路由配置统一导出入口
 *
 * 目录结构（按职能边界分组）：
 * - config/         配置层：懒加载组件配置、页面路径配置
 * - base/           基础路由层：根路径、登录、404 等框架级路由
 * - modules/        模块路由层：各业务模块的路由定义（system、threshold、event-center、oncall、statistics）
 * - utils/          工具层：路由创建工具、类型定义、组件等
 *
 * 使用规范：
 * - 从顶层 index.ts 导入 routesConfig 获取完整路由配置
 * - 从各子目录的 index.ts 导入特定层的配置（如从 ./config 导入懒加载组件）
 * - 新增模块路由时，在 modules/ 目录下创建对应文件，并在 modules/index.ts 中导出
 *
 * ⚠️ 循环引用修复说明：
 * - 所有路由模块文件（base-routes.ts、system.ts 等）必须从 '../config' 导入懒加载组件
 * - '../config' 会解析到 routes/config/index.ts，不会经过 config/index.ts，避免循环
 * - utils/route.ts 必须从 '../config/routes/index' 直接导入，不能通过 config/index.ts
 */
export const routesConfig: RouteConfig[] = [
  ...baseRoutes,
  ...statisticsRoutes, // 统计概览
  ...systemRoutes, // 系统配置
  ...oncallRoutes, // Oncall异动
  ...thresholdRoutes, // 智能阈值
  ...eventCenterRoutes, // 事件中心
  notFoundRoute, // 404 兜底路由 - 必须放在最后
];
