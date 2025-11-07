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

import { ResizableTableTitle as ResizableHeader } from '@/custom-table/components/resize-col';
import { PluginNames } from '@/custom-table/constants/enum';
/**
 * 表格列管理插件
 */
import type {
  BaseQuery,
  BaseRecord,
  PluginContext,
  PluginFactory,
  TableColumnsConfig,
} from '@/custom-table/types';
import { PluginPriorityEnum } from '@/custom-table/types/core/enums';
import { DEFAULT_TABLE_COLUMNS_CONFIG } from './config';
import type { TableColumnsPluginProps } from './types';

export const TableColumnsPlugin: PluginFactory<TableColumnsConfig> = (
  config: TableColumnsConfig = {},
) => {
  const finalConfig = { ...DEFAULT_TABLE_COLUMNS_CONFIG, ...config };

  return {
    name: PluginNames.TABLE_COLUMNS,
    version: '1.0.0',
    description: '表格列管理插件',
    priority: finalConfig.priority || PluginPriorityEnum.HIGH,
    enabled: finalConfig.enabled !== false,
    dependencies: [],
    conflicts: [],

    install(_context: PluginContext) {
      // 安装时的操作
    },

    setup<
      TRecord extends BaseRecord = BaseRecord,
      TQuery extends BaseQuery = BaseQuery,
    >(
      context: PluginContext<
        TRecord,
        TQuery,
        TableColumnsPluginProps<TRecord, TQuery>
      >,
    ) {
      // 初始化列处理
      const {
        props,
        state: { query },
      } = context;

      const { handleColumns } = props;
      const handleColumnsProps = props.handleColumnsProps || {};
      const { initFilters } = props;

      // 生成基础列
      const baseColumns =
        typeof handleColumns === 'function'
          ? handleColumns({
              ...handleColumnsProps,
              query,
            })
          : [];

      // 插件设置逻辑 - 不调用 Hook，只进行配置
      // Hook 调用已移到组件层面
      // 直接使用基础列配置
      Object.assign(context.state, {
        columns: baseColumns,
        originalColumns: baseColumns,
        columnSettings: {},
      });

      // 设置初始过滤器状态
      if (!context.state.filters) {
        Object.assign(context.state, {
          filters: initFilters || {},
        });
      }

      // 添加列相关方法到上下文
      Object.assign(context.helpers, {
        setColumnVisible: (dataIndex: string, visible: boolean) => {
          // 基于 pro-components 的列可见性控制实现
          const currentColumns =
            (context.state as { columns?: Record<string, unknown>[] })
              .columns || [];
          const updatedColumns = currentColumns.map(
            (col: Record<string, unknown>) =>
              col.dataIndex === dataIndex ? { ...col, hidden: !visible } : col,
          );
          Object.assign(context.state, { columns: updatedColumns });
        },
        setColumnWidth: (dataIndex: string, width: number) => {
          // 设置指定列的宽度
          const currentColumns =
            (context.state as { columns?: Record<string, unknown>[] })
              .columns || [];
          const updatedColumns = currentColumns.map(
            (col: Record<string, unknown>) =>
              col.dataIndex === dataIndex ? { ...col, width } : col,
          );
          Object.assign(context.state, { columns: updatedColumns });
        },
        setColumnFixed: (
          dataIndex: string,
          fixed: 'left' | 'right' | false,
        ) => {
          // 设置列固定位置
          const currentColumns =
            (context.state as { columns?: Record<string, unknown>[] })
              .columns || [];
          const updatedColumns = currentColumns.map(
            (col: Record<string, unknown>) =>
              col.dataIndex === dataIndex ? { ...col, fixed } : col,
          );
          Object.assign(context.state, { columns: updatedColumns });
        },
        setColumnOrder: (newOrder: string[]) => {
          // 重新排序列
          const currentColumns =
            (context.state as { columns?: Record<string, unknown>[] })
              .columns || [];
          const orderedColumns = newOrder
            .map((dataIndex) =>
              currentColumns.find(
                (col: Record<string, unknown>) => col.dataIndex === dataIndex,
              ),
            )
            .filter(Boolean);
          Object.assign(context.state, { columns: orderedColumns });
        },
        resetColumns: () => {
          // 重置列配置到初始状态
          Object.assign(context.state, {
            columns: baseColumns,
            originalColumns: baseColumns,
          });
        },
        setFilters: context.helpers.setFilters,
      });
    },

    update(_context: PluginContext) {
      // 当配置或数据更新时的操作
    },

    uninstall(_context: PluginContext) {
      // 卸载时的清理操作
    },

    // 列管理钩子
    hooks: {
      // 获取当前列配置
      getColumns(...args: unknown[]) {
        const context = args[0] as PluginContext;
        // 优先从state获取，如果没有则从props.baseColumns获取
        return (
          (context.state as { columns?: unknown[] }).columns ||
          context.props.baseColumns ||
          []
        );
      },

      // 重置列配置
      resetColumns(...args: unknown[]) {
        const context = args[0] as PluginContext;
        (context.helpers as { resetColumns?: () => void }).resetColumns?.();
      },

      // 过滤列
      filterColumns(...args: unknown[]) {
        const context = args[0] as PluginContext;
        const predicate = args[1] as (
          column: Record<string, unknown>,
        ) => boolean;
        return (
          (context.state as { columns?: Record<string, unknown>[] }).columns ||
          []
        ).filter(predicate);
      },
      // 列宽拖拽（兼容 legacy）：返回可用于 Table 的 onHeaderCell 配置
      getResizableHeaderProps(...args: unknown[]) {
        const context = args[0] as PluginContext;
        const dataIndex = args[1] as string;
        const width = args[2] as number | undefined;
        return {
          component: ResizableHeader,
          width,
          handleAxis: 'e',
          onResize: (data: { size?: { width?: number } }) => {
            const next = Math.max(60, data.size?.width || 60);
            (
              context.helpers as {
                setColumnWidth?: (dataIndex: string, width: number) => void;
              }
            ).setColumnWidth?.(dataIndex, next);
          },
        };
      },
    },
  };
};
