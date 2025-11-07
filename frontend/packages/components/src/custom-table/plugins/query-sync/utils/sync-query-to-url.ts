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

/**
 * 同步查询参数到URL的辅助函数
 */

/**
 * 更新React Router的searchParams
 */
export function updateSearchParams<QueryType extends Record<string, unknown>>(
  searchParams: URLSearchParams,
  context: QuerySyncContext<QueryType>,
): void {
  if (!context.setSearchParams) {
    return;
  }

  // 如果 resetEmptyData 被设置为 false（表明 reset 不应清空），则保留原 URL 中的参数未被 query 映射覆盖
  if (context && context.resetEmptyData === false) {
    // merge with existing context.searchParams to avoid dropping params
    const merged = new URLSearchParams(
      context.searchParams?.toString?.() || '',
    );
    for (const [k, v] of searchParams.entries()) {
      merged.set(k, v);
    }
    context.setSearchParams(merged);
  } else {
    context.setSearchParams(searchParams);
  }
}

/**
 * 同步查询参数到URL
 */
export function syncQueryToUrl<QueryType extends Record<string, unknown>>(
  queryParam: Record<string, unknown> | undefined,
  config: QuerySyncConfig,
  context: QuerySyncContext<QueryType>,
): void {
  const { href: _currentUrl } = window.location;
  const { href: _oldUrl } = window.location;

  // 🚨 重要调试：记录syncQueryToUrl被调用的堆栈信息
  const { stack } = new Error();

  // 同时输出到console以便立即看到

  if (!config.syncQueryOnSearchParams) {
    return;
  }

  if (context.resetRef.current) {
    return;
  }

  try {
    // Preserve existing URL params by default, so that on reset (non-empty reset) we don't drop initial params (e.g., datasource_type)
    const baseSearch =
      (typeof window !== 'undefined' && window.location?.search) ||
      context.searchParams?.toString?.() ||
      '';
    const searchParams = new URLSearchParams(baseSearch);
    const query = queryParam || context.query || {};

    // 🔧 关键修复：如果query为空对象，但URL中已有参数，保持现有参数
    const currentUrlParams = new URLSearchParams(window.location.search);
    const hasCurrentParams = currentUrlParams.toString() !== '';
    const isQueryEmpty = Object.keys(query).length === 0;

    // 如果query为空但URL中有参数，保持现有参数不变
    if (hasCurrentParams && isQueryEmpty) {
      return; // 直接返回，不做任何URL修改
    }

    // 处理查询参数
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        const formatter = config.querySearchParamsFormat?.[key];
        let formattedValue: string;
        if (formatter) {
          formattedValue = formatter(value);
        } else if (typeof value === 'object' && value !== null) {
          formattedValue = JSON.stringify(value);
        } else if (typeof value === 'string') {
          formattedValue = value;
        } else if (typeof value === 'number' || typeof value === 'boolean') {
          formattedValue = String(value);
        } else {
          formattedValue = JSON.stringify(value);
        }

        searchParams.set(key, formattedValue);
      }
    });

    const newSearch = searchParams.toString();
    const {
      href: windowLocationHref,
      search: _windowLocationSearch,
      pathname: windowLocationPathname,
    } = window.location;
    const newUrl = `${window.location.origin}${windowLocationPathname}${
      newSearch ? `?${newSearch}` : ''
    }${window.location.hash}`;

    if (windowLocationHref !== newUrl) {
      // 使用 history.replaceState 更新URL
      window.history.replaceState(window.history.state, '', newUrl);

      // 同时更新 React Router 的 searchParams
      updateSearchParams(searchParams, context);
    }
  } catch (error: unknown) {
    // ✅ 正确：使用 resetLogCollector 记录错误，并透出实际错误信息
    // 记录错误但不中断流程（URL同步失败不应影响主流程）
    const errorObj = error instanceof Error ? error : new Error(String(error));
    resetLogCollector.log({
      component: 'QuerySyncUtils',
      method: 'syncQueryToUrl',
      action: 'error',
      data: {
        error: errorObj.message,
        stack: errorObj.stack,
      },
    });
  }
}
