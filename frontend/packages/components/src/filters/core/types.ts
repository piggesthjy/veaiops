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

import type {
  PluginConfig,
  FieldItem as PluginFieldItem,
} from '@veaiops/types';
/**
 * 筛选器核心类型定义
 */
import type { CSSProperties, ReactNode } from 'react';

/**
 * 筛选器组件属性接口
 */
export interface FiltersComponentProps {
  /** 自定义类名 */
  className?: string;
  /** 包装器类名 */
  wrapperClassName?: string;
  /** 筛选器样式配置 */
  filterStyle?: FilterStyle;
  /** 字段配置列表 */
  config?: FieldItem[];
  /** 操作按钮列表 */
  actions?: ReactNode[];
  /** 自定义操作按钮 */
  customActions?: ReactNode[] | ReactNode;
  /** 自定义操作按钮样式 */
  customActionsStyle?: CSSProperties;
  /** 重置筛选值回调 */
  resetFilterValues?: (props: { resetEmptyData?: boolean }) => void;
  /** 查询对象 */
  query: Record<string, unknown>;
  /** 是否显示重置按钮 */
  showReset?: boolean;
}

/**
 * 筛选器样式配置
 */
export interface FilterStyle {
  /** 是否显示背景和边框 */
  isWithBackgroundAndBorder: boolean;
  /** 自定义样式 */
  style?: CSSProperties;
}

/**
 * 字段项配置（扩展插件字段项）
 */
export interface FieldItem extends PluginFieldItem {
  /** 插件特定配置 */
  pluginConfig?: PluginConfig;
  /** 预设配置 */
  preset?: string;
  /**
   * Label 转换目标属性
   * 指定将 label 字段转换为哪个组件属性（addBefore/addAfter/prefix/suffix）
   * 如果不指定，则根据组件类型自动选择（Select 用 addBefore，Input 用 prefix）
   */
  labelAs?: 'addBefore' | 'addAfter' | 'prefix' | 'suffix';
}

/**
 * 固定筛选控件类名配置
 */
export interface FixFilterControlCls {
  className: string;
}

/**
 * 重置筛选参数
 */
export interface ResetFilterParams {
  resetEmptyData?: boolean;
}

// 重新导出插件系统类型
export * from '../plugins';
