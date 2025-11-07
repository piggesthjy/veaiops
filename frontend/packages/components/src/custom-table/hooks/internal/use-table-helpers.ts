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
import { logger } from '@veaiops/utils';

import type { BaseQuery } from '@/custom-table/types';
import { resetLogCollector } from '@/custom-table/utils/reset-log-collector';
/**
 * CustomTable Helper 方法 Hook
 * 负责处理表格的各种操作方法
 *

 * @date 2025-12-19
 */
import { useCallback } from 'react';
import type { TableState } from './use-table-state';

// 类型安全的查询类型创建函数
const createTypedQuery = <QueryType extends BaseQuery>(
  query: Partial<QueryType> | Record<string, unknown>,
): QueryType => query as QueryType;

/**
 * 处理查询和筛选变更的参数接口
 */
export interface HandleChangeSingleParams {
  key: string;
  value?: unknown;
}

/**
 * 处理查询和筛选变更的参数接口（对象模式）
 */
export interface HandleChangeObjectParams {
  updates: Record<string, unknown>;
}

/**
 * @name Helper 方法集合
 * @deprecated 已迁移到 types/core/table-helpers.ts，请使用新的导入路径
 */
export interface TableHelpers<QueryType extends BaseQuery> {
  /** @name 处理查询和筛选变更 */
  handleChange: (
    params: HandleChangeSingleParams | HandleChangeObjectParams,
  ) => void;
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
    resetQuery?: (
      resetEmptyData: boolean,
      preservedFields?: Record<string, unknown>,
    ) => void;
  };
  /** @name 数据源相关方法 */
  dataSourceMethods?: {
    setLoading?: (loading: boolean) => void;
    setError?: (error: Error | null) => void;
    loadMoreData?: () => void;
  };
}

/**
 * @name useTableHelpers Hook 参数接口
 */
export interface UseTableHelpersParams<QueryType extends BaseQuery> {
  state: TableState<QueryType>;
  config: TableHelpersConfig<QueryType>;
  setFilters: (filters: Record<string, (string | number)[]>) => void;
}

/**
 * @name 创建表格 Helper 方法
 * @description 提供表格操作所需的所有 helper 方法
 */
export function useTableHelpers<QueryType extends BaseQuery = BaseQuery>({
  state,
  config,
  setFilters,
}: UseTableHelpersParams<QueryType>): TableHelpers<QueryType> {
  const {
    initQuery,
    filterResetKeys = [],
    querySync = {},
    dataSourceMethods = {},
  } = config;

  const {
    setCurrent,
    setPageSize,
    setSorter,
    setQuery,
    setSearchParams,
    setResetEmptyData,
    setExpandedRowKeys,
    query: finalQuery,
  } = state;

  // 处理查询和筛选变更 - 使用对象解构
  const handleChange = useCallback(
    (params: HandleChangeSingleParams | HandleChangeObjectParams) => {
      // ✅ 修复：添加类型检查，确保 params 是对象
      if (
        typeof params !== 'object' ||
        params === null ||
        Array.isArray(params)
      ) {
        logger.error({
          message: '[TableHelpers] handleChange 收到无效参数',
          data: {
            params,
            paramsType: typeof params,
            isArray: Array.isArray(params),
          },
          source: 'CustomTable',
          component: 'useTableHelpers/handleChange',
        });
        return;
      }

      // 判断参数类型
      const isSingleParam = 'key' in params;
      const keyOrObject = isSingleParam ? params.key : params.updates;
      const value = isSingleParam ? params.value : undefined;

      // 记录 handleChange 调用
      logger.info({
        message: `[TableHelpers] handleChange - key=${JSON.stringify(keyOrObject)}, value=${JSON.stringify(value)}`,
        data: {
          valueType: typeof value,
          isArray: Array.isArray(value),
        },
        source: 'CustomTable',
        component: 'useTableHelpers/handleChange',
      });

      let newQuery: QueryType;

      if (isSingleParam && typeof keyOrObject === 'string') {
        // handleChange({ key: string, value?: unknown })
        // 🔧 修复：如果 value 是空数组或 undefined，从 query 中移除该字段
        // 这样可以确保 URL 中不会保留空的筛选器参数
        const shouldRemoveField =
          value === undefined ||
          value === null ||
          (Array.isArray(value) && value.length === 0);

        // 注意：这里的 newQuery 是基于闭包中的 finalQuery 计算的
        // 可能是旧值，真正的更新会在 setQuery 函数式更新中基于最新的 prevQuery 重新计算
        newQuery = createTypedQuery<QueryType>(
          shouldRemoveField
            ? (() => {
                const { [keyOrObject]: _, ...rest } = finalQuery;
                return rest;
              })()
            : {
                ...finalQuery,
                [keyOrObject]: value,
              },
        );
      } else {
        // handleChange({ updates: Record<string, unknown> })
        // 注意：这里的 newQuery 是基于闭包中的 finalQuery 计算的
        // 可能是旧值，真正的更新会在 setQuery 函数式更新中基于最新的 prevQuery 重新计算
        const updates = !isSingleParam ? params.updates : {};
        newQuery = createTypedQuery<QueryType>({
          ...finalQuery,
          ...updates,
        });
      }

      // 🔧 关键修复：使用函数式更新确保基于最新的 query 值
      // 避免闭包问题：handleChange 中的 finalQuery 可能是旧值
      // 解决方案：在 setQuery 中基于 prevQuery（最新值）重新应用更新
      setQuery((prevQuery) => {
        // 重新基于最新的 prevQuery 计算 newQuery
        let actualNewQuery: QueryType;

        if (isSingleParam && typeof keyOrObject === 'string') {
          // 单字段更新：基于 prevQuery 而不是闭包中的 finalQuery
          const shouldRemoveField =
            value === undefined ||
            value === null ||
            (Array.isArray(value) && value.length === 0);

          actualNewQuery = createTypedQuery<QueryType>(
            shouldRemoveField
              ? (() => {
                  const { [keyOrObject]: _, ...rest } = prevQuery;
                  return rest;
                })()
              : {
                  ...prevQuery,
                  [keyOrObject]: value,
                },
          );
        } else {
          // 对象更新：合并到 prevQuery
          const updates = !isSingleParam ? params.updates : {};
          actualNewQuery = createTypedQuery<QueryType>({
            ...prevQuery,
            ...updates,
          });
        }

        logger.info({
          message: '[TableHelpers] 🔍 setQuery 函数式更新（从 handleChange）',
          data: {
            prevQuery,
            prevQueryStringified: JSON.stringify(prevQuery),
            prevQueryKeys: Object.keys(prevQuery || {}),
            params,
            actualNewQuery,
            actualNewQueryStringified: JSON.stringify(actualNewQuery),
            actualNewQueryKeys: Object.keys(actualNewQuery || {}),
            preservedKeys: Object.keys(prevQuery || {}).filter(
              (key) => key in (actualNewQuery || {}),
            ),
            addedKeys: Object.keys(actualNewQuery || {}).filter(
              (key) => !(key in (prevQuery || {})),
            ),
            removedKeys: Object.keys(prevQuery || {}).filter(
              (key) => !(key in (actualNewQuery || {})),
            ),
          },
          source: 'CustomTable',
          component: 'useTableHelpers/setQuery',
        });
        return actualNewQuery;
      });
    },
    // 🔧 修复：移除 finalQuery 依赖，避免每次 query 变化都重新创建 handleChange
    // handleChange 内部使用函数式更新，会获取最新的 prevQuery
    [setQuery],
  );

  // 重置方法
  const reset = useCallback(
    ({ resetEmptyData: newResetEmptyData = false } = {}) => {
      // 开始重置会话
      resetLogCollector.startSession();

      resetLogCollector.log({
        component: 'TableHelpers',
        method: 'reset',
        action: 'start',
        data: {
          resetEmptyData: newResetEmptyData,
          currentQuery: finalQuery,
          filterResetKeys,
          initQuery,
          hasQuerySync: Boolean(querySync.resetQuery),
        },
      });

      try {
        // 保留 filterResetKeys 中指定的字段
        const preservedFields =
          filterResetKeys.reduce(
            (acc: Record<string, unknown>, key: string) => {
              if ((finalQuery as Record<string, unknown>)[key] !== undefined) {
                acc[key] = (finalQuery as Record<string, unknown>)[key];
              }
              return acc;
            },
            {} as Record<string, unknown>,
          ) || {};

        resetLogCollector.log({
          component: 'TableHelpers',
          method: 'reset',
          action: 'call',
          data: {
            preservedFields,
            preservedFieldsCount: Object.keys(preservedFields).length,
          },
        });

        // 使用查询参数同步插件的重置方法
        if (querySync.resetQuery) {
          resetLogCollector.log({
            component: 'TableHelpers',
            method: 'reset',
            action: 'call',
            data: {
              method: 'querySync.resetQuery',
              resetEmptyData: newResetEmptyData,
              preservedFields,
              preservedFieldsCount: Object.keys(preservedFields).length,
            },
          });
          // 🔧 传递 preservedFields 给重置方法，确保与 initQuery 合并
          querySync.resetQuery(newResetEmptyData, preservedFields);
        } else {
          resetLogCollector.log({
            component: 'TableHelpers',
            method: 'reset',
            action: 'call',
            data: {
              method: 'direct reset',
              newQuery: { ...initQuery, ...preservedFields },
            },
          });
          setQuery(
            createTypedQuery<QueryType>({ ...initQuery, ...preservedFields }),
          );
          setSearchParams(new URLSearchParams());
        }

        setResetEmptyData(newResetEmptyData);

        resetLogCollector.log({
          component: 'TableHelpers',
          method: 'reset',
          action: 'end',
          data: {
            success: true,
            resetEmptyData: newResetEmptyData,
          },
        });
      } catch (_error: any) {
        // ✅ 正确：透出实际的错误信息
        const errorMessage =
          _error instanceof Error ? _error.message : String(_error);
        const errorStack = _error instanceof Error ? _error.stack : undefined;
        resetLogCollector.log({
          component: 'TableHelpers',
          method: 'reset',
          action: 'error',
          data: {
            error: errorMessage,
            stack: errorStack,
          },
        });
        // ✅ 正确：将错误转换为 Error 对象再抛出（符合 @typescript-eslint/only-throw-error 规则）
        const errorObj =
          _error instanceof Error ? _error : new Error(String(_error));
        throw errorObj;
      } finally {
        // 结束重置会话
        resetLogCollector.endSession();
      }
    },
    [
      filterResetKeys,
      finalQuery,
      initQuery,
      setSearchParams,
      querySync,
      setQuery,
      setResetEmptyData,
    ],
  );

  // 加载更多数据
  const loadMoreData = useCallback(() => {
    if (dataSourceMethods.loadMoreData) {
      dataSourceMethods.loadMoreData();
    }
  }, [dataSourceMethods.loadMoreData]);

  // 设置加载状态
  const setLoading = useCallback(
    (loading: boolean) => {
      if (dataSourceMethods.setLoading) {
        dataSourceMethods.setLoading(loading);
      }
    },
    [dataSourceMethods],
  );

  // 设置错误状态
  const setError = useCallback(
    (error: Error | null) => {
      if (dataSourceMethods.setError) {
        dataSourceMethods.setError(error);
      }
    },
    [dataSourceMethods],
  );

  return {
    handleChange,
    reset,
    setCurrent,
    setPageSize,
    setSorter,
    setQuery: (query: QueryType | ((prev: QueryType) => QueryType)) => {
      if (typeof query === 'function') {
        const currentQuery = finalQuery;
        const newQuery = query(currentQuery);
        setQuery(createTypedQuery<QueryType>(newQuery));
      } else {
        setQuery(query);
      }
    },
    setFilters,
    setLoading,
    setError,
    setResetEmptyData,
    setExpandedRowKeys,
    loadMoreData,
  };
}
