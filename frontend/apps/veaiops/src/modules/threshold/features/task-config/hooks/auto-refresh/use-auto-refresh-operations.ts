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

import { logger } from '@veaiops/utils';
import { useMemo } from 'react';
import {
  type AutoRefreshOperations,
  type UseAutoRefreshOperationsParams,
  createCreateOperation,
  createDeleteOperation,
  createUpdateOperation,
} from './lib';

/**
 * 创建自动刷新CRUD操作的Hook
 *
 * 这个Hook提供了一种通用的方式来包装CRUD操作，使其在执行成功后自动触发表格刷新。
 * 适用于任何需要自动刷新表格的异步操作场景。
 *
 * ## 核心特性
 *
 * ✅ **自动刷新**: 操作成功后自动触发表格刷新，无需手动调用
 * ✅ **错误处理**: 统一的错误处理和日志记录
 * ✅ **类型安全**: 完整的TypeScript类型支持
 * ✅ **灵活配置**: 支持可选的API函数配置
 * ✅ **通用性**: 可用于任何表格组件的CRUD操作
 *
 * ## 基本用法
 *
 * ```typescript
 * import { useAutoRefreshOperations } from '@/modules/threshold/features/task-config/hooks';
 *
 * const MyComponent = () => {
 *   const tableRef = useRef<TaskTableRef>(null);
 *
 *   // 获取刷新函数
 *   const refreshTable = useCallback(async () => {
 *     await tableRef.current?.refresh();
 *   }, []);
 *
 *   // 创建自动刷新操作
 *   const operations = useAutoRefreshOperations({
 *     refreshFn: refreshTable, // 刷新函数
 *     deleteApi: async (id) => await deleteApi(id), // 删除API
 *     updateApi: async () => await batchUpdateApi(), // 更新API
 *     createApi: async (data) => await createApi(data), // 创建API（可选）
 *   });
 *
 *   // 使用操作
 *   const handleDelete = async (id: string) => {
 *     try {
 *       const success = await operations.delete(id);
 *       if (success) {
 *         // 删除成功，表格已自动刷新（由 hook 处理）
 *       }
 *     } catch (error) {
 *       // 错误已由hook处理，这里只需要处理UI反馈
 *       message.error('删除失败');
 *     }
 *   };
 *
 *   return <TaskTable ref={tableRef} onDelete={handleDelete} />;
 * };
 * ```
 *
 * @param params - 参数对象
 * @param params.refreshFn - 表格刷新函数，支持返回 Promise<void> 或 Promise<{ success: boolean; error?: Error }>
 * @param params.deleteApi - 删除API函数，接收id参数，返回boolean表示是否成功
 * @param params.updateApi - 更新API函数，用于批量操作等，返回void
 * @param params.createApi - 创建API函数，接收数据参数（可选）
 * @returns 自动刷新的CRUD操作对象
 */
export const useAutoRefreshOperations = ({
  refreshFn,
  deleteApi,
  updateApi,
  createApi,
}: UseAutoRefreshOperationsParams): AutoRefreshOperations => {
  return useMemo(
    () => ({
      /**
       * 删除操作 - 执行成功后自动刷新表格
       * @param id - 要删除的记录ID
       * @returns 删除是否成功
       */
      delete: deleteApi
        ? createDeleteOperation(deleteApi, refreshFn)
        : async (id: string): Promise<boolean> => {
            // ✅ 正确：使用 logger 记录警告
            logger.warn({
              message: 'useAutoRefreshOperations: deleteApi not provided',
              data: { id },
              source: 'AutoRefreshOperations',
              component: 'delete',
            });
            return false;
          },

      /**
       * 更新操作 - 执行成功后自动刷新表格
       * 适用于批量更新、状态变更等操作
       *
       * @returns 返回 { success: boolean; error?: Error } 格式的结果对象
       */
      update: updateApi
        ? createUpdateOperation(updateApi, refreshFn)
        : async (): Promise<{ success: boolean; error?: Error }> => {
            // ✅ 正确：使用 logger 记录警告
            logger.warn({
              message: 'useAutoRefreshOperations: updateApi not provided',
              data: undefined,
              source: 'AutoRefreshOperations',
              component: 'update',
            });
            return {
              success: false,
              error: new Error('updateApi not provided'),
            };
          },

      /**
       * 创建操作 - 执行成功后自动刷新表格（可选）
       *
       * @param data - 创建的数据
       * @returns 返回 { success: boolean; error?: Error } 格式的结果对象
       */
      create: createApi
        ? createCreateOperation(createApi, refreshFn)
        : undefined,
    }),
    [refreshFn, deleteApi, updateApi, createApi],
  );
};
