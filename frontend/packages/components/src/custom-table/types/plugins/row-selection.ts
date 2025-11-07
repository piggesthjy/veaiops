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
 * 行选择插件类型定义
 * 基于 Arco Table RowSelectionProps 能力
 */
import type { Key, ReactNode } from 'react';
import type { BaseRecord } from '../core/common';
import type { PluginPriorityEnum } from '../core/enums';
import type { PluginBaseConfig } from './core';

/**
 * 选择策略
 */
export type SelectionStrategy = 'page' | 'all' | 'smart';

/**
 * 批量操作配置
 */
export interface BatchActionConfig<RecordType extends BaseRecord = BaseRecord> {
  /** 操作标识 */
  key: string;
  /** 操作标题 */
  title: string;
  /** 操作图标 */
  icon?: ReactNode;
  /** 是否危险操作 */
  danger?: boolean;
  /** 是否禁用 */
  disabled?: boolean | ((selectedRows: RecordType[]) => boolean);
  /** 操作处理函数 */
  handler: (
    selectedKeys: Key[],
    selectedRows: RecordType[],
  ) => void | Promise<void>;
  /** 操作权限检查 */
  permission?: (selectedRows: RecordType[]) => boolean;
  /** 操作确认信息 */
  confirmText?: string | ((selectedRows: RecordType[]) => string);
}

/**
 * 选择统计配置
 */
export interface SelectionStatConfig {
  /** 是否显示统计 */
  show?: boolean;
  /** 自定义统计渲染 */
  render?: (selectedCount: number, totalCount: number) => ReactNode;
  /** 统计位置 */
  position?: 'header' | 'footer' | 'both';
}

/**
 * 扩展的行选择配置（基于 Arco RowSelectionProps）
 */
export interface RowSelectionConfig<RecordType extends BaseRecord = BaseRecord>
  extends PluginBaseConfig {
  // === Arco Table 原生属性 ===
  /** 选择类型 */
  type?: 'checkbox' | 'radio';
  /** 是否显示全选按钮 */
  checkAll?: boolean;
  /** 是否严格模式（父子选择不关联） */
  checkStrictly?: boolean;
  /** 是否跨页保持选择 */
  checkCrossPage?: boolean;
  /** 是否跨页保留选择（别名） */
  preserveAcrossPages?: boolean;
  /** 自定义列标题 */
  columnTitle?: string | ReactNode;
  /** 选择列宽度 */
  columnWidth?: number;
  /** 复选框属性配置 */
  checkboxProps?: (record: RecordType) => Record<string, unknown>;
  /** 是否固定选择列 */
  fixed?: boolean;
  /** 已选中的行键 */
  selectedRowKeys?: Key[];
  /** 是否保留已删除数据的选择状态 */
  preserveSelectedRowKeys?: boolean;
  /** 自定义选择框渲染 */
  renderCell?: (
    originNode: ReactNode,
    checked: boolean,
    record: RecordType,
  ) => ReactNode;

  // === 扩展属性 ===
  /** 选择策略 */
  strategy?: SelectionStrategy;
  /** 批量操作配置 */
  batchActions?: BatchActionConfig<RecordType>[];
  /** 选择统计配置 */
  selectionStat?: SelectionStatConfig;
  /** 最大选择数量 */
  maxSelection?: number;
  /** 获取行键的函数 */
  getRowKey?: (record: RecordType) => Key;

  // === 回调函数 ===
  /** 选择变化回调 */
  onChange?: (selectedKeys: Key[], selectedRows: RecordType[]) => void;
  /** 手动选择单行回调 */
  onSelect?: (
    selected: boolean,
    record: RecordType,
    selectedRows: RecordType[],
  ) => void;
  /** 手动选择全部回调 */
  onSelectAll?: (selected: boolean, selectedRows: RecordType[]) => void;
  /** 批量操作执行前确认 */
  beforeBatchAction?: (
    action: BatchActionConfig<RecordType>,
    selectedRows: RecordType[],
  ) => boolean | Promise<boolean>;
}

/**
 * 插件状态
 */
export interface RowSelectionState<RecordType extends BaseRecord = BaseRecord> {
  /** 当前选中的 keys */
  selectedRowKeys: Key[];
  /** 当前选中的行数据 */
  selectedRows: RecordType[];
  /** 半选状态的 keys */
  indeterminateKeys: Key[];
  /** 跨页选择的所有 keys */
  allSelectedKeys: Key[];
  /** 是否全选 */
  isAllSelected: boolean;
  /** 是否半选 */
  isIndeterminate: boolean;
  /** 选择统计 */
  selectionStat: {
    selectedCount: number;
    totalCount: number;
    currentPageCount: number;
    selectedPercent: number;
  };
  /** 行选择缓存（用于跨页保持） */
  selectionCache: Map<Key, RecordType>;
}
