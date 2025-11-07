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
import { useSearchParams } from '@modern-js/runtime/router';

/**
 * CustomTable 状态管理 Hook
 * 负责处理表格的基础状态管理
 *

 * @date 2025-12-19
 */
import type { BaseQuery } from '@/custom-table/types';
import { logger } from '@veaiops/utils';
import type { Dispatch, SetStateAction } from 'react';
import { useCallback, useRef, useState } from 'react';

/**
 * @name 表格状态集合
 */
export interface TableState<QueryType extends BaseQuery> {
  // 分页状态
  current: number;
  setCurrent: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;

  // 查询状态
  query: QueryType;
  setQuery: Dispatch<SetStateAction<QueryType>>;

  // 排序状态
  sorter: SorterInfo;
  setSorter: (sorter: SorterInfo) => void;

  // URL参数状态
  searchParams: URLSearchParams;
  setSearchParams: (params: URLSearchParams) => void;

  // 其他状态
  resetEmptyData: boolean;
  setResetEmptyData: (reset: boolean) => void;
  expandedRowKeys: (string | number)[];
  setExpandedRowKeys: (keys: (string | number)[]) => void;

  // 标记状态
  isQueryChangeRef: React.MutableRefObject<boolean>;
}

/**
 * @name 状态管理配置
 */
export interface TableStateConfig<QueryType extends BaseQuery> {
  /** @name 初始查询参数 */
  initQuery?: Partial<QueryType>;
  /** @name 分页配置 */
  pagination?: { pageSize?: number };
}

/**
 * @name 创建表格状态管理
 * @description 提供表格所需的所有基础状态管理
 */
export const useTableState = <QueryType extends BaseQuery = BaseQuery>(
  config: TableStateConfig<QueryType> = {},
): TableState<QueryType> => {
  const { initQuery = {}, pagination = {} } = config;

  // 🔍 记录 useTableState 初始化
  logger.info({
    message: '[useTableState] ========== 初始化开始 ==========',
    data: {
      initQuery,
      initQueryKeys: Object.keys(initQuery),
      initQueryDatasourceType: (initQuery as Record<string, unknown>)
        .datasource_type,
      pagination,
      timestamp: new Date().toISOString(),
    },
    source: 'CustomTable',
    component: 'useTableState/init',
  });

  // 基础状态管理
  const [current, setCurrent] = useState(1);
  const [pageSize, setPageSize] = useState(
    (typeof pagination === 'object' && pagination?.pageSize) || 10,
  );
  const [query, setQueryState] = useState(initQuery as QueryType);

  // 🔍 记录初始 query 状态
  logger.info({
    message: '[useTableState] 初始 query 状态',
    data: {
      initialQuery: query,
      initialQueryKeys: Object.keys(query),
      initialQueryDatasourceType: query.datasource_type,
      timestamp: new Date().toISOString(),
    },
    source: 'CustomTable',
    component: 'useTableState/initialState',
  });
  const [sorter, setSorterState] = useState<SorterInfo>({} as SorterInfo);
  const [searchParams, setSearchParams] = useSearchParams();
  const [resetEmptyData, setResetEmptyData] = useState(false);

  // 包装 setSorter 以添加日志
  const setSorter = useCallback(
    (newSorter: SorterInfo | ((prev: SorterInfo) => SorterInfo)) => {
      logger.log({
        message: 'setSorter called',
        data: {
          newSorter,
          currentSorter: sorter,
        },
        source: 'CustomTable',
        component: 'useTableState',
      });
      if (typeof newSorter === 'function') {
        setSorterState((prevSorter) => {
          const updatedSorter = newSorter(prevSorter);
          logger.log({
            message: 'setSorter updated',
            data: {
              prevSorter,
              updatedSorter,
            },
            source: 'CustomTable',
            component: 'useTableState',
          });
          return updatedSorter;
        });
      } else {
        setSorterState(newSorter);
        logger.log({
          message: 'setSorter updated (direct)',
          data: {
            newSorter,
          },
          source: 'CustomTable',
          component: 'useTableState',
        });
      }
    },
    [sorter],
  );

  // 🔍 包装setQuery以添加日志
  // ⚠️ 修复：使用 useRef 获取最新 query，避免依赖数组导致循环
  const queryRef = useRef(query);
  queryRef.current = query;

  const setQuery = useCallback<Dispatch<SetStateAction<QueryType>>>(
    (newQuery) => {
      if (typeof newQuery === 'function') {
        setQueryState((prevQuery) => {
          const updatedQuery = newQuery(prevQuery);

          // 只在真正需要更新时才记录日志（避免日志过多）
          const prevQueryStr = JSON.stringify(prevQuery);
          const updatedQueryStr = JSON.stringify(updatedQuery);
          if (prevQueryStr !== updatedQueryStr) {
            // 🔍 记录函数式更新
            logger.info({
              message: '[useTableState] setQuery 函数式更新',
              data: {
                prevQueryKeys: Object.keys(prevQuery || {}),
                prevQueryDatasourceType: prevQuery?.datasource_type,
                updatedQueryKeys: Object.keys(updatedQuery || {}),
                updatedQueryDatasourceType: updatedQuery?.datasource_type,
                updatedQueryDatasourceTypeType:
                  typeof updatedQuery?.datasource_type,
                timestamp: new Date().toISOString(),
              },
              source: 'CustomTable',
              component: 'useTableState/setQuery',
            });
          }

          return updatedQuery;
        });
      } else {
        // 只在真正需要更新时才记录日志和更新（避免循环）
        const prevQuery = queryRef.current;
        const prevQueryStr = JSON.stringify(prevQuery);
        const newQueryStr = JSON.stringify(newQuery);

        if (prevQueryStr !== newQueryStr) {
          // 🔍 记录直接更新
          logger.info({
            message: '[useTableState] setQuery 直接更新',
            data: {
              prevQueryKeys: Object.keys(prevQuery || {}),
              prevQueryDatasourceType: prevQuery?.datasource_type,
              newQueryKeys: Object.keys(newQuery || {}),
              newQueryDatasourceType: newQuery?.datasource_type,
              newQueryDatasourceTypeType: typeof newQuery?.datasource_type,
              timestamp: new Date().toISOString(),
            },
            source: 'CustomTable',
            component: 'useTableState/setQuery',
          });

          setQueryState(newQuery);
        }
      }
    },
    // ⚠️ 修复：移除 query 依赖，使用 useRef 获取最新值（避免循环）
    [],
  );

  // 展开行状态管理 - 参考 pro-components 设计
  const [expandedRowKeys, setExpandedRowKeys] = useState<(string | number)[]>(
    [],
  );

  // 查询变更标记
  const isQueryChangeRef = useRef<boolean>(false);

  return {
    // 分页状态
    current,
    setCurrent,
    pageSize,
    setPageSize,

    // 查询状态
    query,
    setQuery,

    // 排序状态
    sorter,
    setSorter,

    // URL参数状态
    searchParams,
    setSearchParams,

    // 其他状态
    resetEmptyData,
    setResetEmptyData,
    expandedRowKeys,
    setExpandedRowKeys,

    // 标记状态
    isQueryChangeRef,
  };
};
