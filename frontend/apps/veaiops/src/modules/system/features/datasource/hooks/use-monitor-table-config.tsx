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

import {
  type BaseQuery,
  type CustomTableActionType,
  type FieldItem,
  type HandleFilterProps,
  useBusinessTable,
} from '@veaiops/components';
import {
  createServerPaginationDataSource,
  createStandardTableProps,
} from '@veaiops/utils';
import type React from 'react';
import { useCallback, useMemo } from 'react';
import {
  createMonitorTableColumns,
  createMonitorTableFilters,
  createMonitorTableRequest,
} from '../lib';
import type {
  UseMonitorTableConfigOptions,
  UseMonitorTableConfigReturn,
} from '../lib/monitor-table-types';

// 导出类型定义（向后兼容）
export type {
  UseMonitorTableConfigOptions,
  UseMonitorTableConfigReturn,
} from '../lib/monitor-table-types';

/**
 * 监控配置表格配置聚合 Hook
 *
 * 🎯 Hook 聚合模式 + 自动刷新机制
 * - 使用 useBusinessTable 统一管理表格逻辑
 * - 通过 operationWrapper 实现自动刷新
 * - 替换原有的 useManagementRefresh 模式
 *
 * 架构优化：
 * - 数据请求逻辑提取到 `lib/monitor-table-request.ts`
 * - 表格配置常量提取到 `lib/monitor-table-config.ts`
 * - 列配置逻辑提取到 `lib/monitor-columns.tsx`
 * - 筛选配置提取到 `lib/monitor-filters.ts`
 * - 辅助函数提取到 `lib/config-data-utils.ts`
 *
 * @param options - Hook 配置选项
 * @returns 表格配置和处理器
 */
export const useMonitorTableConfig = ({
  onEdit: _onEdit,
  onDelete: _onDelete,
  dataSourceType,
  ref,
}: UseMonitorTableConfigOptions & {
  ref?: React.Ref<CustomTableActionType>;
}): UseMonitorTableConfigReturn => {
  // 🎯 数据请求逻辑
  const request = useMemo(
    () => createMonitorTableRequest(dataSourceType),
    [dataSourceType],
  );

  // 🎯 数据源配置 - 使用工具函数
  const dataSource = useMemo(
    () => createServerPaginationDataSource({ request }),
    [request],
  );

  // 🎯 表格配置 - 使用工具函数，保留 border 配置
  const tableProps = useMemo(
    () => ({
      ...createStandardTableProps({
        rowKey: '_id',
        pageSize: 10,
        scrollX: 'max-content',
      }),
      border: {
        wrapper: true,
        cell: true,
      },
    }),
    [],
  );

  // 🎯 业务操作包装 - 自动刷新
  const { customTableProps, customOperations, operations, wrappedHandlers } =
    useBusinessTable({
      dataSource,
      tableProps,
      handlers: _onDelete
        ? {
            delete: async (monitorId: string) => {
              return await _onDelete(monitorId);
            },
          }
        : undefined,
      refreshConfig: {
        enableRefreshFeedback: true,
        successMessage: '操作成功',
        errorMessage: '操作失败，请重试',
      },
      ref,
    });

  // 🎯 列配置 - 使用提取的列配置函数
  const handleColumns = useCallback(
    (_props: Record<string, unknown>) => {
      return createMonitorTableColumns(dataSourceType);
    },
    [dataSourceType],
  );

  // 🎯 筛选配置 - 使用提取的筛选配置函数
  const handleFilters = useCallback(
    (props: HandleFilterProps<BaseQuery>): FieldItem[] => {
      return createMonitorTableFilters(props);
    },
    [],
  );

  return {
    customTableProps,
    customOperations,
    operations,
    wrappedHandlers,
    handleColumns,
    handleFilters,
  };
};
