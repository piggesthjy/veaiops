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

import { Button } from '@arco-design/web-react';
import { IconPlus } from '@arco-design/web-react/icon';
import type { FieldItem, ModernTableColumnProps } from '@veaiops/components';
import { useBusinessTable } from '@veaiops/components';
import type { HandleFilterProps } from '@veaiops/components/src/custom-table/types';
import {
  createLocalDataSource,
  createStandardTableProps,
} from '@veaiops/utils';
import type { MetricTemplate } from 'api-generate';
import { useMemo } from 'react';
import { getMetricTemplateColumns } from '../lib/columns';
import { getMetricTemplateFilters } from '../lib/filters';
import { createMetricTemplateTableRequestWrapper } from '../lib/metric-template-request';

/**
 * 指标模板表格操作回调类型
 */
export interface MetricTemplateTableActions {
  onEdit?: (record: MetricTemplate) => Promise<boolean>;
  onDelete?: (id: string) => Promise<boolean>;
  onCreate?: () => Promise<boolean>;
  onToggleStatus?: (id: string, isActive: boolean) => Promise<boolean>;
}

/**
 * 指标模板表格配置 Hook 的返回值类型
 *
 * 使用标准类型，避免自定义类型
 */
export interface UseMetricTemplateTableConfigReturn {
  // 表格配置
  customTableProps: ReturnType<typeof useBusinessTable>['customTableProps'];
  handleColumns: (
    props: Record<string, unknown>,
  ) => ModernTableColumnProps<MetricTemplate>[];
  handleFilters: (props: HandleFilterProps) => FieldItem[];
  actionButtons: JSX.Element[];
}

/**
 * 指标模板表格配置 Hook
 *
 * 🎯 完全按照 CUSTOM_TABLE_REFACTOR_TASKS.md 规范实现：
 * - Hook 聚合模式：内聚所有表格相关逻辑
 * - 自动刷新机制：集成 useBusinessTable 实现操作后自动刷新
 * - Props 完全内聚：将所有表格 props 统一返回，减少组件代码行数
 * - 标准化类型：使用 @veaiops/components 和 api-generate 的标准类型
 * - 标准化架构：统一的配置结构和返回接口
 *
 * 🏗️ 内聚内容：
 * - 数据请求逻辑和数据源配置
 * - 表格配置（分页、样式等）
 * - 列配置和筛选配置
 * - 操作配置和业务操作包装
 * - 所有 UI props 的统一返回
 *
 * @param tableActions - 表格操作回调配置
 * @returns 表格配置和处理器
 */
export const useMetricTemplateTableConfig = (
  tableActions: MetricTemplateTableActions,
): UseMetricTemplateTableConfigReturn => {
  // 🎯 数据请求逻辑
  const request = useMemo(() => createMetricTemplateTableRequestWrapper(), []);

  // 🎯 数据源配置 - 启用自动刷新
  // 注意：metric-template 使用前端分页，但仍然使用服务器端分页模式以支持自动刷新
  const dataSource = useMemo(
    () => ({
      request,
      ready: true,
      isServerPagination: true, // ⚠️ 重要：启用自动刷新
    }),
    [request],
  );

  // 🎯 表格配置 - 使用工具函数
  const tableProps = useMemo(
    () =>
      createStandardTableProps({
        rowKey: '_id',
        pageSize: 20,
        scrollX: 1200,
      }),
    [],
  );

  // 🎯 业务操作包装 - 自动刷新
  const { customTableProps } = useBusinessTable({
    dataSource,
    tableProps,
    refreshConfig: {
      enableRefreshFeedback: true,
      successMessage: '操作成功',
      errorMessage: '操作失败，请重试',
    },
    operationWrapper: ({ wrapDelete }) => {
      const ops: Record<string, (...args: unknown[]) => unknown> = {};
      if (tableActions.onDelete) {
        ops.handleDelete = wrapDelete(tableActions.onDelete) as (
          ...args: unknown[]
        ) => unknown;
      }
      return ops;
    },
  });

  // 🎯 列配置 - 使用标准类型
  const handleColumns = useMemo(
    () =>
      (
        _props: Record<string, unknown>,
      ): ModernTableColumnProps<MetricTemplate>[] =>
        getMetricTemplateColumns({
          onEdit:
            tableActions.onEdit || (async (_template: MetricTemplate) => false),
          onDelete: tableActions.onDelete || (async () => false),
        }),
    [tableActions.onEdit, tableActions.onDelete], // ✅ 只依赖具体函数
  );

  // 🎯 筛选配置 - 使用 useMemo 稳定化返回的数组和 onChange 函数
  // 由于 Filters 组件会深度比较 config，需要确保 onChange 函数引用稳定
  const handleFilters = useMemo(
    () =>
      (props: HandleFilterProps): FieldItem[] => {
        // 直接调用原始函数，Filters 组件已优化为忽略 onChange 的引用比较
        return getMetricTemplateFilters({
          query: props.query,
          handleChange: props.handleChange,
        });
      },
    [],
  );

  // 🎯 操作按钮配置 - 内聚操作按钮逻辑
  const actionButtons = useMemo(() => {
    const buttons: JSX.Element[] = [];
    if (tableActions.onCreate) {
      buttons.push(
        <Button
          key="create"
          type="primary"
          icon={<IconPlus />}
          onClick={tableActions.onCreate}
          data-testid="new-metric-template-btn"
        >
          新建模板
        </Button>,
      );
    }
    return buttons;
  }, [tableActions.onCreate]);

  return {
    customTableProps,
    handleColumns,
    handleFilters,
    actionButtons,
  };
};
