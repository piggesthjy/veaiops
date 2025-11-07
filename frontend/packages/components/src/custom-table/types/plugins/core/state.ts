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
 * 状态和辅助方法类型定义
 */

import type {
  ColumnProps,
  SorterInfo,
} from '@arco-design/web-react/es/Table/interface';
import type { BaseQuery, BaseRecord } from '@veaiops/types';
import type { ReactNode } from 'react';
import type { PluginLifecycle } from './base';

/**
 * CustomTable 状态类型
 */
export interface CustomTableState<
  RecordType extends BaseRecord = BaseRecord,
  QueryType extends BaseQuery = BaseQuery,
> {
  current: number;
  pageSize: number;
  query: QueryType;
  sorter: SorterInfo;
  filters: Record<string, (string | number)[]>;
  formattedTableData: RecordType[];
  loading: boolean;
  error?: Error | null;
  tableTotal: number;
  resetEmptyData: boolean;
  selectedRowKeys?: (string | number)[];
  expandedRowKeys?: (string | number)[];

  // Alert 相关状态
  isAlertShow?: boolean;
  alertType?: 'info' | 'success' | 'warning' | 'error';
  alertContent?: ReactNode;
  customAlertNode?: ReactNode;

  // 插件相关状态
  enableCustomFields?: boolean;
  customFieldsProps?: Record<string, unknown>;
  baseColumns?: ColumnProps<RecordType>[];
  enableFilterSetting?: boolean;
  filterSettingProps?: Record<string, unknown>;
  // 行选择插件状态
  rowSelection?: unknown;
  // 智能单元格插件状态
  smartCell?: Record<string, unknown>;
}

/**
 * CustomTable 辅助方法类型
 */
export interface CustomTableHelpers<
  RecordType extends BaseRecord = BaseRecord,
  QueryType extends BaseQuery = BaseQuery,
> {
  setCurrent: (page: number) => void;
  setPageSize: (size: number) => void;
  setQuery: (query: QueryType | ((prev: QueryType) => QueryType)) => void;
  updateQuery: (newQuery: Partial<QueryType>) => void;
  setFormattedTableData?: (data: RecordType[]) => void;
  setFilters: (filters: Record<string, (string | number)[]>) => void;
  setLoading: (loading: boolean) => void;
  setResetEmptyData: (reset: boolean) => void;
  setError: (error: Error | null) => void;
  reset: (options?: { resetEmptyData?: boolean }) => void;
  handleChange?: {
    (key: string, value: unknown): void;
    (object: Record<string, unknown>): void;
  };
  loadMoreData?: () => void;
  // 行选择相关方法
  setSelectedRowKeys?: (keys: (string | number)[]) => void;
  // 行展开相关方法
  setExpandedRowKeys?: (keys: (string | number)[]) => void;
  // 数据请求相关方法
  run?: () => void;
  reload?: () => void;
  // 查询同步相关方法
  querySync?: unknown;
  manualSyncQuery?: () => void;
  resetQuery?: (resetEmptyData?: boolean) => void;
  // 生命周期相关方法
  lifecycle?: {
    trigger: ({
      phase,
      pluginName,
    }: {
      phase: PluginLifecycle;
      pluginName: string;
    }) => Promise<void>;
    addListener?: <TListener extends (...args: unknown[]) => void>(
      listener: TListener,
    ) => void;
    removeListener?: <TListener extends (...args: unknown[]) => void>(
      listener: TListener,
    ) => void;
    getMetrics?: () => Record<string, unknown>;
  };
  // 排序相关方法
  getSorterParam?: () => Record<string, unknown>;
  resetSorter?: () => void;
  setSorter?: (sorter: SorterInfo) => void;
  // 过滤相关方法
  resetFilterValues?: () => void;

  // 刷新集成相关方法（业务语义化）
  /** 创建操作后刷新 */
  afterCreate?: () => Promise<boolean>;
  /** 更新操作后刷新 */
  afterUpdate?: () => Promise<boolean>;
  /** 删除操作后刷新 */
  afterDelete?: () => Promise<boolean>;
  /** 导入操作后刷新 */
  afterImport?: () => Promise<boolean>;
  /** 批量操作后刷新 */
  afterBatchOperation?: () => Promise<boolean>;
  /** 带反馈的刷新 */
  refreshWithFeedback?: () => Promise<boolean>;
  /** 静默刷新 */
  refreshSilently?: () => Promise<boolean>;
}
