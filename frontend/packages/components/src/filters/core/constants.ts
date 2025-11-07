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

import type { FilterStyle, FixFilterControlCls } from './types';

/**
 * 固定筛选控件类名配置
 * 用于统一控制筛选器组件的响应式宽度
 */
export const fixFilterControlCls: FixFilterControlCls = {
  className: 'sm:w-p20 md:w-p21 lg:w-p22 x:w-p23 xl:w-p24 2xl:w-p24 3xl:w-p25',
};

/**
 * 默认筛选器样式配置
 */
export const defaultFilterStyle: FilterStyle = {
  isWithBackgroundAndBorder: false,
  style: {},
};

/**
 * 通用CSS类名
 * 用于布局和间距
 */
export const commonClassName = 'flex flex-wrap items-center gap-[10px]';

/**
 * 筛选器容器ID
 */
export const FILTER_CONTAINER_ID = 'tableFilters';

/**
 * 错误提示信息
 */
export const ERROR_MESSAGES = {
  FIELD_TYPE_REQUIRED: '字段类型未定义',
  PLUGIN_NOT_FOUND: '组件插件未找到',
  INVALID_CONFIG: '组件配置无效',
  RENDER_FAILED: '组件渲染失败',
} as const;

/**
 * 警告信息
 */
export const WARNING_MESSAGES = {
  FIELD_TYPE_REQUIRED: 'Field type is required for rendering',
  PLUGIN_NOT_FOUND: (type: string) =>
    `Plugin for type "${type}" not found, using fallback`,
  INVALID_CONFIG: (type: string) => `Invalid config for plugin "${type}"`,
} as const;

/**
 * 日志信息
 */
export const LOG_MESSAGES = {
  RENDER_ERROR: (type: string, _error: unknown) =>
    `Error rendering plugin "${type}":`,
} as const;
