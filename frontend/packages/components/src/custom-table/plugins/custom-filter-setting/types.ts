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

import type { PluginPriorityEnum } from '@/custom-table/types/core/enums';
import type { DrawerProps } from '@arco-design/web-react';
/**
 * Custom Filter Setting 插件类型定义
 */
import type { ReactNode } from 'react';

/**
 * 文本显示函数类型
 */
export type CaseSelectText = (key: string, utcOffset?: number) => string;

/**
 * CustomFilterSetting 组件属性
 */
export interface CustomFilterSettingProps
  extends Omit<DrawerProps, 'visible' | 'onOk' | 'onCancel'> {
  /** 子组件（触发按钮） */
  children?: ReactNode;
  /** 固定选项 */
  fixedOptions?: string[];
  /** 所有可选项 */
  allOptions?: string[];
  /** 已选中的选项（不含已固定） */
  selectedOptions?: string[];
  /** 隐藏的选项 */
  hiddenOptions?: string[];
  /** 配置标题 */
  title?: string;
  /** 布局修改回调 */
  onChange?: (props: {
    fixed_fields: string[];
    hidden_fields?: string[];
  }) => void;
  /** 保存回调 */
  saveFun: (props: {
    fixed_fields: string[];
    selected_fields: string[];
    hidden_fields: string[];
  }) => void;
  /** 文本显示函数 */
  caseSelectText: CaseSelectText;
  /** 配置类型 - 仅支持选中、既选中又固定 */
  mode?: Array<'select' | 'fixed'>;
}

/**
 * Custom Filter Setting 插件配置
 */
export interface CustomFilterSettingConfig {
  /** 是否启用插件 */
  enabled?: boolean;
  /** 插件优先级 */
  priority?: PluginPriorityEnum;
  /** 是否启用过滤器设置功能 */
  enableFilterSetting?: boolean;
  /** CustomFilterSetting 组件属性 */
  filterSettingProps?: Partial<CustomFilterSettingProps>;
  /** 自定义渲染函数 */
  customRender?: (props: CustomFilterSettingProps) => ReactNode;
}

/**
 * 插件状态
 */
export interface CustomFilterSettingState {
  /** 是否显示过滤器设置 */
  showFilterSetting: boolean;
  /** 固定字段 */
  fixedFields: string[];
  /** 选中字段 */
  selectedFields: string[];
  /** 隐藏字段 */
  hiddenFields: string[];
  /** 所有可用字段 */
  allFields: string[];
  /** 过滤器配置 */
  filters?: Record<string, unknown>;
  /** 是否可见 */
  visible?: boolean;
}
