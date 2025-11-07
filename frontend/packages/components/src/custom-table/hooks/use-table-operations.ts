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
 * 表格操作 Hook - 自动包装业务操作+刷新
 *
 * 进一步简化，自动包装删除/更新/创建等操作，无需手动调用刷新
 *
 * @example
 * ```tsx
 * const operations = useTableOperations(onRefreshHandlers);
 *
 * // 自动包装：删除后自动刷新
 * const handleDelete = operations.wrapDelete(async (id) => {
 *   await deleteById(id);
 * });
 *
 * // 使用
 * <CustomTable onRefreshHandlers={operations.onRefreshHandlers} />
 * ```
 */

import { useCallback } from 'react';
import type { RefreshHandlers } from './use-table-refresh-handlers';

/**
 * 操作包装器
 */
export interface TableOperations {
  /** CustomTable 注入回调 */
  onRefreshHandlers: (handlers: RefreshHandlers) => void;

  /** 包装创建操作（成功后自动刷新） */
  wrapCreate: <T extends (...args: unknown[]) => Promise<unknown>>(fn: T) => T;

  /** 包装更新操作（成功后自动刷新） */
  wrapUpdate: <T extends (...args: unknown[]) => Promise<unknown>>(fn: T) => T;

  /** 包装删除操作（成功后自动刷新） */
  wrapDelete: <T extends (...args: unknown[]) => Promise<boolean>>(
    fn: T,
  ) => (...args: Parameters<T>) => Promise<boolean>;

  /** 包装导入操作（成功后自动刷新） */
  wrapImport: <T extends (...args: unknown[]) => Promise<unknown>>(fn: T) => T;

  /** 包装批量操作（成功后自动刷新） */
  wrapBatchOperation: <T extends (...args: unknown[]) => Promise<unknown>>(
    fn: T,
  ) => T;

  /** 直接刷新方法 */
  refresh: () => Promise<void>;
}

/**
 * Hook 返回值
 */
export interface UseTableOperationsReturn {
  /** 操作包装器 */
  operations: TableOperations;
}

/**
 * 使用表格操作 Hook
 * 自动包装业务操作，操作成功后自动刷新表格
 */
export const useTableOperations = (
  onRefreshHandlersFromHook: (handlers: RefreshHandlers) => void,
): UseTableOperationsReturn => {
  // 存储刷新方法
  let refreshHandlers: RefreshHandlers | null = null;

  // 处理注入的刷新方法
  const onRefreshHandlers = useCallback(
    (handlers: RefreshHandlers) => {
      refreshHandlers = handlers;
      onRefreshHandlersFromHook(handlers);
    },
    [onRefreshHandlersFromHook],
  );

  // 包装创建操作
  const wrapCreate = useCallback(
    <T extends (...args: unknown[]) => Promise<unknown>>(fn: T): T => {
      return (async (...args: Parameters<T>) => {
        const result = await fn(...args);
        await refreshHandlers?.afterCreate?.();
        return result;
      }) as T;
    },
    [],
  );

  // 包装更新操作
  const wrapUpdate = useCallback(
    <T extends (...args: unknown[]) => Promise<unknown>>(fn: T): T => {
      return (async (...args: Parameters<T>) => {
        const result = await fn(...args);
        await refreshHandlers?.afterUpdate?.();
        return result;
      }) as T;
    },
    [],
  );

  // 包装删除操作（特殊处理返回值）
  const wrapDelete = useCallback(
    <T extends (...args: unknown[]) => Promise<boolean>>(
      fn: T,
    ): ((...args: Parameters<T>) => Promise<boolean>) => {
      return async (...args: Parameters<T>): Promise<boolean> => {
        const success = await fn(...args);
        if (success && refreshHandlers?.afterDelete) {
          await refreshHandlers.afterDelete();
        }
        return success;
      };
    },
    [],
  );

  // 包装导入操作
  const wrapImport = useCallback(
    <T extends (...args: unknown[]) => Promise<unknown>>(fn: T): T => {
      return (async (...args: Parameters<T>) => {
        const result = await fn(...args);
        await refreshHandlers?.afterImport?.();
        return result;
      }) as T;
    },
    [],
  );

  // 包装批量操作
  const wrapBatchOperation = useCallback(
    <T extends (...args: unknown[]) => Promise<unknown>>(fn: T): T => {
      return (async (...args: Parameters<T>) => {
        const result = await fn(...args);
        await refreshHandlers?.afterBatchOperation?.();
        return result;
      }) as T;
    },
    [],
  );

  // 直接刷新
  const refresh = useCallback(async () => {
    await refreshHandlers?.refresh?.();
  }, []);

  const operations: TableOperations = {
    onRefreshHandlers,
    wrapCreate,
    wrapUpdate,
    wrapDelete,
    wrapImport,
    wrapBatchOperation,
    refresh,
  };

  return { operations };
};
