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

import type { BaseQuery, BaseRecord } from '@/custom-table/types/core';
import type {
  TableState,
  TableStateActions,
  UseTableStateProps,
  UseTableStateReturn,
} from '@/custom-table/types/hooks/table-state';
import type { SorterInfo } from '@arco-design/web-react/es/Table/interface';
import { useCallback, useRef, useState } from 'react';
/**
 * useTableState Hook
 * 参考 pro-components 设计，提供表格状态管理能力
 *

 *
 */

/**
 * useTableState - 表格状态管理 Hook
 * 提供完整的表格状态管理能力，参考 pro-components 设计
 */
export function useTableState<
  RecordType extends BaseRecord = BaseRecord,
  QueryType extends BaseQuery = BaseQuery,
>(
  props: UseTableStateProps<RecordType, QueryType> = {},
): UseTableStateReturn<RecordType, QueryType> {
  const {
    initialDataSource = [],
    initialQuery = {} as QueryType,
    initialCurrent = 1,
    initialPageSize = 10,
    defaultQuery = {} as QueryType,
    defaultPageSize = 10,
    defaultCurrent = 1,
  } = props;

  // 状态定义
  const [dataSource, setDataSource] = useState<RecordType[]>(initialDataSource);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const [current, setCurrent] = useState(initialCurrent);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [total, setTotal] = useState(0);

  const [query, setQuery] = useState<QueryType>(initialQuery);
  const [filters, setFilters] = useState<Record<string, (string | number)[]>>(
    {},
  );
  const [sorter, setSorter] = useState<SorterInfo>({});

  const [selectedRowKeys, setSelectedRowKeys] = useState<(string | number)[]>(
    [],
  );
  const [expandedRowKeys, setExpandedRowKeys] = useState<(string | number)[]>(
    [],
  );

  const [resetEmptyData, setResetEmptyData] = useState(false);

  // 状态快照引用
  const stateRef = useRef<TableState<RecordType, QueryType>>(
    {} as TableState<RecordType, QueryType>,
  );

  // 更新状态引用
  const updateStateRef = useCallback(() => {
    stateRef.current = {
      dataSource,
      formattedTableData: dataSource, // 暂时使用相同的数据
      loading,
      error,
      current,
      pageSize,
      total,
      tableTotal: total, // 使用相同的总数
      query,
      filters,
      sorter,
      selectedRowKeys,
      expandedRowKeys,
      resetEmptyData,
    };
  }, [
    dataSource,
    loading,
    error,
    current,
    pageSize,
    total,
    query,
    filters,
    sorter,
    selectedRowKeys,
    expandedRowKeys,
    resetEmptyData,
  ]);

  // 实时更新状态引用
  updateStateRef();

  // 重置操作
  const reset = useCallback(
    (options: { resetEmptyData?: boolean } = {}) => {
      setDataSource([]);
      setLoading(false);
      setError(null);
      setCurrent(defaultCurrent);
      setPageSize(defaultPageSize);
      setTotal(0);
      setQuery(defaultQuery);
      setFilters({});
      setSorter({});
      setSelectedRowKeys([]);
      setExpandedRowKeys([]);

      if (options.resetEmptyData) {
        setResetEmptyData(true);
      }
    },
    [defaultCurrent, defaultPageSize, defaultQuery],
  );

  // 增强的 setQuery 支持函数式更新
  const enhancedSetQuery = useCallback(
    (newQuery: QueryType | ((prev: QueryType) => QueryType)) => {
      if (typeof newQuery === 'function') {
        setQuery((prev) => newQuery(prev));
      } else {
        setQuery(newQuery);
      }
    },
    [],
  );

  const state: TableState<RecordType, QueryType> = {
    dataSource,
    formattedTableData: dataSource, // 暂时使用相同的数据
    loading,
    error,
    current,
    pageSize,
    total,
    tableTotal: total, // 使用相同的总数
    query,
    filters,
    sorter,
    selectedRowKeys,
    expandedRowKeys,
    resetEmptyData,
  };

  const actions: TableStateActions<RecordType, QueryType> = {
    // 数据操作
    setDataSource,
    setLoading,
    setError,

    // 分页操作
    setCurrent,
    setPageSize,
    setTotal,
    setTableTotal: setTotal, // tableTotal和total使用相同的setter

    // 查询操作
    setQuery: enhancedSetQuery,
    setFilters,
    setSorter,

    // 选择操作
    setSelectedRowKeys,
    setExpandedRowKeys,

    // 其他操作
    setResetEmptyData,

    // 组合操作
    reset,
    updatePagination: (pagination: {
      current?: number;
      pageSize?: number;
      total?: number;
    }) => {
      if (pagination.current !== undefined) {
        setCurrent(pagination.current);
      }
      if (pagination.pageSize !== undefined) {
        setPageSize(pagination.pageSize);
      }
      if (pagination.total !== undefined) {
        setTotal(pagination.total);
      }
    },
    updateQuery: (newQuery: Partial<QueryType>) => {
      enhancedSetQuery((prev) => ({ ...prev, ...newQuery }));
    },
  };

  return {
    state,
    actions,
    stateRef,
  };
}
