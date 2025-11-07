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
 * CustomTable 选择操作 Hook
 * 负责处理行选择相关的所有操作
 *

 * @date 2025-12-19
 */
import type {
  BaseQuery,
  BaseRecord,
  PluginContext,
} from '@/custom-table/types';

/**
 * @name 选择操作相关的实例方法
 */
export interface SelectionActionMethods<RecordType extends BaseRecord> {
  /** @name 设置选择状态 */
  setSelection: (keys: string[]) => void;
  /** @name 清除选择状态 */
  clearSelection: () => void;
  /** @name 获取选择状态 */
  getSelection: () => (string | number)[];
  /** @name 获取选中的行键 */
  getSelectedRowKeys: () => (string | number)[];
  /** @name 设置选中的行 */
  setSelectedRows: (keys: (string | number)[]) => void;
  /** @name 获取选中的行数据 */
  getSelectedRows: () => RecordType[];
  /** @name 全选 */
  selectAll: () => void;
  /** @name 反选 */
  invertSelection: () => void;
}

/**
 * @name 创建选择操作方法
 * @description 基于 pro-components 和 Arco Design 选择设计模式
 */
export const createSelectionActions = <
  RecordType extends BaseRecord = BaseRecord,
  QueryType extends BaseQuery = BaseQuery,
>(
  context: PluginContext<RecordType, QueryType>,
  formattedTableData: RecordType[],
): SelectionActionMethods<RecordType> => ({
  /** @name 设置选择状态 */
  setSelection: (keys: string[]) => {
    // 基于 pro-components 的设计模式实现选中项设置
    // 通过上下文的 helpers 设置选中的行键
    if (context.helpers.setSelectedRowKeys) {
      context.helpers.setSelectedRowKeys(keys);
    }
  },

  /** @name 清除选择状态 */
  clearSelection: () => {
    // 清除所有选中项
    if (context.helpers.setSelectedRowKeys) {
      context.helpers.setSelectedRowKeys([]);
    }
  },

  /** @name 获取选择状态 */
  getSelection: () =>
    // 获取当前选中的行键
    context.state.selectedRowKeys || [],

  /** @name 获取选中的行键 */
  getSelectedRowKeys: () => context.state.selectedRowKeys || [],

  /** @name 设置选中的行 */
  setSelectedRows: (keys: (string | number)[]) => {
    if (context.helpers.setSelectedRowKeys) {
      context.helpers.setSelectedRowKeys(keys);
    }
  },

  /** @name 获取选中的行数据 */
  getSelectedRows: () => {
    const { selectedRowKeys } = context.state;
    if (!selectedRowKeys || selectedRowKeys.length === 0) {
      return [];
    }
    return formattedTableData.filter((record) => {
      const key =
        typeof context.props.rowKey === 'function'
          ? context.props.rowKey(record)
          : (record as Record<string, unknown>)[context.props.rowKey || 'id'];
      return selectedRowKeys.includes(key as string | number);
    });
  },

  /** @name 全选 */
  selectAll: () => {
    const allKeys = formattedTableData.map((record) =>
      typeof context.props.rowKey === 'function'
        ? context.props.rowKey(record)
        : (record as Record<string, unknown>)[context.props.rowKey || 'id'],
    );
    if (context.helpers.setSelectedRowKeys) {
      context.helpers.setSelectedRowKeys(allKeys as (string | number)[]);
    }
  },

  /** @name 反选 */
  invertSelection: () => {
    const { selectedRowKeys = [] } = context.state;
    const allKeys = formattedTableData.map((record) =>
      typeof context.props.rowKey === 'function'
        ? context.props.rowKey(record)
        : (record as Record<string, unknown>)[context.props.rowKey || 'id'],
    );
    const invertedKeys = allKeys.filter(
      (key) => !selectedRowKeys.includes(key as string | number),
    );
    if (context.helpers.setSelectedRowKeys) {
      context.helpers.setSelectedRowKeys(invertedKeys as (string | number)[]);
    }
  },
});
