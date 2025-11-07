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
 * TableContent 组件类型定义
 * 基于 pro-components 设计模式优化
 *

 * @date 2025-12-19
 */

import type { CSSProperties, ReactNode } from 'react';

/**
 * @name 表格标题相关配置
 */
export interface TableHeaderConfig {
  /** @name 表格标题 */
  title?: string;
  /** @name 标题右侧操作按钮组 */
  actions?: ReactNode[];
  /** @name 标题容器样式类名 */
  className?: string;
  /** @name 标题容器内联样式 */
  style?: CSSProperties;
}

/**
 * @name 表格内容加载状态配置
 */
export interface TableContentLoadingConfig {
  /** @name 是否使用自定义加载组件 */
  useCustomLoading?: boolean;
  /** @name 表格加载状态 */
  loading?: boolean;
  /** @name 自定义加载状态 */
  customLoading?: boolean;
  /** @name 加载提示文本 */
  tip?: string;
}

/**
 * @name 渲染器函数集合
 */
export interface TableRenderers {
  /** @name 表格内容渲染器 */
  tableRender: (tableComponent: ReactNode) => ReactNode;
  /** @name 底部内容渲染器 */
  footerRender: () => ReactNode;
}

/**
 * @name 表格主内容组件属性
 */
export interface TableContentProps {
  /** @name 表格标题配置 */
  header?: TableHeaderConfig;

  /** @name 警告/提示组件 */
  alertDom?: ReactNode;

  /** @name 筛选器组件 */
  filterDom?: ReactNode;

  /** @name 加载状态配置 */
  loadingConfig?: TableContentLoadingConfig;

  /** @name 渲染器函数集合 */
  renderers: TableRenderers;

  /** @name 表格主体组件 */
  tableDom: ReactNode;

  /** @name 容器样式类名 */
  className?: string;

  /** @name 容器内联样式 */
  style?: CSSProperties;
}
