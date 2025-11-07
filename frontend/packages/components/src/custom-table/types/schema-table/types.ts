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
 * Schema表格类型定义
 * @description 配置化表格的类型定义

 * @date 2025-12-19
 */

import type { TableColumnProps } from '@arco-design/web-react';
import type { BaseRecord } from '@veaiops/types';
import type { ReactNode } from 'react';

// Re-export BaseRecord for use in schema-table preset
export type { BaseRecord };

// 字段值类型枚举
export type FieldValueType =
  | 'text'
  | 'number'
  | 'date'
  | 'dateTime'
  | 'dateRange'
  | 'select'
  | 'multiSelect'
  | 'boolean'
  | 'money'
  | 'percent'
  | 'image'
  | 'link'
  | 'tag'
  | 'status'
  | 'progress'
  | 'rate'
  | 'color'
  | 'json'
  | 'custom';

// 筛选器类型
export type FilterType =
  | 'input'
  | 'select'
  | 'multiSelect'
  | 'dateRange'
  | 'numberRange'
  | 'cascader'
  | 'treeSelect'
  | 'custom';

// 筛选器配置（Schema Table 专用，避免与 components 中的 FilterConfig 冲突）
export interface SchemaFilterConfig {
  type: FilterType;
  label?: string;
  placeholder?: string;
  options?: Array<{ label: string; value: unknown; children?: unknown[] }>;
  multiple?: boolean;
  allowClear?: boolean;
  showSearch?: boolean;
  request?: <TParams = unknown>(params: TParams) => Promise<unknown[]>;
  dependencies?: string[]; // 依赖的其他筛选字段
  transform?: <TValue = unknown, TResult = unknown>(value: TValue) => TResult; // 值转换函数
  rules?: Array<{
    required?: boolean;
    message?: string;
    validator?: <TValue = unknown>(value: TValue) => boolean | string;
  }>;
}

// 列Schema定义
export interface ColumnSchema<T = BaseRecord> {
  // 基础属性
  key: string;
  title: string;
  dataIndex: string;
  valueType?: FieldValueType;

  // 显示控制
  width?: number | string;
  fixed?: 'left' | 'right';
  align?: 'left' | 'center' | 'right';
  ellipsis?: boolean;
  tooltip?: boolean | string;
  copyable?: boolean;

  // 排序
  sortable?: boolean;
  sorter?: boolean | ((a: T, b: T) => number);
  defaultSortOrder?: 'ascend' | 'descend';

  // 筛选
  filterable?: boolean;
  filterConfig?: SchemaFilterConfig;
  hideInSearch?: boolean;

  // 渲染
  render?: <TValue = unknown>(
    value: TValue,
    record: T,
    index: number,
  ) => ReactNode;
  renderText?: <TValue = unknown>(value: TValue, record: T) => string;

  // 编辑
  editable?: boolean;
  editConfig?: {
    type: 'input' | 'select' | 'date' | 'number';
    options?: Array<{ label: string; value: unknown }>;
    rules?: Array<Record<string, unknown>>;
  };

  // 值枚举（用于select类型）
  valueEnum?: Record<
    string,
    {
      text: string;
      status?: 'success' | 'processing' | 'error' | 'warning' | 'default';
      color?: string;
      disabled?: boolean;
    }
  >;

  // 格式化
  format?: {
    precision?: number; // 数字精度
    prefix?: string;
    suffix?: string;
    dateFormat?: string;
    moneySymbol?: string;
  };

  // 显示隐藏
  hideInTable?: boolean;
  hideInForm?: boolean;
  hideInDetail?: boolean;

  // 其他Arco Table列属性
  [key: string]: unknown;
}

// 操作按钮配置（Schema Table 专用，避免与 components 中的 ActionConfig 冲突）
export interface SchemaActionConfig {
  key: string;
  label: string;
  type?: 'primary' | 'secondary' | 'dashed' | 'text' | 'outline';
  status?: 'warning' | 'danger' | 'success' | 'default';
  icon?: ReactNode;
  disabled?: boolean | ((record: BaseRecord) => boolean);
  visible?: boolean | ((record: BaseRecord) => boolean);
  onClick: (record: BaseRecord, index: number) => void;
  confirm?: {
    title: string;
    content?: string;
  };
}

// 工具栏配置（Schema Table 专用，避免与 components 中的 ToolbarConfig 冲突）
export interface SchemaToolbarConfig {
  title?: string;
  subTitle?: string;
  actions?: Array<{
    key: string;
    label: string;
    type?: 'primary' | 'secondary' | 'dashed' | 'text' | 'outline';
    icon?: ReactNode;
    onClick: () => void;
  }>;
  settings?: {
    density?: boolean; // 密度调整
    columnSetting?: boolean; // 列设置
    fullScreen?: boolean; // 全屏
    reload?: boolean; // 刷新
  };
}

// 分页配置（Schema Table 专用，避免与 components 中的 PaginationConfig 冲突）
export interface SchemaPaginationConfig {
  current?: number;
  pageSize?: number;
  total?: number;
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
  showTotal?: boolean | ((total: number, range: [number, number]) => ReactNode);
  pageSizeOptions?: string[];
  simple?: boolean;
  size?: 'default' | 'small';
  position?:
    | 'topLeft'
    | 'topCenter'
    | 'topRight'
    | 'bottomLeft'
    | 'bottomCenter'
    | 'bottomRight';
}

// 请求配置
export interface RequestConfig<T = BaseRecord> {
  url?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  params?: Record<string, unknown>;
  transform?: <TData = unknown>(
    data: TData,
  ) => {
    data: T[];
    total?: number;
    success?: boolean;
  };
  onError?: (error: Error) => void;
  onSuccess?: (data: T[]) => void;
}

// 表格Schema主配置
export interface TableSchema<T = BaseRecord> {
  // 基础信息
  title?: string;
  description?: string;

  // 列定义
  columns: ColumnSchema<T>[];

  // 数据源
  dataSource?: T[];
  request?:
    | RequestConfig<T>
    | (<TParams = unknown>(
        params: TParams,
      ) => Promise<{
        data: T[];
        total?: number;
        success?: boolean;
      }>);

  // 功能配置
  features?: {
    // 基础功能
    pagination?: boolean | SchemaPaginationConfig;
    search?:
      | boolean
      | {
          layout?: 'horizontal' | 'vertical' | 'inline';
          collapsed?: boolean;
          collapseRender?: (collapsed: boolean) => ReactNode;
          resetText?: string;
          searchText?: string;
        };
    toolbar?: boolean | SchemaToolbarConfig;

    // 高级功能
    rowSelection?:
      | boolean
      | {
          type?: 'checkbox' | 'radio';
          fixed?: boolean;
          columnWidth?: number;
          onChange?: (selectedRowKeys: React.Key[], selectedRows: T[]) => void;
        };
    expandable?:
      | boolean
      | {
          expandedRowRender?: (record: T, index: number) => ReactNode;
          rowExpandable?: (record: T) => boolean;
        };

    // 交互功能
    draggable?: boolean;
    resizable?: boolean;
    editable?: boolean;

    // 样式功能
    bordered?: boolean;
    size?: 'default' | 'middle' | 'small';
    loading?: boolean;
    empty?: ReactNode;
  };

  // 操作列
  actions?: {
    width?: number;
    fixed?: 'left' | 'right';
    items: SchemaActionConfig[];
  };

  // 事件回调
  events?: {
    onRow?: <TReturn = Record<string, unknown>>(
      record: T,
      index: number,
    ) => TReturn;
    onHeaderRow?: <TReturn = Record<string, unknown>>(
      columns: ColumnSchema<T>[],
      index: number,
    ) => TReturn;
    onChange?: (
      pagination: Record<string, unknown>,
      filters: Record<string, unknown>,
      sorter: Record<string, unknown>,
    ) => void;
    onSearch?: (values: Record<string, unknown>) => void;
    onReset?: () => void;
  };

  // 样式配置
  style?: {
    className?: string;
    tableClassName?: string;
    headerClassName?: string;
    bodyClassName?: string;
    footerClassName?: string;
  };

  // 预设模板
  preset?:
    | 'basic'
    | 'advanced'
    | 'editable'
    | 'readonly'
    | 'mobile'
    | 'dashboard';

  // 扩展配置
  plugins?: string[];
  customConfig?: Record<string, unknown>;
}

// Schema构建器接口
export interface TableSchemaBuilder<T = BaseRecord> {
  // 基础方法
  setTitle: (title: string) => this;
  setDescription: (description: string) => this;

  // 列管理
  addColumn: (column: ColumnSchema<T>) => this;
  removeColumn: (key: string) => this;
  updateColumn: (params: {
    key: string;
    updates: Partial<ColumnSchema<T>>;
  }) => this;

  // 功能配置
  enablePagination: (config?: SchemaPaginationConfig) => this;
  enableSearch: (config?: boolean | object) => this;
  enableToolbar: (config?: SchemaToolbarConfig) => this;
  enableRowSelection: (config?: boolean | object) => this;

  // 数据源
  setDataSource: (dataSource: T[]) => this;
  setRequest: (
    request:
      | RequestConfig<T>
      | (<TParams = unknown>(
          params: TParams,
        ) => Promise<{
          data: T[];
          total?: number;
          success?: boolean;
        }>),
  ) => this;

  // 操作
  addAction: (action: SchemaActionConfig) => this;

  // 构建
  build: () => TableSchema<T>;

  // 验证
  validate: () => { valid: boolean; errors: string[] };
}

// 预设模板类型
export interface PresetTemplate {
  name: string;
  description: string;
  schema: Partial<TableSchema>;
  preview?: string; // 预览图片URL
}

// Schema验证结果
export interface ValidationResult {
  valid: boolean;
  errors: Array<{
    field: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
}

// 表格实例方法
export interface SchemaTableInstance<T = BaseRecord> {
  // 数据操作
  reload: () => Promise<void>;
  getDataSource: () => T[];
  setDataSource: (data: T[]) => void;

  // 筛选操作
  getFilters: () => Record<string, unknown>;
  setFilters: (filters: Record<string, unknown>) => void;
  resetFilters: () => void;

  // 选择操作
  getSelectedRows: () => T[];
  getSelectedRowKeys: () => React.Key[];
  setSelectedRows: (keys: React.Key[]) => void;
  clearSelection: () => void;

  // 分页操作
  getCurrentPage: () => number;
  getPageSize: () => number;
  setPage: (page: number, pageSize?: number) => void;

  // 排序操作
  getSorter: () => { field: string; order: 'ascend' | 'descend' } | null;
  setSorter: (field: string, order: 'ascend' | 'descend' | null) => void;

  // 导出功能
  exportData: (format?: 'csv' | 'excel' | 'json') => void;

  // 刷新
  refresh: () => void;
}

// 组件Props
export interface SchemaTableProps<T = BaseRecord> {
  schema: TableSchema<T>;
  className?: string;
  style?: React.CSSProperties;
  onReady?: (instance: SchemaTableInstance<T>) => void;
}
