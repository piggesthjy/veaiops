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
import { Navigate } from '@modern-js/runtime/router';
import React from 'react';

// 直接从 routes/config 目录导入，避免通过 config/index.ts 造成循环引用
// 使用 ../config 会解析到 routes/config/index.ts，不会经过 config/index.ts
import { CommonPages } from '../config';

/**
 * 基础路由配置（不包含 404）
 */
export const baseRoutes: RouteConfig[] = [
  // 根路径重定向到第一个顶导的第一个菜单
  {
    path: '/',
    element: React.createElement(Navigate, {
      to: '/statistics/overview',
      replace: true,
    }),
    requireAuth: true,
  },

  // 登录页面
  {
    path: '/login',
    element: React.createElement(CommonPages.Login),
    title: '登录',
    requireAuth: false,
  },
];

/**
 * 404 兜底路由 - 必须放在所有路由配置的最后
 */
export const notFoundRoute: RouteConfig = {
  path: '*',
  element: React.createElement(CommonPages.NotFound),
  title: '页面不存在',
  requireAuth: false,
};
