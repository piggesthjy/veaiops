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
 * 缺失的组件类型定义
 */

import type { PaginationProps } from '@arco-design/web-react/es/Pagination/pagination';
import type { ColumnProps } from '@arco-design/web-react/es/Table/interface';
import type { ReactNode } from 'react';
import type { BaseRecord } from '../core';
import type { TableTitleProps } from './table-title';

/**
 * 选项类型
 */
// Option 类型已移至 @veaiops/types/components

/**
 * 自定义标题属性
 */
export interface CustomTitleProps {
  title?: React.ReactNode;
  actions?: React.ReactNode[];
  className?: string;
  style?: React.CSSProperties;
  [key: string]: unknown;
}

/**
 * 表格列标题属性（扩展 TableTitleProps，用于自定义表头组件）
 * 注意：TableTitleProps 已在 table-title.ts 中定义
 */
export interface TableColumnTitleProps extends TableTitleProps {
  dataIndex?: string;
  filterDataIndex?: string;
  filters?: Record<string, unknown>;
  onChange?: (type: string, value?: Record<string, unknown>) => void;
  queryOptions?: (
    params: Record<string, unknown>,
  ) => Promise<unknown> | unknown;
  tip?: string;
  sorter?: unknown;
  multiple?: boolean;
  showTip?: boolean;
  frontEnum?: unknown;
  [key: string]: unknown;
}

/**
 * 注意：以下类型已在对应的源文件中定义，此处移除避免重复导出：
 * - TableContentProps: 已在 table-content.ts 中定义
 * - DefaultStreamFooterProps: 已在 default-footer.ts 中定义
 * - DefaultFooterProps: 已在 default-footer.ts 中定义
 * - SimpleOptions: 已在 title-search.ts 中定义（类型为 string[] | number[]）
 * - SelectCustomWithFooterProps: 已在 title-search.ts 中定义
 * - CustomCheckBoxProps: 已在 title-checkbox.ts 中定义
 * - TableTitleProps: 已在 table-title.ts 中定义
 * - TableHeaderConfig: 已在 table-content.ts 中定义
 * - TableContentLoadingConfig: 已在 table-content.ts 中定义
 * - TableRenderers: 已在 table-content.ts 中定义
 * - TableAlertProps: 已在 table-alert.ts 中定义
 * - StreamRetryButtonProps: 已在 stream-retry-button.ts 中定义
 * 如需使用这些类型，请从对应的源文件或统一导出入口导入
 */

/**
 * 自定义表格列属性
 */
export interface CustomTableColumnProps<T = Record<string, unknown>> {
  title: React.ReactNode;
  dataIndex?: string;
  key?: string;
  width?: number | string;
  fixed?: 'left' | 'right';
  sorter?: boolean | ((a: T, b: T) => number);
  render?: (value: unknown, record: T, index: number) => React.ReactNode;
  [key: string]: unknown;
}

/**
 * 查询选项接口
 */
export interface IQueryOptions {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * RetryHandlerProps、RetryState、RetryOptions 已在 retry-handler.ts 中定义，此处移除避免重复
 * RetryConfig 已在 stream-retry-button.ts 中定义，此处移除避免重复
 * 如需使用，请从 '@/custom-table/types/components/retry-handler' 或 '@/custom-table/types' 导入
 */

/**
 * FormTableDataProps 已在 core/common.ts 中定义，此处移除避免重复
 * 如需使用，请从 '@/custom-table/types/core' 或 '@/custom-table/types' 导入
 */

/**
 * CustomTable 组件属性类型
 * 注意：CustomTableProps 已从 props.ts 导出，此处移除避免重复定义
 * 如需使用 CustomTableProps，请从 '@/custom-table/types' 或 '@/custom-table/types/components' 导入
 */

/**
 * PaginationConfig 已在 props.ts 中定义，此处移除避免重复
 * 如需使用，请从 '@/custom-table/types/components' 或 '@/custom-table/types' 导入
 */

/**
 * 自定义字段属性
 */
export interface CustomFieldsProps<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  disabledFields: Map<string, boolean>;
  columns: ColumnProps<T>[];
  value: string[];
  confirm: (value: string[]) => void;
}

/**
 * 自定义字段状态（已移至 custom-fields/types.ts，保留此处仅为向后兼容）
 * @deprecated 请使用 plugins/custom-fields/types 中的定义
 */
export interface CustomFieldsState {
  showCustomFields: boolean;
  selectedFields: string[];
  availableColumns: Array<{
    dataIndex?: string;
    title?: string;
    [key: string]: unknown;
  }>;
  disabledFields: Map<string, boolean> | string[];
}

/**
 * CustomFilterSettingState 已在 plugins/custom-filter-setting/types.ts 中定义，此处移除避免重复
 * 如需使用，请从 '@/custom-table/types/plugins' 或 '@/custom-table/types' 导入
 */

/**
 * CustomEditorProps 已在 plugins/inline-edit.ts 中定义，此处移除避免重复
 * 如需使用，请从 '@/custom-table/types/plugins' 或 '@/custom-table/types' 导入
 */
