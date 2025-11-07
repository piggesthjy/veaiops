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
 * CustomTable 筛选和排序操作 Hook
 * 负责处理筛选、排序、查询相关的所有操作
 *

 * @date 2025-12-19
 */
import type {
  BaseQuery,
  BaseRecord,
  PluginContext,
} from '@/custom-table/types';
import type { SorterInfo } from '@arco-design/web-react/es/Table/interface';

/**
 * @name 筛选和排序操作相关的实例方法
 */
export interface FilterActionMethods<QueryType extends BaseQuery> {
  // 筛选操作
  /** @name 设置筛选条件 */
  setFilters: (newFilters: Record<string, (string | number)[]>) => void;
  /** @name 清除筛选条件 */
  clearFilters: () => void;
  /** @name 获取筛选条件 */
  getFilters: () => Record<string, (string | number)[]>;
  /** @name 重置筛选条件 */
  resetFilters: () => void;
  /** @name 应用筛选条件 */
  applyFilters: (filters: Record<string, (string | number)[]>) => void;

  // 排序操作
  /** @name 设置排序条件 */
  setSorter: (newSorter: SorterInfo) => void;
  /** @name 清除排序条件 */
  clearSorter: () => void;
  /** @name 重置排序条件 */
  resetSorter: () => void;
  /** @name 获取排序条件 */
  getSorter: () => SorterInfo;

  // 查询操作
  /** @name 设置查询参数 */
  setQuery: (query: Partial<BaseQuery>) => void;
  /** @name 获取查询参数 */
  getQuery: () => QueryType;
  /** @name 重置查询参数 */
  resetQuery: () => void;
  /** @name 合并查询参数 */
  mergeQuery: (query: Partial<BaseQuery>) => void;
}

/**
 * @name 创建筛选和排序操作方法
 * @description 基于 pro-components 筛选和排序设计模式
 */
export const createFilterActions = <
  RecordType extends BaseRecord = BaseRecord,
  QueryType extends BaseQuery = BaseQuery,
>(
  context: PluginContext<RecordType, QueryType>,
  state: {
    filters: Record<string, (string | number)[]>;
    sorter: SorterInfo;
  },
): FilterActionMethods<QueryType> => {
  const { filters, sorter } = state;

  return {
    // 筛选操作
    /** @name 设置筛选条件 */
    setFilters: (newFilters: Record<string, (string | number)[]>) =>
      context.helpers.setFilters(newFilters),

    /** @name 清除筛选条件 */
    clearFilters: () => context.helpers.setFilters({}),

    /** @name 获取筛选条件 */
    getFilters: () => filters,

    /** @name 重置筛选条件 */
    resetFilters: () => context.helpers.setFilters({}),

    /** @name 应用筛选条件 */
    applyFilters: (filters: Record<string, (string | number)[]>) =>
      context.helpers.setFilters(filters),

    // 排序操作
    /** @name 设置排序条件 */
    setSorter: (newSorter: SorterInfo) =>
      context.helpers.setSorter?.(newSorter),

    /** @name 清除排序条件 */
    clearSorter: () => context.helpers.setSorter?.({}),

    /** @name 重置排序条件 */
    resetSorter: () => context.helpers.setSorter?.({}),

    /** @name 获取排序条件 */
    getSorter: () => sorter,

    // 查询操作
    /** @name 设置查询参数 */
    setQuery: (query: Partial<BaseQuery>) =>
      context.helpers.setQuery(query as QueryType),

    /** @name 获取查询参数 */
    getQuery: () => context.state.query,

    /** @name 重置查询参数 */
    resetQuery: () => context.helpers.setQuery({} as QueryType),

    /** @name 合并查询参数 */
    mergeQuery: (query: Partial<BaseQuery>) => {
      const currentQuery = context.state.query;
      context.helpers.setQuery({ ...currentQuery, ...query });
    },
  };
};
