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
 * 路由配置接口
 */
export interface RouteConfig {
  path: string;
  element: React.ReactElement;
  title: string;
  requireAuth: boolean;
  meta?: {
    /** 页面描述 */
    description?: string;
    /** 页面关键词 */
    keywords?: string[];
    /** 是否缓存页面 */
    keepAlive?: boolean;
    /** 页面权限 */
    permissions?: string[];
  };
}

/**
 * 懒加载组件类型
 */
export type LazyComponent = React.LazyExoticComponent<React.ComponentType<any>>;

/**
 * 路由配置项类型
 */
export interface RouteConfigItem {
  path: string;
  component: LazyComponent;
  title: string;
  requireAuth?: boolean;
  preload?: boolean;
  meta?: RouteConfig['meta'];
}
