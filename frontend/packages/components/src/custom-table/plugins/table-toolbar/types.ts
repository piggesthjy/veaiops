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
 * 表格工具栏插件类型定义
 * 提供表格常用操作工具栏
 */
import type { ReactNode } from 'react';

/**
 * 工具栏位置
 */
export type ToolbarPosition = 'top' | 'bottom' | 'both';

/**
 * 工具栏对齐方式
 */
export type ToolbarAlign = 'left' | 'center' | 'right' | 'space-between';

/**
 * 工具栏按钮配置
 */
export interface ToolbarButtonConfig {
  /** 按钮唯一标识 */
  key: string;
  /** 按钮标题 */
  title: string;
  /** 按钮图标 */
  icon?: ReactNode;
  /** 按钮类型 */
  type?: 'primary' | 'secondary' | 'dashed' | 'text' | 'outline';
  /** 是否危险按钮 */
  danger?: boolean;
  /** 是否禁用 */
  disabled?: boolean | (() => boolean);
  /** 是否显示 */
  visible?: boolean | (() => boolean);
  /** 按钮点击事件 */
  onClick: () => void | Promise<void>;
  /** 自定义渲染 */
  render?: () => ReactNode;
}

/**
 * 搜索框配置
 */
export interface SearchConfig {
  /** 是否显示搜索框 */
  show?: boolean;
  /** 搜索框占位符 */
  placeholder?: string;
  /** 是否允许清空 */
  allowClear?: boolean;
  /** 搜索回调 */
  onSearch?: (value: string) => void;
  /** 搜索框样式 */
  style?: React.CSSProperties;
  /** 搜索框宽度 */
  width?: number | string;
}

/**
 * 刷新按钮配置
 */
export interface RefreshConfig {
  /** 是否显示刷新按钮 */
  show?: boolean;
  /** 刷新按钮标题 */
  title?: string;
  /** 刷新回调 */
  onRefresh?: () => void | Promise<void>;
  /** 是否显示加载状态 */
  showLoading?: boolean;
}

/**
 * 密度设置配置
 */
export interface DensityConfig {
  /** 是否显示密度设置 */
  show?: boolean;
  /** 默认密度 */
  defaultDensity?: 'default' | 'middle' | 'small';
  /** 密度变化回调 */
  onDensityChange?: (density: 'default' | 'middle' | 'small') => void;
}

/**
 * 表格工具栏配置
 */
export interface TableToolbarConfig {
  /** 是否启用插件 */
  enabled?: boolean;
  /** 插件优先级 */
  priority?: number;
  /** 工具栏位置 */
  position?: ToolbarPosition;
  /** 工具栏对齐方式 */
  align?: ToolbarAlign;
  /** 左侧按钮配置 */
  leftButtons?: ToolbarButtonConfig[];
  /** 右侧按钮配置 */
  rightButtons?: ToolbarButtonConfig[];
  /** 搜索配置 */
  search?: SearchConfig;
  /** 刷新配置 */
  refresh?: RefreshConfig;
  /** 密度设置配置 */
  density?: DensityConfig;
  /** 工具栏样式 */
  style?: React.CSSProperties;
  /** 工具栏类名 */
  className?: string;
  /** 自定义工具栏渲染 */
  render?: () => ReactNode;
}

/**
 * 插件状态
 */
export interface TableToolbarState {
  /** 当前密度设置 */
  currentDensity: 'default' | 'middle' | 'small';
  /** 搜索值 */
  searchValue: string;
  /** 是否正在刷新 */
  isRefreshing: boolean;
  /** 工具栏是否可见 */
  isVisible: boolean;
}
