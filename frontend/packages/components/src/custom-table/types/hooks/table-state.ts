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

import type { SorterInfo } from '@arco-design/web-react/es/Table/interface';
/**
 * Table State Hook 相关类型定义
 */
import type React from 'react';
import type { BaseQuery, BaseRecord } from '../core';

/**
 * 表格状态接口
 */
export interface TableState<
  RecordType extends BaseRecord = BaseRecord,
  QueryType extends BaseQuery = BaseQuery,
> {
  // 数据状态
  dataSource: RecordType[];
  formattedTableData: RecordType[];
  loading: boolean;
  error: Error | null;

  // 分页状态
  current: number;
  pageSize: number;
  total: number;
  tableTotal: number;

  // 查询状态
  query: QueryType;
  filters: Record<string, (string | number)[]>;
  sorter: SorterInfo;

  // 选择状态
  selectedRowKeys: (string | number)[];
  expandedRowKeys: (string | number)[];

  // 其他状态
  resetEmptyData: boolean;
}

/**
 * 表格状态操作接口
 */
export interface TableStateActions<
  RecordType extends BaseRecord = BaseRecord,
  QueryType extends BaseQuery = BaseQuery,
> {
  // 数据操作
  setDataSource: (dataSource: RecordType[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: Error | null) => void;

  // 分页操作
  setCurrent: (current: number) => void;
  setPageSize: (pageSize: number) => void;
  setTotal: (total: number) => void;
  setTableTotal: (tableTotal: number) => void;

  // 查询操作
  setQuery: (query: QueryType | ((prev: QueryType) => QueryType)) => void;
  setFilters: (filters: Record<string, (string | number)[]>) => void;
  setSorter: (sorter: SorterInfo) => void;

  // 选择操作
  setSelectedRowKeys: (keys: (string | number)[]) => void;
  setExpandedRowKeys: (keys: (string | number)[]) => void;

  // 其他操作
  setResetEmptyData: (reset: boolean) => void;

  // 组合操作
  reset: () => void;
  updatePagination: (pagination: {
    current?: number;
    pageSize?: number;
    total?: number;
  }) => void;
  updateQuery: (newQuery: Partial<QueryType>) => void;
}

/**
 * useTableState Hook Props
 */
export interface UseTableStateProps<
  RecordType extends BaseRecord = BaseRecord,
  QueryType extends BaseQuery = BaseQuery,
> {
  // 初始状态
  initialDataSource?: RecordType[];
  initialQuery?: QueryType;
  initialCurrent?: number;
  initialPageSize?: number;

  // 配置选项
  defaultQuery?: QueryType;
  defaultPageSize?: number;
  defaultCurrent?: number;

  onStateChange?: (state: TableState<RecordType, QueryType>) => void;
}

/**
 * useTableState Hook 返回值
 */
export interface UseTableStateReturn<
  RecordType extends BaseRecord = BaseRecord,
  QueryType extends BaseQuery = BaseQuery,
> {
  state: TableState<RecordType, QueryType>;
  actions: TableStateActions<RecordType, QueryType>;
  stateRef: React.MutableRefObject<TableState<RecordType, QueryType>>;
}
