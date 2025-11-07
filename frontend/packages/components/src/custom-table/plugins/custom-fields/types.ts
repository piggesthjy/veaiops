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

import type { BaseRecord, ModernTableColumnProps } from '@/custom-table/types';
import type { PluginPriorityEnum } from '@/custom-table/types/core/enums';
/**
 * Custom Fields 插件类型定义
 */
import type { ReactElement } from 'react';

/**
 * CustomFields 组件属性
 */
export interface CustomFieldsProps<T extends BaseRecord = BaseRecord> {
  /** 禁止选择的字段 */
  disabledFields: Map<string, string | undefined>;
  /** 基础的列 */
  columns: ModernTableColumnProps<T>[];
  /** 当前选中的值 */
  value: string[] | undefined;
  /** 初始字段 */
  initialFields?: string[];
  /** 确认回调 */
  confirm: (value: string[]) => void;
}

/**
 * Custom Fields 插件配置
 */
export interface CustomFieldsConfig {
  /** 是否启用插件 */
  enabled?: boolean;
  /** 插件优先级 */
  priority?: PluginPriorityEnum;
  /** 是否启用自定义字段功能 */
  enableCustomFields?: boolean;
  /** CustomFields 组件属性 */
  customFieldsProps?: Partial<CustomFieldsProps>;
  /** 自定义渲染函数 */
  customRender?: (props: CustomFieldsProps) => ReactElement | null;
}

/**
 * 插件状态
 */
export interface CustomFieldsState<T extends BaseRecord = BaseRecord> {
  /** 是否显示 CustomFields */
  showCustomFields: boolean;
  /** 当前选中的字段 */
  selectedFields: string[];
  /** 可用的列 */
  availableColumns: ModernTableColumnProps<T>[];
  /** 禁用的字段 */
  disabledFields: string[];
}
