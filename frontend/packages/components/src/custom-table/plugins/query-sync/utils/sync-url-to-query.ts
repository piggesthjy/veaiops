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
import { formatQuerySync, getParamsObject } from './query-formatters';

/**
 * Sync URL search parameters to query parameters
 */
export function syncUrlToQuery<QueryType extends Record<string, unknown>>(
  config: QuerySyncConfig,
  context: QuerySyncContext<QueryType>,
): Record<string, unknown> {
  const { useActiveKeyHook = false } = config;

  // 🐛 Use logger to record detailed debug information
  const { search: windowLocationSearch } = window.location;

  // 🔍 Add detailed logging: Record URL synchronization process
  if (process.env.NODE_ENV === 'development') {
    console.log('[syncUrlToQuery] Starting to sync URL to query', {
      useActiveKeyHook,
      windowLocationSearch,
      contextSearchParams: context.searchParams.toString(),
      querySearchParamsFormat: Object.keys(
        config.querySearchParamsFormat || {},
      ),
      queryFormat: Object.keys(config.queryFormat || {}),
    });
  }

  try {
    const searchParams = useActiveKeyHook
      ? (() => {
          // 🔧 Fix: In useActiveKeyHook mode, get latest parameters directly from window.location
          const { search } = window.location;
          const windowParams = new URLSearchParams(search);

          // 🔍 Add detailed logging
          if (process.env.NODE_ENV === 'development') {
            console.log('[syncUrlToQuery] useActiveKeyHook mode', {
              search,
              windowParamsEntries: Array.from(windowParams.entries()),
              contextSearchParams: context.searchParams.toString(),
            });
          }

          // If window.location.search has parameters, use it
          if (search) {
            return windowParams;
          }

          // If window.location.search is empty but context.searchParams has parameters, use context
          const contextSearch = context.searchParams.toString();
          if (contextSearch) {
            return context.searchParams;
          }

          // Both are empty, return empty URLSearchParams

          return new URLSearchParams();
        })()
      : context.searchParams;

    const raw: Record<string, unknown> = {};

    for (const [key, value] of searchParams.entries()) {
      const { querySearchParamsFormat = {} } = config;

      // 🔍 Add detailed logging: Record conversion process for each parameter
      if (process.env.NODE_ENV === 'development' && key === 'datasource_type') {
        console.log('[syncUrlToQuery] Processing datasource_type parameter', {
          key,
          value,
          hasFormatter: Boolean(querySearchParamsFormat?.[key]),
          formatter: querySearchParamsFormat?.[key],
        });
      }

      if (querySearchParamsFormat?.[key]) {
        raw[key] = querySearchParamsFormat[key](value);
      } else {
        raw[key] = value;
      }
    }

    // 🔍 Add detailed logging: Record converted raw object
    if (process.env.NODE_ENV === 'development') {
      console.log('[syncUrlToQuery] Converted raw object', {
        raw,
        datasourceType: raw.datasource_type,
      });
    }

    // Filter empty value parameters
    const filteredRaw = getParamsObject(raw);

    // 🔍 Add detailed logging: Record filtered results
    if (process.env.NODE_ENV === 'development') {
      console.log('[syncUrlToQuery] Filtered filteredRaw', {
        filteredRaw,
        datasourceType: filteredRaw.datasource_type,
      });
    }

    // Unified formatQuery for secondary formatting (changed to synchronous)
    const result = formatQuerySync(filteredRaw, config.queryFormat || {});

    // 🔍 Add detailed logging: Record final result
    if (process.env.NODE_ENV === 'development') {
      console.log('[syncUrlToQuery] Final result', {
        result,
        datasourceType: result.datasource_type,
      });
    }

    return result;
  } catch (error: unknown) {
    // ✅ Correct: Use resetLogCollector to record error and expose actual error information
    // Record error but don't interrupt flow, return empty object on error
    const errorObj = error instanceof Error ? error : new Error(String(error));
    resetLogCollector.log({
      component: 'QuerySyncUtils',
      method: 'syncUrlToQuery',
      action: 'error',
      data: {
        error: errorObj.message,
        stack: errorObj.stack,
      },
    });
    return {};
  }
}
