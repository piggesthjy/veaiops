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

import type { QuerySyncConfig, QuerySyncContext } from '@/custom-table/types';
import { resetLogCollector } from '@/custom-table/utils';
import type { BaseQuery } from '@veaiops/types';

/**
 * 重置查询参数的辅助函数
 */

/**
 * 重置查询参数
 * 🔧 修复：使用 initQuery 而不是空对象，确保重置到初始状态
 * 🎯 边界case处理：
 * - initQuery 为空对象或 undefined：重置为空对象
 * - preservedFields 与 initQuery 合并：preservedFields 优先级更高
 * - querySearchParamsFormat 格式化 URL 参数
 * - 数组参数的 URL 同步
 * - 认证参数的保留
 * - syncQueryOnSearchParams 为 false 时不同步到 URL
 */
export function resetQuery<QueryType extends Record<string, unknown>>(
  config: QuerySyncConfig,
  context: QuerySyncContext<QueryType>,
  resetEmptyData = false,
  preservedFields?: Record<string, unknown>,
): void {
  // 🔍 获取 initQuery（可能为空对象或 undefined）
  const baseInitQuery = config.initQuery || ({} as QueryType);

  // 🔧 合并 preservedFields（preservedFields 优先级更高）
  const resetTargetQuery = {
    ...baseInitQuery,
    ...(preservedFields || {}),
  } as QueryType;

  resetLogCollector.log({
    component: 'QuerySyncUtils',
    method: 'resetQuery',
    action: 'start',
    data: {
      resetEmptyData,
      customReset: Boolean(config.customReset),
      hasInitQuery: Boolean(config.initQuery),
      initQuery: config.initQuery,
      preservedFields,
      resetTargetQuery,
      currentQuery: context.query,
      currentUrl: window.location.href,
    },
  });

  try {
    const { customReset } = config;

    context.resetRef.current = true;

    if (customReset) {
      resetLogCollector.log({
        component: 'QuerySyncUtils',
        method: 'resetQuery',
        action: 'call',
        data: {
          method: 'customReset',
          resetEmptyData,
          initQuery: config.initQuery,
          preservedFields,
          resetTargetQuery,
        },
      });
      customReset({
        resetEmptyData,
        setQuery: (
          query: QueryType | ((prev: QueryType) => QueryType),
        ): void => {
          // QueryType extends BaseQuery, so we can safely cast
          context.setQuery(
            query as BaseQuery | ((prev: BaseQuery) => BaseQuery) as any,
          );
        },
        initQuery: config.initQuery,
        preservedFields,
      } as any);
    } else {
      resetLogCollector.log({
        component: 'QuerySyncUtils',
        method: 'resetQuery',
        action: 'call',
        data: {
          method: 'default reset',
          initQuery: config.initQuery,
          resetTargetQuery,
          currentQuery: context.query,
        },
      });
      // 🔧 修复：重置到 initQuery 而不是空对象
      context.setQuery(resetTargetQuery);
    }

    // 🔧 同步 URL 参数到 resetTargetQuery（保留认证参数）
    // 🎯 边界case：如果 syncQueryOnSearchParams 为 false，不同步到 URL
    if (!config.syncQueryOnSearchParams) {
      resetLogCollector.log({
        component: 'QuerySyncUtils',
        method: 'resetQuery',
        action: 'call',
        data: {
          method: 'skipUrlSync',
          reason: 'syncQueryOnSearchParams is false',
        },
      });
    } else {
      try {
        const newParams = new URLSearchParams();

        // 保留认证参数
        if (config.authQueryPrefixOnSearchParams) {
          const currentParams = new URLSearchParams(window.location.search);
          for (const [key, value] of currentParams.entries()) {
            if (key in config.authQueryPrefixOnSearchParams) {
              newParams.set(key, value);
            }
          }
        }

        // 🔧 将 resetTargetQuery 中的非空值同步到 URL
        // 🎯 边界case：考虑 querySearchParamsFormat 格式化
        if (resetTargetQuery && typeof resetTargetQuery === 'object') {
          Object.entries(resetTargetQuery).forEach(([key, value]) => {
            // 跳过认证参数
            if (
              config.authQueryPrefixOnSearchParams &&
              key in config.authQueryPrefixOnSearchParams
            ) {
              return;
            }

            // 🎯 边界case：跳过空值（undefined、null、空字符串）
            if (value === undefined || value === null || value === '') {
              return;
            }

            // 🎯 边界case：使用 querySearchParamsFormat 格式化（如果存在）
            let formattedValue: string;
            const formatter = config.querySearchParamsFormat?.[key];
            if (formatter) {
              formattedValue = formatter(value);
            } else if (Array.isArray(value)) {
              // 🎯 边界case：数组参数，每个元素单独添加
              value.forEach((item) => {
                newParams.append(key, String(item));
              });
              return; // 数组已经处理，跳过后续单个值的设置
            } else if (typeof value === 'object' && value !== null) {
              // 🎯 边界case：对象值（但不是数组），序列化为 JSON
              formattedValue = JSON.stringify(value);
            } else if (typeof value === 'string') {
              formattedValue = value;
            } else {
              // 🎯 边界case：数字、布尔值等，转换为字符串
              formattedValue = String(value);
            }

            newParams.set(key, formattedValue);
          });
        }

        // 构建新的 URL
        const { origin, pathname, hash } = window.location;
        const newUrlParams = newParams.toString();
        const newUrl = newUrlParams
          ? `${origin}${pathname}?${newUrlParams}${hash}`
          : `${origin}${pathname}${hash}`;

        resetLogCollector.log({
          component: 'QuerySyncUtils',
          method: 'resetQuery',
          action: 'call',
          data: {
            method: 'syncUrlParams',
            oldUrl: window.location.href,
            newUrl,
            newParams: newUrlParams,
            resetTargetQuery,
            hasQuerySearchParamsFormat: Boolean(config.querySearchParamsFormat),
          },
        });

        // 使用 history.replaceState 更新URL参数
        window.history.replaceState(window.history.state, '', newUrl);

        // 同时更新 React Router 的 searchParams
        if (context.setSearchParams) {
          context.setSearchParams(newParams);
        }
      } catch (error: unknown) {
        const errorObj =
          error instanceof Error ? error : new Error(String(error));
        resetLogCollector.log({
          component: 'QuerySyncUtils',
          method: 'resetQuery',
          action: 'error',
          data: {
            error: errorObj.message,
            stack: errorObj.stack,
            context: 'clearUrlParams',
          },
        });
      }
    }

    // 延迟重置标志
    setTimeout(() => {
      context.resetRef.current = false;
      resetLogCollector.log({
        component: 'QuerySyncUtils',
        method: 'resetQuery',
        action: 'call',
        data: {
          method: 'resetFlag',
          resetRef: false,
        },
      });
    }, 100);

    resetLogCollector.log({
      component: 'QuerySyncUtils',
      method: 'resetQuery',
      action: 'end',
      data: {
        success: true,
        resetEmptyData,
        initQuery: config.initQuery,
        resetTargetQuery,
        finalQuery: context.query,
        finalUrl: window.location.href,
      },
    });
  } catch (error: unknown) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    const errorMessage = errorObj.message;
    const errorStack = errorObj.stack;
    resetLogCollector.log({
      component: 'QuerySyncUtils',
      method: 'resetQuery',
      action: 'error',
      data: {
        error: errorMessage,
        stack: errorStack,
      },
    });
    throw errorObj;
  }
}
