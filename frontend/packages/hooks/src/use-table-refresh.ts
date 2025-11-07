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

import { Message, Modal } from '@arco-design/web-react';
import { useCallback } from 'react';

/**
 * 表格刷新配置选项
 */
export interface TableRefreshOptions {
  /** 刷新成功提示消息 */
  successMessage?: string;
  /** 刷新失败提示消息 */
  errorMessage?: string;
  /** 是否显示加载状态 */
  showLoading?: boolean;
  /** 是否静默刷新（不显示任何提示） */
  silent?: boolean;
  /** 自定义错误处理 */
  onError?: (error: Error) => void;
  /** 刷新前的回调 */
  onBeforeRefresh?: () => void | Promise<void>;
  /** 刷新后的回调 */
  onAfterRefresh?: () => void | Promise<void>;
}

/**
 * 表格刷新 Hook 的参数接口
 */
export interface UseTableRefreshParams {
  refreshTable?: () => Promise<void> | Promise<boolean>;
  options?: TableRefreshOptions;
}

/**
 * 表格刷新 Hook
 * 提供统一的表格刷新逻辑，支持成功/失败提示、加载状态等
 *
 * @param params 包含 refreshTable 和 options 的参数对象
 * @returns 封装后的刷新函数
 *
 * @example
 * ```tsx
 * const { refreshWithFeedback } = useTableRefresh({
 *   refreshTable,
 *   options: {
 *     successMessage: '数据刷新成功',
 *     errorMessage: '数据刷新失败，请重试'
 *   }
 * });
 *
 * // 在操作成功后调用
 * await refreshWithFeedback();
 * ```
 */
export const useTableRefresh = ({
  refreshTable,
  options = {},
}: UseTableRefreshParams = {}) => {
  const {
    successMessage,
    errorMessage = '刷新失败，请重试',
    showLoading = false,
    silent = false,
    onError,
    onBeforeRefresh,
    onAfterRefresh,
  } = options;

  /**
   * 带反馈的刷新函数
   */
  const refreshWithFeedback = useCallback(async (): Promise<{
    success: boolean;
    error?: Error;
  }> => {
    if (!refreshTable) {
      return { success: false, error: new Error('刷新函数未定义') };
    }

    try {
      // 刷新前回调
      if (onBeforeRefresh) {
        await onBeforeRefresh();
      }

      // 显示加载状态
      if (showLoading && !silent) {
        Message.loading('正在刷新数据...');
      }

      // 执行刷新
      const result = await refreshTable();

      // 刷新后回调
      if (onAfterRefresh) {
        await onAfterRefresh();
      }

      // 如果 refreshTable 返回 boolean，使用返回值；否则默认为成功
      const success = typeof result === 'boolean' ? result : true;

      // 显示成功提示（仅在成功时显示）
      if (success && successMessage && !silent) {
        Message.success(successMessage);
      }

      return { success };
    } catch (error: unknown) {
      // ✅ 正确：透出实际错误信息
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      // 自定义错误处理
      if (onError) {
        onError(errorObj);
      } else if (!silent) {
        // ✅ 正确：透出实际错误信息，而不是固定消息
        const errorMessageToShow =
          error instanceof Error
            ? error.message
            : errorMessage || '刷新失败，请重试';
        Message.error(errorMessageToShow);
      }
      return { success: false, error: errorObj };
    }
  }, [
    refreshTable,
    successMessage,
    errorMessage,
    showLoading,
    silent,
    onError,
    onBeforeRefresh,
    onAfterRefresh,
  ]);

  /**
   * 静默刷新函数（不显示任何提示）
   */
  const refreshSilently = useCallback(async (): Promise<{
    success: boolean;
    error?: Error;
  }> => {
    if (!refreshTable) {
      return { success: false, error: new Error('刷新函数未定义') };
    }

    try {
      const result = await refreshTable();
      // 如果 refreshTable 返回 boolean，使用返回值；否则默认为成功
      const success = typeof result === 'boolean' ? result : true;
      return { success };
    } catch (error: unknown) {
      // ✅ 正确：透出实际错误信息
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      // 静默模式下不显示错误提示，但可以通过 onError 处理
      if (onError) {
        onError(errorObj);
      }
      return { success: false, error: errorObj };
    }
  }, [refreshTable, onError]);

  /**
   * 带确认的刷新函数
   */
  const refreshWithConfirm = useCallback(
    (confirmMessage = '确定要刷新数据吗？') => {
      if (!refreshTable) {
        return;
      }

      Modal.confirm({
        title: '确认操作',
        content: confirmMessage,
        okText: '确认',
        cancelText: '取消',
        onOk: async () => {
          await refreshWithFeedback();
        },
      });
    },
    [refreshTable, refreshWithFeedback],
  );

  return {
    /** 带反馈的刷新函数 */
    refreshWithFeedback,
    /** 静默刷新函数 */
    refreshSilently,
    /** 带确认的刷新函数 */
    refreshWithConfirm,
    /** 原始刷新函数 */
    refresh: refreshTable,
  };
};

/**
 * 管理操作后的表格刷新 Hook
 * 专门用于 CRUD 操作后的表格刷新，提供统一的成功反馈
 *
 * @param refreshTable - 原始的刷新函数
 * @returns 各种操作后的刷新函数
 *
 * @example
 * ```tsx
 * const { afterCreate, afterUpdate, afterDelete } = useManagementRefresh(refreshTable);
 *
 * // 创建成功后
 * await afterCreate();
 *
 * // 更新成功后
 * await afterUpdate();
 *
 * // 删除成功后
 * await afterDelete();
 * ```
 */
export const useManagementRefresh = (
  refreshTable?: () => Promise<void> | Promise<boolean>,
): {
  afterCreate: () => Promise<{ success: boolean; error?: Error }>;
  afterUpdate: () => Promise<{ success: boolean; error?: Error }>;
  afterDelete: () => Promise<{ success: boolean; error?: Error }>;
  afterImport: () => Promise<{ success: boolean; error?: Error }>;
  afterBatchOperation: () => Promise<{ success: boolean; error?: Error }>;
  refresh: () => Promise<{ success: boolean; error?: Error }>;
} => {
  const { refreshSilently } = useTableRefresh({ refreshTable });

  const afterCreate = useCallback(async () => {
    return await refreshSilently();
  }, [refreshSilently]);

  const afterUpdate = useCallback(async () => {
    return await refreshSilently();
  }, [refreshSilently]);

  const afterDelete = useCallback(async () => {
    return await refreshSilently();
  }, [refreshSilently]);

  const afterImport = useCallback(async () => {
    return await refreshSilently();
  }, [refreshSilently]);

  const afterBatchOperation = useCallback(async () => {
    return await refreshSilently();
  }, [refreshSilently]);

  return {
    /** 创建操作后刷新 */
    afterCreate,
    /** 更新操作后刷新 */
    afterUpdate,
    /** 删除操作后刷新 */
    afterDelete,
    /** 导入操作后刷新 */
    afterImport,
    /** 批量操作后刷新 */
    afterBatchOperation,
    /** 通用刷新 */
    refresh: refreshSilently,
  };
};

export default useTableRefresh;
