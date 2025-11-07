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

// ✅ 优化：合并同源导入
import { DEFAULT_TABLE_COLUMNS_CONFIG } from '@/custom-table/plugins/table-columns/config';
import type {
  ColumnItem,
  UseColumnsProps,
  UseColumnsResult,
} from '@/custom-table/types';
/**
 * 表格列配置管理Hook
 * 专用于列的可见性、宽度、固定位置等基础配置管理
 * 适用于插件化架构的表格系统
 */
import { useCallback, useMemo, useState } from 'react';

// 类型已迁移到 ../types/hooks/column-config.ts

/**
 * 表格列配置管理Hook
 *
 * @description 专门用于管理表格列的基础配置，包括：
 * - 列的可见性控制
 * - 列宽度动态调整
 * - 列固定位置设置
 * - 列显示顺序管理
 *
 * @example
 * ```tsx
 * const { columns, setColumnVisible, setColumnWidth } = useColumnConfig({
 *   baseColumns: myColumns,
 *   config: { enableColumnVisibility: true }
 * });
 * ```
 */
export const useColumns = <RecordType = Record<string, unknown>>({
  baseColumns = [],
  defaultFilters = {},
  config = {},
}: UseColumnsProps<RecordType>): UseColumnsResult<RecordType> => {
  const { enableColumnVisibility = true } = {
    ...DEFAULT_TABLE_COLUMNS_CONFIG,
    ...config,
  };

  // 列配置和可见性状态
  const [columnSettings, setColumnSettings] = useState<
    Record<
      string,
      {
        visible: boolean;
        width?: number | string;
        fixed?: 'left' | 'right';
        order?: number;
      }
    >
  >({});

  // 过滤器状态
  const [filters, setFilters] = useState<Record<string, (string | number)[]>>(
    defaultFilters || {},
  );

  // 查询参数
  const [query, setQuery] = useState<Record<string, unknown>>({});

  // 应用列配置
  const columns = useMemo(() => {
    if (!baseColumns || baseColumns.length === 0) {
      return [];
    }

    return baseColumns.map((column: any) => {
      const key = column.dataIndex;
      const setting = columnSettings[key];

      if (setting) {
        return {
          ...column,
          visible: setting.visible !== undefined ? setting.visible : true,
          width: setting.width || column.width,
          fixed: setting.fixed || column.fixed,
        };
      }

      return {
        ...column,
        visible: true,
      };
    });
  }, [baseColumns, columnSettings]);

  // 过滤可见列
  const visibleColumns = useMemo(() => {
    if (!enableColumnVisibility) {
      return columns;
    }
    return columns.filter((column: any) => column.visible !== false);
  }, [columns, enableColumnVisibility]);

  /**
   * 设置列可见性的参数接口
   */
  interface SetColumnVisibleParams {
    key: string;
    visible: boolean;
  }

  // 设置列可见性
  const setColumnVisible = useCallback(
    ({ key, visible }: SetColumnVisibleParams) => {
      setColumnSettings((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          visible,
        },
      }));
    },
    [],
  );

  /**
   * 设置列宽度的参数接口
   */
  interface SetColumnWidthParams {
    key: string;
    width: number | string;
  }

  // 设置列宽度
  const setColumnWidth = useCallback(({ key, width }: SetColumnWidthParams) => {
    setColumnSettings((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        width,
      },
    }));
  }, []);

  /**
   * 设置列固定的参数接口
   */
  interface SetColumnFixedParams {
    key: string;
    fixed: 'left' | 'right' | undefined;
  }

  // 设置列固定
  const setColumnFixed = useCallback(({ key, fixed }: SetColumnFixedParams) => {
    setColumnSettings((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        fixed,
      },
    }));
  }, []);

  // 设置列顺序
  interface SetColumnOrderParams {
    key: string;
    order: number;
  }

  const setColumnOrder = useCallback(({ key, order }: SetColumnOrderParams) => {
    setColumnSettings((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        order,
      },
    }));
  }, []);

  // 重置列设置
  const resetColumns = useCallback(() => {
    setColumnSettings({});
  }, []);

  return {
    columns: visibleColumns as ColumnItem<RecordType>[],
    originalColumns: columns as ColumnItem<RecordType>[],
    columnSettings,
    filters,
    query,
    setFilters,
    setQuery,
    setColumnVisible,
    setColumnWidth,
    setColumnFixed,
    setColumnOrder,
    resetColumns,
  };
};

export { useColumns as useColumnConfig };
