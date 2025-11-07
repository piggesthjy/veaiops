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
import { QuerySyncUtils } from './query-sync-utils';
import type { CreateQuerySyncUtilsParams } from './types';

/**
 * 创建查询参数同步工具实例
 */
export const createQuerySyncUtils = <
  QueryType extends Record<string, unknown> = Record<string, unknown>,
>({
  config,
  context,
}: CreateQuerySyncUtilsParams<QueryType>): QuerySyncUtils<QueryType> =>
  new QuerySyncUtils(config, context);

/**
 * 检查是否需要同步查询参数
 */
export const shouldSyncQuery = <QueryType extends Record<string, unknown>>(
  config: QuerySyncConfig,
  context: QuerySyncContext<QueryType>,
): boolean => Boolean(config.syncQueryOnSearchParams && context.isMounted);

/**
 * 安全地执行查询参数同步
 *
 * @returns 返回 { success: boolean; error?: Error } 格式的结果对象
 */
export const safeExecuteSync = async (
  syncFn: () => void | Promise<void>,
  _errorMessage = 'Query sync error',
): Promise<{ success: boolean; error?: Error }> => {
  try {
    await syncFn();
    return { success: true };
  } catch (error: unknown) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    // 静默处理错误，避免中断流程，但返回错误信息供调用方判断
    return { success: false, error: errorObj };
  }
};
