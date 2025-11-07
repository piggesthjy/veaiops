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
 * 业务表格统一 Hook

 * 参考 Arco Design 的 hook 设计模式（如 useSorter、useRowSelection）
 * 统一处理业务侧表格配置，整合：
 * 1. 数据源配置
 * 2. 刷新逻辑
 * 3. 操作包装
 * 4. 复杂业务逻辑处理

 * 设计理念（参考 Arco Design）：
 * - 每个 Hook 专注单一职责
 * - 通过组合实现复杂功能
 * - 提供清晰的 API 边界
 * - 支持复杂场景的灵活扩展

 * @example
 * ```tsx
 * // 简单场景
 * const { customTableProps, wrappedHandlers } = useBusinessTable({
 *   dataSource: { /* ... *\/ },
 *   tableProps: { /* ... *\/ },
 *   handlers: {
 *     delete: onDelete,
 *     update: onToggle,
 *   },
 *   ref,
 * });
 *
 * return <CustomTable {...customTableProps} />;
 *
 * // 复杂场景（MonitorTable 风格）
 * const { operations, customTableProps } = useBusinessTable({
 *   dataSource: dataSourceFromHook,
 *   tableProps: tablePropsFromHook,
 *   // 自定义操作包装逻辑
 *   operationWrapper: ({ wrapDelete, wrapUpdate, wrapDeleteAsVoid }) => ({
 *     // 包装删除函数（返回 boolean，用于表格配置）
 *     wrappedDelete: wrapDelete((id) => onDelete(id, dataSourceType)),
 *     // 包装删除函数（返回 void，用于操作列）
 *     handleDelete: wrapDeleteAsVoid((id) => onDelete(id, dataSourceType)),
 *     // 包装更新函数（用于切换激活状态）
 *     handleToggle: async () => wrapUpdate(async () => {})(),
 *   }),
 *   ref,
 * });
 * ```
 */

import type { CustomTableActionType } from '@/custom-table/types/api/action-type';
import type {
  BaseQuery,
  BaseRecord,
  ModernTableColumnProps,
} from '@/custom-table/types/core/common';
import { useManagementRefresh } from '@veaiops/hooks';
import type { TableDataSource } from '@veaiops/types';
import { type StandardTableProps, logger } from '@veaiops/utils';
import { useMemo, useRef } from 'react';

/**
 * 操作包装函数类型
 */
export interface OperationWrappers {
  /** 包装删除操作（返回 boolean） */
  wrapDelete: (
    fn: (id: string) => Promise<boolean>,
  ) => (id: string) => Promise<boolean>;
  /** 包装更新操作（返回 Promise<void>） */
  wrapUpdate: (fn: () => Promise<void>) => () => Promise<void>;
  /** 包装删除操作（返回 void） */
  wrapDeleteAsVoid: (
    fn: (id: string) => Promise<boolean>,
  ) => (id: string) => Promise<void>;
  /** 获取刷新函数 */
  getRefresh: () => (() => Promise<void>) | undefined;
}

/**
 * 业务表格配置选项
 */
export interface BusinessTableConfigOptions<
  TQueryParams extends Record<string, unknown> = Record<string, unknown>,
  RecordType extends BaseRecord = BaseRecord,
  QueryType extends BaseQuery = BaseQuery,
> {
  /** 数据源配置 */
  dataSource: TableDataSource<RecordType, TQueryParams>;
  /** 表格属性配置（支持对象或函数形式） */
  tableProps?:
    | StandardTableProps
    | Record<string, unknown>
    | ((ctx?: { loading?: boolean }) =>
        | StandardTableProps
        | Record<string, unknown>);
  /** 列配置函数 */
  handleColumns?: (
    props: Record<string, unknown>,
  ) => ModernTableColumnProps<RecordType>[];
  /** 操作处理器（简单场景） */
  handlers?: {
    /** 删除处理器 */
    delete?: (id: string) => Promise<boolean>;
    /** 更新处理器 */
    update?: () => Promise<void>;
    /** 创建处理器 */
    create?: () => Promise<void>;
  };
  /** 操作包装器（复杂场景，支持自定义逻辑） */
  operationWrapper?: (
    wrappers: OperationWrappers,
  ) => Record<string, (...args: unknown[]) => unknown>;
  /** 刷新配置 */
  refreshConfig?: {
    enableRefreshFeedback?: boolean;
    successMessage?: string;
    errorMessage?: string;
    showLoading?: boolean;
  };
  /** ref 引用（支持泛型参数，类型安全） */
  ref?: React.Ref<CustomTableActionType<RecordType, QueryType>>;
}

/**
 * 业务表格配置返回
 */
export interface BusinessTableConfigResult {
  /** CustomTable 使用的 props */
  customTableProps: Record<string, unknown>;
  /** 刷新包装器（用于业务侧进一步处理，仅服务器数据模式） */
  operations: ReturnType<typeof useManagementRefresh>;
  /** 包装后的操作处理器（简单场景） */
  wrappedHandlers?: {
    delete?: (id: string) => Promise<boolean>;
    update?: () => Promise<void>;
    create?: () => Promise<void>;
  };
  /** 自定义包装结果（复杂场景） */
  customOperations?: Record<string, (...args: unknown[]) => unknown>;
  /** 是否为本地数据模式 */
  isLocalData?: boolean;
}

/**
 * 业务表格统一 Hook

 * 支持两种数据模式：
 * 1. 服务器数据模式：通过 request 函数获取数据，支持刷新、分页等功能
 * 2. 本地数据模式：通过 dataList 提供静态数据，不支持刷新功能
 *
 * 支持两种使用模式：
 * 1. 简单模式：自动包装标准操作
 * 2. 复杂模式：通过 operationWrapper 支持自定义包装逻辑

 * @param options 配置选项
 * @returns 表格配置和操作处理器
 */
export const useBusinessTable = <
  TQueryParams extends Record<string, unknown> = Record<string, unknown>,
  RecordType extends BaseRecord = BaseRecord,
  QueryType extends BaseQuery = BaseQuery,
>(
  options: BusinessTableConfigOptions<TQueryParams, RecordType, QueryType>,
): BusinessTableConfigResult => {
  const {
    dataSource,
    tableProps: baseTableProps = {},
    handleColumns,
    handlers,
    operationWrapper,
    refreshConfig,
    ref,
  } = options;

  // 🎯 解构 refreshConfig，避免对象引用问题
  const { enableRefreshFeedback, successMessage, errorMessage, showLoading } =
    refreshConfig || {};

  // 🎯 判断是否为本地数据模式（有 dataList 且 manual 为 true）
  const isLocalData =
    (dataSource as any).dataList !== undefined &&
    (dataSource as any).manual === true;

  // 诊断日志：数据源与刷新配置稳定性（仅日志）
  // devLog.log('useBusinessTable', 'config_snapshot', {
  //   isLocalData,
  //   refreshConfig,
  // });

  // 🎯 使用 useManagementRefresh 处理刷新逻辑（仅对服务器数据）
  const operations = useManagementRefresh(
    isLocalData
      ? undefined
      : async () => {
          logger.debug({
            message: '[useBusinessTable] 🔄 开始刷新表格',
            data: {
              hasRef: Boolean(ref),
              refType: typeof ref,
              hasRefCurrent: Boolean(
                ref &&
                  typeof ref === 'object' &&
                  (ref as { current?: unknown }).current,
              ),
              hasRefreshMethod: Boolean(
                ref &&
                  typeof ref === 'object' &&
                  (ref as { current?: { refresh?: unknown } }).current?.refresh,
              ),
            },
            source: 'CustomTable',
            component: 'UseBusinessTable',
          });

          if (
            ref &&
            typeof ref === 'object' &&
            ref.current &&
            ref.current.refresh
          ) {
            logger.info({
              message: '[useBusinessTable] ✅ 准备调用 ref.current.refresh()',
              data: {
                refCurrentType: typeof ref.current,
                refCurrentKeys: Object.keys(ref.current || {}),
                refreshType: typeof ref.current.refresh,
              },
              source: 'CustomTable',
              component: 'UseBusinessTable',
            });
            const refreshStartTime = Date.now();
            await ref.current.refresh();
            const refreshEndTime = Date.now();
            logger.info({
              message: '[useBusinessTable] ✅ ref.current.refresh() 调用完成',
              data: {
                duration: refreshEndTime - refreshStartTime,
              },
              source: 'CustomTable',
              component: 'UseBusinessTable',
            });
          } else {
            logger.warn({
              message:
                '[useBusinessTable] ⚠️ 刷新失败：ref.current 不存在或没有 refresh 方法',
              data: {
                hasRef: Boolean(ref),
                refType: typeof ref,
                hasRefCurrent: Boolean(
                  ref &&
                    typeof ref === 'object' &&
                    (ref as { current?: unknown }).current,
                ),
                hasRefreshMethod: Boolean(
                  ref &&
                    typeof ref === 'object' &&
                    (ref as { current?: { refresh?: unknown } }).current
                      ?.refresh,
                ),
              },
              source: 'CustomTable',
              component: 'UseBusinessTable',
            });
          }
        },
  );

  // 🎯 简单场景：自动包装操作函数
  const wrappedHandlers = useMemo(() => {
    if (!handlers || operationWrapper) {
      return undefined;
    }

    return {
      ...(handlers.delete && {
        delete: async (id: string) => {
          logger.debug({
            message: '[useBusinessTable] 🗑️ wrappedHandlers.delete 被调用',
            data: {
              id,
              isLocalData,
            },
            source: 'CustomTable',
            component: 'UseBusinessTable',
          });
          const result = await handlers.delete!(id);
          logger.debug({
            message: '[useBusinessTable] 🗑️ 删除操作完成',
            data: {
              id,
              result,
              isLocalData,
              willRefresh: result && !isLocalData,
            },
            source: 'CustomTable',
            component: 'UseBusinessTable',
          });
          if (result && !isLocalData) {
            logger.debug({
              message:
                '[useBusinessTable] 🔄 开始调用 operations.afterDelete()',
              data: {
                id,
              },
              source: 'CustomTable',
              component: 'UseBusinessTable',
            });
            const refreshResult = await operations.afterDelete();
            logger.debug({
              message: '[useBusinessTable] 🔄 operations.afterDelete() 完成',
              data: {
                id,
                refreshResult,
              },
              source: 'CustomTable',
              component: 'UseBusinessTable',
            });
          }
          return result;
        },
      }),
      ...(handlers.update && {
        update: async () => {
          await handlers.update!();
          if (!isLocalData) {
            await operations.afterUpdate();
          }
        },
      }),
      ...(handlers.create && {
        create: async () => {
          await handlers.create!();
          if (!isLocalData) {
            await operations.afterCreate();
          }
        },
      }),
    };
  }, [handlers, operationWrapper, isLocalData, operations]);

  // 🎯 复杂场景：使用自定义操作包装器
  const customOperations = useMemo(() => {
    if (!operationWrapper) {
      return undefined;
    }

    const wrappers: OperationWrappers = {
      wrapDelete: (fn) => async (id) => {
        const result = await fn(id);
        if (result && !isLocalData) {
          await operations.afterDelete();
        }
        return result;
      },
      wrapUpdate: (fn) => async () => {
        await fn();
        if (!isLocalData) {
          await operations.afterUpdate();
        }
      },
      wrapDeleteAsVoid: (fn) => async (id) => {
        const result = await fn(id);
        if (result && !isLocalData) {
          await operations.afterDelete();
        }
      },
      getRefresh: () => {
        if (
          ref &&
          typeof ref === 'object' &&
          ref.current &&
          ref.current.refresh
        ) {
          return ref.current.refresh;
        }
        return undefined;
      },
    };

    return operationWrapper(wrappers);
  }, [operationWrapper, isLocalData, operations, ref]);

  // 🔧 渲染计数日志
  const renderCountRef = useRef(0);
  renderCountRef.current++;

  logger.info({
    message: '[useBusinessTable] 🔄 Hook执行',
    data: {
      renderCount: renderCountRef.current,
      hasDataSource: Boolean(dataSource),
      hasHandleColumns: Boolean(handleColumns),
    },
    source: 'CustomTable',
    component: 'UseBusinessTable',
  });

  // 🎯 组装 CustomTable 使用的 props
  // 🔧 使用 useMemo 稳定对象引用
  const customTableProps = useMemo(() => {
    logger.info({
      message: '[useBusinessTable] 📦 customTableProps重新创建',
      data: {
        renderCount: renderCountRef.current,
      },
      source: 'CustomTable',
      component: 'UseBusinessTable',
    });

    return {
      dataSource,
      tableProps: baseTableProps,
      ...(Boolean(handleColumns) && { handleColumns }),
      ...(!isLocalData && {
        ...(enableRefreshFeedback !== undefined && { enableRefreshFeedback }),
        ...(successMessage !== undefined && {
          refreshSuccessMessage: successMessage,
        }),
        ...(errorMessage !== undefined && {
          refreshErrorMessage: errorMessage,
        }),
      }),
    };
  }, [
    dataSource,
    baseTableProps,
    handleColumns,
    isLocalData,
    enableRefreshFeedback,
    successMessage,
    errorMessage,
  ]);

  return {
    customTableProps,
    operations,
    wrappedHandlers,
    customOperations,
    isLocalData,
  };
};
