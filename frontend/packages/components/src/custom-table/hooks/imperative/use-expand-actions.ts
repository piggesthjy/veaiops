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
 * CustomTable 展开操作 Hook
 * 负责处理行展开/收起相关的所有操作
 *

 * @date 2025-12-19
 */
import type {
  BaseQuery,
  BaseRecord,
  PluginContext,
} from '@/custom-table/types';

/**
 * @name 展开操作相关的实例方法
 */
export interface ExpandActionMethods {
  /** @name 设置展开的行 */
  setExpandedRows: (keys: (string | number)[]) => void;
  /** @name 获取展开的行键 */
  getExpandedRowKeys: () => (string | number)[];
  /** @name 展开所有行 */
  expandAll: () => void;
  /** @name 收起所有行 */
  collapseAll: () => void;
}

/**
 * @name 创建展开操作方法
 * @description 基于 pro-components 和 Arco Design 展开设计模式
 */
export const createExpandActions = <
  RecordType extends BaseRecord = BaseRecord,
  QueryType extends BaseQuery = BaseQuery,
>(
  context: PluginContext<RecordType, QueryType>,
  formattedTableData: RecordType[],
): ExpandActionMethods => ({
  /** @name 设置展开的行 */
  setExpandedRows: (keys: (string | number)[]) => {
    // 设置展开的行键
    if (context.helpers.setExpandedRowKeys) {
      context.helpers.setExpandedRowKeys(keys);
    }
  },

  /** @name 获取展开的行键 */
  getExpandedRowKeys: () => context.state.expandedRowKeys || [],

  /** @name 展开所有行 */
  expandAll: () => {
    // 展开所有行 - 获取所有数据的 rowKey
    const allKeys = formattedTableData.map((record) => {
      const { rowKey } = context.props;
      return typeof rowKey === 'function'
        ? rowKey(record)
        : (record as Record<string, unknown>)[rowKey || 'id'];
    });
    if (context.helpers.setExpandedRowKeys) {
      context.helpers.setExpandedRowKeys(allKeys as (string | number)[]);
    }
  },

  /** @name 收起所有行 */
  collapseAll: () => {
    // 收起所有行 - 清空展开键数组
    if (context.helpers.setExpandedRowKeys) {
      context.helpers.setExpandedRowKeys([]);
    }
  },
});
