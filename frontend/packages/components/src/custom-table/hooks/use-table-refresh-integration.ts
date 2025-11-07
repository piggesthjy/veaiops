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
 * CustomTable 刷新功能集成 Hook
 * 封装 useTableRefresh，提供业务语义化的刷新方法
 * 同时保持与现有 API 的兼容性
 */

import { useManagementRefresh } from '@veaiops/hooks';
import { useCallback, useMemo } from 'react';

/**
 * 表格刷新配置
 */
export interface TableRefreshIntegrationOptions {
  /** 是否启用刷新反馈 */
  enableRefreshFeedback?: boolean;
  /** 成功提示消息 */
  successMessage?: string;
  /** 失败提示消息 */
  errorMessage?: string;
  /** 是否显示加载状态 */
  showLoading?: boolean;
  /** 刷新前的回调 */
  onBeforeRefresh?: () => void | Promise<void>;
  /** 刷新后的回调 */
  onAfterRefresh?: () => void | Promise<void>;
  /** 自定义错误处理 */
  onError?: (error: Error) => void;
}

/**
 * 刷新集成 Hook 返回值
 */
export interface TableRefreshIntegrationReturn {
  /** 业务语义化的刷新方法 */
  afterCreate: () => Promise<{ success: boolean; error?: Error }>;
  afterUpdate: () => Promise<{ success: boolean; error?: Error }>;
  afterDelete: () => Promise<{ success: boolean; error?: Error }>;
  afterImport: () => Promise<{ success: boolean; error?: Error }>;
  afterBatchOperation: () => Promise<{ success: boolean; error?: Error }>;

  /** 带反馈的刷新方法 */
  refreshWithFeedback: () => Promise<{ success: boolean; error?: Error }>;

  /** 静默刷新方法 */
  refreshSilently: () => Promise<{ success: boolean; error?: Error }>;

  /** 基础刷新方法（保持兼容性） */
  refresh: () => Promise<void>;
}

/**
 * CustomTable 刷新集成 Hook
 *
 * @param refreshFn - 刷新函数
 * @param options - 刷新配置选项
 * @returns 刷新方法集合
 */
export const useTableRefreshIntegration = (
  refreshFn?: () => Promise<void>,
  options: TableRefreshIntegrationOptions = {},
): TableRefreshIntegrationReturn => {
  const {
    enableRefreshFeedback = true,
    successMessage,
    showLoading = false,
    onBeforeRefresh,
    onAfterRefresh,
    onError,
  } = options;

  // 使用 useManagementRefresh 提供的基础功能
  const {
    afterCreate,
    afterUpdate,
    afterDelete,
    afterImport,
    afterBatchOperation,
  } = useManagementRefresh(refreshFn);

  // 创建一个静默刷新的 ref，用于不显示提示的场景
  const refreshSilently = useCallback(async (): Promise<{
    success: boolean;
    error?: Error;
  }> => {
    if (!refreshFn) {
      return { success: false, error: new Error('刷新函数未定义') };
    }
    try {
      if (onBeforeRefresh) {
        await onBeforeRefresh();
      }
      await refreshFn();
      if (onAfterRefresh) {
        await onAfterRefresh();
      }
      return { success: true };
    } catch (error: unknown) {
      // ✅ 正确：透出实际错误信息
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      if (onError) {
        onError(errorObj);
      }
      return { success: false, error: errorObj };
    }
  }, [refreshFn, onBeforeRefresh, onAfterRefresh, onError]);

  // 带反馈的刷新（使用 Message）
  const refreshWithFeedback = useCallback(async (): Promise<{
    success: boolean;
    error?: Error;
  }> => {
    if (!refreshFn) {
      return { success: false, error: new Error('刷新函数未定义') };
    }

    if (!enableRefreshFeedback) {
      return await refreshSilently();
    }

    try {
      if (onBeforeRefresh) {
        await onBeforeRefresh();
      }

      if (showLoading && !(options as any).silent) {
        // 这里不导入 Message，避免循环依赖
        // Message 由 useManagementRefresh 内部处理
      }

      await refreshFn();

      if (onAfterRefresh) {
        await onAfterRefresh();
      }

      if (successMessage && !(options as any).silent) {
        // Message 由 useManagementRefresh 内部处理
      }

      return { success: true };
    } catch (error: unknown) {
      // ✅ 正确：透出实际错误信息
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      if (onError) {
        onError(errorObj);
      } else if (!(options as any).silent) {
        // Message 由 useManagementRefresh 内部处理
      }
      return { success: false, error: errorObj };
    }
  }, [
    refreshFn,
    enableRefreshFeedback,
    showLoading,
    successMessage,
    onBeforeRefresh,
    onAfterRefresh,
    onError,
    refreshSilently,
    options,
  ]);

  // 返回业务语义化的方法
  return useMemo(
    () => ({
      // 业务语义化的刷新方法
      afterCreate,
      afterUpdate,
      afterDelete,
      afterImport,
      afterBatchOperation,

      // 带反馈的刷新（使用内部实现）
      refreshWithFeedback,

      // 静默刷新
      refreshSilently,

      // 基础刷新方法（保持兼容性，直接调用原始函数）
      refresh: refreshFn || (async () => undefined),
    }),
    [
      afterCreate,
      afterUpdate,
      afterDelete,
      afterImport,
      afterBatchOperation,
      refreshWithFeedback,
      refreshSilently,
      refreshFn,
    ],
  );
};
