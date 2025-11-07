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
 * TableHelpers 相关类型定义
 * 从 hooks/internal/use-table-helpers.ts 迁移而来
 */

import type { SorterInfo } from '@arco-design/web-react/es/Table/interface';
import type { BaseQuery } from './common';

/**
 * @name Helper 方法集合
 */
export interface TableHelpers<QueryType extends BaseQuery> {
  /** @name 处理查询和筛选变更 */
  handleChange: {
    (key: string, value: unknown): void;
    (object: Record<string, unknown>): void;
  };
  /** @name 重置表格状态 */
  reset: (options?: { resetEmptyData?: boolean }) => void;
  /** @name 设置当前页 */
  setCurrent: (page: number) => void;
  /** @name 设置页面大小 */
  setPageSize: (size: number) => void;
  /** @name 设置排序 */
  setSorter: (sorter: SorterInfo) => void;
  /** @name 设置查询参数 */
  setQuery: (query: QueryType | ((prev: QueryType) => QueryType)) => void;
  /** @name 设置筛选条件 */
  setFilters: (filters: Record<string, (string | number)[]>) => void;
  /** @name 设置加载状态 */
  setLoading: (loading: boolean) => void;
  /** @name 设置错误状态 */
  setError: (error: Error | null) => void;
  /** @name 设置重置空数据状态 */
  setResetEmptyData: (reset: boolean) => void;
  /** @name 设置展开行键 */
  setExpandedRowKeys: (keys: (string | number)[]) => void;
  /** @name 加载更多数据 */
  loadMoreData: () => void;
  /** @name 运行查询 */
  run?: () => void;
}

/**
 * @name Helper 配置接口
 */
export interface TableHelpersConfig<QueryType extends BaseQuery> {
  /** @name 初始查询参数 */
  initQuery: Partial<QueryType>;
  /** @name 筛选重置保留字段 */
  filterResetKeys?: string[];
  /** @name 查询同步相关方法 */
  querySync?: {
    resetQuery?: (resetEmptyData: boolean) => void;
  };
  /** @name 数据源相关方法 */
  dataSourceMethods?: {
    setLoading?: (loading: boolean) => void;
    setError?: (error: Error | null) => void;
    setResetEmptyData?: (reset: boolean) => void;
    setExpandedRowKeys?: (keys: (string | number)[]) => void;
    loadMoreData?: () => void;
    run?: () => void;
  };
  /** @name 分页相关方法 */
  paginationMethods?: {
    setCurrent?: (page: number) => void;
    setPageSize?: (size: number) => void;
  };
}

/**
 * Helper 工具函数类型
 */
export type CreateTypedQuery = <QueryType extends BaseQuery>(
  query: Partial<QueryType> | Record<string, unknown>,
) => QueryType;
