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
 * 路由配置类型定义
 */
export interface RouteConfig {
  /** 路由路径 */
  path: string;
  /** React组件元素 */
  element: React.ReactElement;
  /** 页面标题 */
  title?: string;
  /** 图标名称 */
  icon?: string;
  /** 是否需要认证 */
  requireAuth?: boolean;
  /** 子路由配置 */
  children?: RouteConfig[];
}

/**
 * 页面配置类型
 */
export interface PageConfig {
  /** 公共页面 */
  common: Record<string, React.LazyExoticComponent<React.ComponentType>>;
  /** 时序异常模块页面 */
  timeseries: Record<string, React.LazyExoticComponent<React.ComponentType>>;
  /** 智能阈值模块页面 */
  threshold: Record<string, React.LazyExoticComponent<React.ComponentType>>;
  /** Oncall异动模块页面 */
  oncall: Record<string, React.LazyExoticComponent<React.ComponentType>>;
  /** 事件中心模块页面 */
  eventCenter: Record<string, React.LazyExoticComponent<React.ComponentType>>;
  /** 系统配置模块页面 */
  system: Record<string, React.LazyExoticComponent<React.ComponentType>>;
}

/**
 * 路由工具函数类型
 */
export interface RouteUtils {
  /** 根据路径获取路由配置 */
  getRouteByPath: (path: string) => RouteConfig | undefined;
  /** 获取需要认证的路由 */
  getAuthRequiredRoutes: () => RouteConfig[];
  /** 获取不需要认证的路由 */
  getPublicRoutes: () => RouteConfig[];
  /** 检查路径是否需要认证 */
  requiresAuth: (path: string) => boolean;
}
