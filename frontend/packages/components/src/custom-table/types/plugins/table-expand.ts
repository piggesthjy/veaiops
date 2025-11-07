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

import type { BaseRecord } from '@veaiops/types';
/**
 * 表格展开插件类型定义
 * 基于 Arco Table useExpand 能力
 */
import type { Key, ReactNode } from 'react';
import type { PluginPriorityEnum } from '../core/enums';

/**
 * 展开触发方式
 */
export type ExpandTrigger = 'click' | 'doubleClick' | 'icon';

/**
 * 展开内容类型
 */
export type ExpandContentType = 'nested-table' | 'custom' | 'form' | 'tree';

/**
 * 嵌套表格配置
 */
export interface NestedTableConfig<RecordType extends BaseRecord = BaseRecord> {
  /** 子表格列配置 */
  columns: Array<Record<string, unknown>>;
  /** 子表格数据字段 */
  dataField: string;
  /** 子表格属性 */
  tableProps?: Partial<Record<string, unknown>>;
}

/**
 * 展开渲染配置
 */
export interface ExpandRenderConfig {
  /** 展开内容类型 */
  type: ExpandContentType;
  /** 嵌套表格配置 */
  nestedTable?: NestedTableConfig<BaseRecord>;
  /** 自定义渲染函数 */
  render?: <RecordType extends BaseRecord = BaseRecord>(
    record: RecordType,
    index: number,
  ) => ReactNode;
  /** 展开内容的样式 */
  style?: React.CSSProperties;
  /** 展开内容的类名 */
  className?: string;
}

/**
 * 展开图标配置
 */
export interface ExpandIconConfig {
  /** 展开图标 */
  expandIcon?: ReactNode;
  /** 收起图标 */
  collapseIcon?: ReactNode;
  /** 图标位置 */
  position?: 'left' | 'right';
  /** 自定义渲染展开图标 */
  render?: <RecordType extends BaseRecord = BaseRecord>(
    expanded: boolean,
    record: RecordType,
  ) => ReactNode;
}

/**
 * 表格展开配置
 */
export interface TableExpandConfig {
  /** 是否启用插件 */
  enabled?: boolean;
  /** 插件优先级 */
  priority?: PluginPriorityEnum;
  /** 展开触发方式 */
  trigger?: ExpandTrigger;
  /** 默认展开的行 */
  defaultExpandedRowKeys?: Key[];
  /** 展开渲染配置 */
  renderConfig?: ExpandRenderConfig;
  /** 展开图标配置 */
  iconConfig?: ExpandIconConfig;
  /** 是否可以展开多行 */
  allowMultipleExpand?: boolean;
  /** 展开变化回调 */
  onExpandChange?: <RecordType extends BaseRecord = BaseRecord>(
    expanded: boolean,
    record: RecordType,
    expandedRowKeys: Key[],
  ) => void;
  /** 判断行是否可展开 */
  rowExpandable?: <RecordType extends BaseRecord = BaseRecord>(
    record: RecordType,
  ) => boolean;
  /** 展开行的样式 */
  expandedRowClassName?:
    | string
    | (<RecordType extends BaseRecord = BaseRecord>(
        record: RecordType,
        index: number,
      ) => string);
}

/**
 * 插件状态
 */
export interface TableExpandState {
  /** 当前展开的行 keys */
  expandedRowKeys: Key[];
  /** 展开状态映射 */
  expandedMap: Map<Key, boolean>;
  /** 是否有展开的行 */
  hasExpandedRows: boolean;
}
