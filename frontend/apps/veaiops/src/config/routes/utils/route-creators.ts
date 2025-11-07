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

import React, { Suspense, memo } from 'react';
import { routePerformanceAnalyzer } from '../../../utils/route-performance-analyzer';
import { RouteErrorBoundary, RouteLoadingFallback } from './components';
import type { LazyComponent, RouteConfig, RouteConfigItem } from './types';

/**
 * 创建懒加载路由配置
 * @param config 路由配置对象
 */
export const createLazyRoute = (config: {
  path: string;
  component: LazyComponent;
  title: string;
  requireAuth?: boolean;
  preload?: boolean;
  meta?: RouteConfig['meta'];
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
}): RouteConfig => {
  const {
    path,
    component: LazyComponent,
    title,
    requireAuth = true,
    preload = false,
    meta,
    fallback,
  } = config;

  // 预加载功能
  const handlePreload = !preload
    ? undefined
    : () => {
        try {
          // 触发组件预加载
          (LazyComponent as any).preload?.();
        } catch (error) {
          // 静默处理：预加载失败不影响组件正常加载
        }
      };

  // 创建包装组件以支持性能监控
  const WrappedComponent = memo((props: any) => {
    const startTime = performance.now();
    // 开始路由加载监控
    routePerformanceAnalyzer.startRouteLoad({ path, componentName: title });

    React.useEffect(() => {
      const endTime = performance.now();
      const loadTime = endTime - startTime;

      // 结束路由加载监控
      routePerformanceAnalyzer.endRouteLoad({
        path,
        options: {
          preloaded: preload,
        },
      });

      // 记录路由加载性能
      if (loadTime > 100) {
        // 只记录超过100ms的加载
      }
    }, [startTime]);

    return React.createElement(LazyComponent, {
      ...props,
      onMouseEnter: handlePreload,
    });
  });

  WrappedComponent.displayName = `LazyRoute(${title})`;

  return {
    path,
    element: React.createElement(RouteErrorBoundary, {
      fallback,
      // biome-ignore lint/correctness/noChildrenProp: RouteErrorBoundary requires children prop
      children: React.createElement(
        Suspense,
        { fallback: React.createElement(RouteLoadingFallback) },
        React.createElement(WrappedComponent),
      ),
    }),
    title,
    requireAuth,
    meta,
  };
};

/**
 * 批量创建路由配置
 * @param routes 路由配置数组
 */
export const createLazyRoutes = (routes: RouteConfigItem[]): RouteConfig[] => {
  // 使用 Map 缓存已创建的路由，避免重复创建
  const routeCache = new Map<string, RouteConfig>();

  return routes.map((routeConfig) => {
    const cacheKey = `${routeConfig.path}_${routeConfig.title}`;

    if (routeCache.has(cacheKey)) {
      return routeCache.get(cacheKey)!;
    }

    const route = createLazyRoute(routeConfig);
    routeCache.set(cacheKey, route);

    return route;
  });
};

/**
 * 创建路由组，支持嵌套路由
 * @param groupConfig 路由组配置
 */
export const createRouteGroup = (groupConfig: {
  prefix: string;
  routes: RouteConfigItem[];
  middleware?: Array<(route: RouteConfig) => RouteConfig>;
}): RouteConfig[] => {
  const { prefix, routes, middleware = [] } = groupConfig;

  const processedRoutes = routes.map((route) => ({
    ...route,
    path: `${prefix}${route.path}`,
  }));

  let createdRoutes = createLazyRoutes(processedRoutes);

  // 应用中间件
  middleware.forEach((middlewareFn) => {
    createdRoutes = createdRoutes.map(middlewareFn);
  });

  return createdRoutes;
};
