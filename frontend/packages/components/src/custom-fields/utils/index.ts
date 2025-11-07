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

import type { ModernTableColumnProps } from '@/shared/types';

// 为了向后兼容，创建类型别名
type CustomTableColumnProps<T = any> = ModernTableColumnProps<T>;

/**
 * 获取树形列的数据索引
 * @param columns 基础的列配置
 * @param condition dataIndex是否可以选中的判断函数
 * @returns 所有符合条件的dataIndex数组
 */
export const getTreeColumnsDataIndex = (
  columns: CustomTableColumnProps[],
  condition?: (dataIndex: string) => boolean,
): string[] => {
  const fields: string[] = [];

  const getColumnDataIndex = (column: CustomTableColumnProps) => {
    const { dataIndex, children } = column;

    if (Array.isArray(children)) {
      // 如果有下一层，则继续递归
      children.forEach(getColumnDataIndex);
    } else if (dataIndex) {
      // 根据条件判断是否加入fields
      if (typeof condition === 'function') {
        if (condition(dataIndex)) {
          fields.push(dataIndex);
        }
      } else {
        // 没有条件函数，直接加入
        fields.push(dataIndex);
      }
    }
  };

  columns.forEach(getColumnDataIndex);
  return fields;
};

/**
 * 按字段排序列配置
 * @param columns 列配置
 * @param fields 排序字段数组
 * @param addNoSelected 是否添加未选择的字段
 * @returns 排序后的列配置
 */
export const sortColumnsByFields = <T>({
  columns,
  fields,
  addNoSelected = false,
}: {
  columns: CustomTableColumnProps<T>[];
  fields: string[];
  addNoSelected?: boolean;
}): CustomTableColumnProps<T>[] => {
  const sortedColumns: CustomTableColumnProps<T>[] = [];
  const remainingColumns: CustomTableColumnProps<T>[] = [];

  // 先添加指定字段的列
  fields.forEach((field) => {
    const column = columns.find((col) => col.dataIndex === field);
    if (column) {
      sortedColumns.push(column);
    }
  });

  // 如果需要添加未选择的字段
  if (addNoSelected) {
    columns.forEach((column) => {
      if (!fields.includes(column.dataIndex as string)) {
        remainingColumns.push(column);
      }
    });
  }

  return [...sortedColumns, ...remainingColumns];
};
