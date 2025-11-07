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
 * 表格刷新处理器 Hook
 * 提供开箱即用的刷新方法管理，消除业务侧手动配置 tableRef
 *
 * @example
 * ```tsx
 * const { handlers, onRefreshHandlers } = useTableRefreshHandlers();
 *
 * return (
 *   <>
 *     <CustomTable onRefreshHandlers={onRefreshHandlers} />
 *     <Button onClick={() => handlers.afterDelete()}>删除</Button>
 *   </>
 * );
 * ```
 */

import {
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';

/**
 * 刷新处理器方法集合
 */
export interface RefreshHandlers {
  /** 创建操作后刷新 */
  afterCreate: () => Promise<void>;
  /** 更新操作后刷新 */
  afterUpdate: () => Promise<void>;
  /** 删除操作后刷新 */
  afterDelete: () => Promise<void>;
  /** 导入操作后刷新 */
  afterImport: () => Promise<void>;
  /** 批量操作后刷新 */
  afterBatchOperation: () => Promise<void>;
  /** 带反馈的刷新 */
  refreshWithFeedback: () => Promise<void>;
  /** 静默刷新 */
  refreshSilently: () => Promise<void>;
  /** 基础刷新 */
  refresh: () => Promise<void>;
}

/**
 * Hook 配置选项
 */
export interface UseTableRefreshHandlersOptions {
  /** 暴露给父组件的方法（可选） */
  exposeMethods?: {
    /** 暴露刷新方法 */
    refresh?: () => Promise<void>;
    /** 暴露删除后刷新方法 */
    afterDelete?: () => Promise<void>;
  };
  /** 父组件 ref（用于 useImperativeHandle） */
  ref?: React.Ref<{ refresh: () => Promise<void> }>;
}

/**
 * Hook 返回值
 */
export interface UseTableRefreshHandlersReturn {
  /** 刷新方法集合 */
  handlers: RefreshHandlers | null;
  /** 传递给 CustomTable 的 onRefreshHandlers 回调 */
  onRefreshHandlers: (handlers: RefreshHandlers) => void;
  /** 是否有有效的刷新方法 */
  isReady: boolean;
}

/**
 * 使用表格刷新处理器 Hook
 *
 * @param options 配置选项
 * @returns 刷新处理器和回调函数
 */
export const useTableRefreshHandlers = (
  options: UseTableRefreshHandlersOptions = {},
): UseTableRefreshHandlersReturn => {
  const { exposeMethods = {}, ref } = options;

  // 🔧 使用 ref 存储最新的 handlers，避免因引用变化导致的无限重渲染
  const handlersRef = useRef<RefreshHandlers | null>(null);
  const [isReady, setIsReady] = useState(false);

  // 创建稳定的 handlers 代理对象，内部使用 ref 获取最新方法
  const stableHandlers = useMemo<RefreshHandlers>(
    () => ({
      afterCreate: async () => await handlersRef.current?.afterCreate?.(),
      afterUpdate: async () => await handlersRef.current?.afterUpdate?.(),
      afterDelete: async () => await handlersRef.current?.afterDelete?.(),
      afterImport: async () => await handlersRef.current?.afterImport?.(),
      afterBatchOperation: async () =>
        await handlersRef.current?.afterBatchOperation?.(),
      refreshWithFeedback: async () =>
        await handlersRef.current?.refreshWithFeedback?.(),
      refreshSilently: async () =>
        await handlersRef.current?.refreshSilently?.(),
      refresh: async () => await handlersRef.current?.refresh?.(),
    }),
    [],
  );

  // 处理 CustomTable 注入的刷新方法
  const onRefreshHandlers = useCallback(
    (injectedHandlers: RefreshHandlers) => {
      handlersRef.current = injectedHandlers;
      if (!isReady) {
        setIsReady(true);
      }
    },
    [isReady],
  );

  // 暴露方法给父组件（如果需要）
  useImperativeHandle(
    ref,
    () => ({
      refresh: async () => {
        if (exposeMethods.refresh) {
          await exposeMethods.refresh();
        } else {
          await handlersRef.current?.refresh?.();
        }
      },
      // 可以添加更多暴露的方法
      ...(exposeMethods.afterDelete && {
        afterDelete: async () => {
          if (exposeMethods.afterDelete) {
            await exposeMethods.afterDelete();
          } else {
            await handlersRef.current?.afterDelete?.();
          }
        },
      }),
    }),
    [exposeMethods],
  );

  return {
    handlers: isReady ? stableHandlers : null,
    onRefreshHandlers,
    isReady,
  };
};

/**
 * 简化的刷新处理器 Hook
 * 用于不需要 ref 的场景
 */
export const useSimpleTableRefresh = () => {
  const { handlers, onRefreshHandlers } = useTableRefreshHandlers();
  return { handlers, onRefreshHandlers };
};

/**
 * 一键使用的表格操作 Hook
 * 自动包装所有操作，无需手动刷新
 *
 * @example
 * ```tsx
 * const { handlers, wrapDelete, wrapUpdate } = useTableOperationsWithRefresh({ ref });
 *
 * // 包装删除操作（自动刷新）
 * const wrappedDelete = useMemo(() => wrapDelete((id) => onDelete(id)), []);
 *
 * // 包装更新操作（自动刷新）
 * const handleToggle = useCallback(async () => {
 *   await wrapUpdate(async () => {})();
 * }, [wrapUpdate]);
 *
 * return <CustomTable onRefreshHandlers={onRefreshHandlers} />;
 * ```
 */
export const useTableOperationsWithRefresh = (
  options: UseTableRefreshHandlersOptions = {},
) => {
  const { handlers, onRefreshHandlers } = useTableRefreshHandlers(options);

  return {
    handlers,
    onRefreshHandlers,
    isReady: handlers !== null,
    // 返回包装器以进一步简化
    wrapDelete: (fn: (id: string) => Promise<boolean>) => {
      return async (id: string) => {
        const success = await fn(id);
        if (success) {
          await handlers?.afterDelete?.();
        }
        return success;
      };
    },
    wrapUpdate: (fn: () => Promise<void>) => {
      return async () => {
        await fn();
        await handlers?.afterUpdate?.();
      };
    },
    // 新增：自动包装并转换类型
    wrapDeleteAsVoid: (fn: (id: string) => Promise<boolean>) => {
      return async (id: string) => {
        const success = await fn(id);
        if (success) {
          await handlers?.afterDelete?.();
        }
        // 返回 void
      };
    },
  };
};
