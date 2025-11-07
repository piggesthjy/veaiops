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

import { routesConfig } from '@/config/route-config';
import type { RouteConfig, RouteUtils } from '@/types/route';

/**
 * 路由工具函数
 * 提供路由相关的实用功能
 */
export const routeUtils: RouteUtils = {
  /**
   * 根据路径获取路由配置
   * @param path 路由路径
   * @returns 路由配置对象或undefined
   */
  getRouteByPath: (path: string): RouteConfig | undefined => {
    return routesConfig.find((route) => route.path === path);
  },

  /**
   * 获取需要认证的路由
   * @returns 需要认证的路由配置数组
   */
  getAuthRequiredRoutes: (): RouteConfig[] => {
    return routesConfig.filter((route) => route.requireAuth !== false);
  },

  /**
   * 获取不需要认证的路由
   * @returns 公开路由配置数组
   */
  getPublicRoutes: (): RouteConfig[] => {
    return routesConfig.filter((route) => route.requireAuth === false);
  },

  /**
   * 检查路径是否需要认证
   * @param path 路由路径
   * @returns 是否需要认证
   */
  requiresAuth: (path: string): boolean => {
    const route = routeUtils.getRouteByPath(path);
    return route?.requireAuth !== false;
  },
};
