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

import type { DeleteHandler } from '@datasource/types/column-types';
import type { BaseQuery, CustomTableActionType } from '@veaiops/components';
import { CustomTable } from '@veaiops/components';
import type { BaseRecord } from '@veaiops/types';
import { logger } from '@veaiops/utils';
import type { DataSource, DataSourceType } from 'api-generate';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import { useMonitorTableConfig } from '../../../hooks/use-monitor-table-config';
import { getCommonColumns } from './columns';

/**
 * 监控配置表格组件属性接口
 */
interface MonitorTableProps {
  onEdit?: (monitor: DataSource) => void;
  onDelete: (
    monitorId: string,
    dataSourceType?: DataSourceType,
  ) => Promise<boolean>;
  dataSourceType: DataSourceType;
}

/**
 * 监控配置表格组件引用接口
 */
export interface MonitorTableRef {
  refresh: () => Promise<{ success: boolean; error?: Error }>;
}

// 过滤器配置
const getMonitorFilters = () => [];

/**
 * 监控配置表格组件
 * 封装表格的渲染逻辑，提供清晰的接口
 */
export const MonitorTable = forwardRef<MonitorTableRef, MonitorTableProps>(
  ({ onEdit, onDelete, dataSourceType }, ref) => {
    // 内部 ref，用于传递给 useBusinessTable
    // 注意：CustomTable 需要泛型参数，但 useBusinessTable 的 ref 类型是 CustomTableActionType（无泛型）
    // 使用类型断言来桥接这两个类型
    const tableActionRef =
      useRef<CustomTableActionType<DataSource, BaseQuery>>(null);

    // 表格配置（已使用 useBusinessTable 自动处理刷新）
    const {
      customTableProps,
      handleColumns: configHandleColumns,
      operations,
      wrappedHandlers,
    } = useMonitorTableConfig({
      onEdit,
      onDelete: (monitorId: string) => onDelete(monitorId, dataSourceType),
      dataSourceType,
      // 为什么使用类型断言：
      // - tableActionRef 是泛型 CustomTableActionType<DataSource, BaseQuery>
      // - useMonitorTableConfig 期望的 ref 类型是 CustomTableActionType<BaseRecord, BaseQuery>
      // - 这是因为 CustomTableActionType 的泛型参数在运行时不影响 ref 的使用
      // - DataSource 扩展了 BaseRecord，类型兼容性由运行时保证
      // - 类型安全由 CustomTable 组件内部保证
      ref: tableActionRef as unknown as React.Ref<
        CustomTableActionType<BaseRecord, BaseQuery>
      >,
    });

    useImperativeHandle(
      ref,
      () => ({
        // Expose result-based refresh, complying with .cursorrules async method contract
        refresh: async (): Promise<{ success: boolean; error?: Error }> => {
          try {
            // Prefer operations.refresh which returns { success, error? }
            if (operations?.refresh) {
              return await operations.refresh();
            }
            // Fallback: call CustomTable action's refresh (void), then adapt to success format
            await tableActionRef.current?.refresh();
            return { success: true };
          } catch (error: unknown) {
            const errorObj =
              error instanceof Error ? error : new Error(String(error));
            // Log warning per logger object-arg spec
            logger.warn({
              message: 'MonitorTable 外部 refresh 失败',
              data: {
                error: errorObj.message,
                stack: errorObj.stack,
                errorObj,
              },
              source: 'MonitorTable',
              component: 'useImperativeHandle.refresh',
            });
            return { success: false, error: errorObj };
          }
        },
      }),
      [operations],
    );

    // 创建 handleColumns 函数，传递操作回调给列配置
    const handleColumns = useCallback(
      (_props: Record<string, unknown>) => {
        // 先使用配置中的 handleColumns
        const baseColumns = configHandleColumns(_props);

        // 适配 onDelete 函数，使用 useBusinessTable 自动包装的删除操作
        // ✅ 删除操作会自动刷新表格
        const adaptedOnDelete: DeleteHandler = async (id: string) => {
          try {
            // ✅ 优先使用 useBusinessTable 包装的删除操作（自动刷新）
            if (wrappedHandlers?.delete) {
              const success = await wrappedHandlers.delete(id);
              // ✅ 返回结果对象，符合异步方法错误处理规范
              return success
                ? { success: true }
                : { success: false, error: new Error('删除操作失败') };
            }

            // 兼容：如果没有包装的处理器，使用原始处理器
            const success = await onDelete(id, dataSourceType);
            // ✅ 返回结果对象，符合异步方法错误处理规范
            return success
              ? { success: true }
              : { success: false, error: new Error('删除操作失败') };
          } catch (error: unknown) {
            // ✅ 正确：透出实际错误信息
            const errorObj =
              error instanceof Error ? error : new Error(String(error));
            logger.error({
              message: '删除操作异常',
              data: {
                error: errorObj.message,
                stack: errorObj.stack,
                errorObj,
              },
              source: 'MonitorTable',
              component: 'adaptedOnDelete',
            });
            // ✅ 返回结果对象，符合异步方法错误处理规范
            return { success: false, error: errorObj };
          }
        };

        // 传递编辑、删除、激活/停用后的刷新处理
        // ✅ 切换状态后也需要刷新（使用 useBusinessTable 的刷新方法）
        const customColumns = getCommonColumns(
          dataSourceType,
          adaptedOnDelete,
          onEdit,
          async () => {
            // ✅ 使用 useBusinessTable 的刷新方法
            if (operations?.refresh) {
              const refreshResult = await operations.refresh();
              if (!refreshResult.success && refreshResult.error) {
                // ✅ 正确：使用 logger 记录警告，传递完整的错误信息
                const errorObj = refreshResult.error;
                logger.warn({
                  message: '切换状态后刷新表格失败',
                  data: {
                    error: errorObj.message,
                    stack: errorObj.stack,
                    errorObj,
                  },
                  source: 'MonitorTable',
                  component: 'onToggleStatus',
                });
              }
            }
          },
        );

        // 合并列配置（覆盖操作列和重复列）
        // 获取 customColumns 中的所有 key，用于去重
        const customColumnKeys = new Set(
          customColumns.map((col) => col.key).filter(Boolean),
        );

        // 从 baseColumns 中过滤掉在 customColumns 中已存在的列（包括 'actions'、'type' 等）
        // 同时过滤掉"配置信息"分组列，因为 customColumns 中的 getBaseColumns 也包含它
        const filteredBaseColumns = baseColumns.filter((col) => {
          const colKey = col.key || '';
          // 如果列有 children（分组列），检查是否是"配置信息"
          if (col.children && col.title === '配置信息') {
            return false; // 过滤掉 baseColumns 中的"配置信息"列，保留 customColumns 中的
          }
          // 过滤掉重复的 key
          return !customColumnKeys.has(colKey);
        });

        return [...filteredBaseColumns, ...customColumns];
      },
      [
        configHandleColumns,
        onDelete,
        onEdit,
        dataSourceType,
        operations,
        wrappedHandlers,
      ],
    );

    return (
      <CustomTable
        {...customTableProps}
        handleColumns={handleColumns}
        handleFilters={getMonitorFilters}
        syncQueryOnSearchParams
        useActiveKeyHook
        authQueryPrefixOnSearchParams={{
          connectDrawerShow: 'true',
          dataSourceWizardShow: 'true',
        }}
        // 注意：tableActionRef 的类型是 RefObject<CustomTableActionType<DataSource, BaseQuery>>
        // CustomTable 期望的 ref 类型是 Ref<CustomTableActionType<FormatRecordType, QueryType>>
        // 使用 unknown 作为中间类型，确保类型转换安全（运行时类型是一致的）
        ref={
          tableActionRef as unknown as React.Ref<
            CustomTableActionType<DataSource, BaseQuery>
          >
        }
      />
    );
  },
);

MonitorTable.displayName = 'MonitorTable';

export default MonitorTable;
