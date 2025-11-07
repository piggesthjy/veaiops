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
 * CustomTable 实例API类型定义
 */
import type {
  BaseQuery,
  BaseRecord,
  ExtendedSorterInfo,
  FiltersProps,
} from '../core/common';
// 使用相对路径避免循环依赖（不能使用 @/custom-table/types，因为 types/index.ts 会导出此文件）
import type {
  CustomTableHelpers,
  CustomTableState,
} from '../plugins/core/state';

/**
 * CustomTable 实例 API 类型
 */
export interface CustomTableActionType<
  RecordType extends BaseRecord = BaseRecord,
  QueryType extends BaseQuery = BaseQuery,
> {
  // 数据操作
  /** 重新加载数据 */
  reload: () => Promise<void>;
  /** 重载并重置 */
  reloadAndReset?: () => Promise<void>;
  /** 刷新数据 */
  refresh: () => Promise<void>;
  /** 取消当前请求 */
  cancel: () => void;
  /** 获取当前数据 */
  getData: () => RecordType[];
  /** 获取数据源 */
  getDataSource: () => RecordType[];
  /** 获取格式化数据 */
  getFormattedData: () => RecordType[];
  /** 导出数据 */
  exportData: () => RecordType[];
  /** 设置数据 */
  setData: (data: RecordType[]) => void;

  // 分页操作
  /** 设置当前页 */
  setCurrentPage: (page: number) => void;
  /** 设置每页大小 */
  setPageSize: (size: number) => void;
  /** 获取当前页 */
  getCurrentPage: () => number;
  /** 获取每页大小 */
  getPageSize: () => number;
  /** 获取总数 */
  getTotal: () => number;
  /** 获取分页信息 */
  getPageInfo: () => { current: number; pageSize: number; total: number };
  /** 设置分页信息 */
  setPageInfo: (pageInfo: {
    current?: number;
    pageSize?: number;
    total?: number;
  }) => void;
  /** 重置分页 */
  resetPagination: () => void;

  // 过滤操作
  /** 设置过滤器 */
  setFilters: (filters: FiltersProps) => void;
  /** 获取过滤器 */
  getFilters: () => FiltersProps;
  /** 重置过滤器 */
  resetFilters: () => void;
  /** 清除过滤器 */
  clearFilters: () => void;
  /** 应用过滤器 */
  applyFilters: (filters: FiltersProps) => void;

  // 排序操作
  /** 设置排序 */
  setSorter: (sorter: ExtendedSorterInfo) => void;
  /** 获取排序 */
  getSorter: () => ExtendedSorterInfo;
  /** 重置排序 */
  resetSorter: () => void;
  /** 清除排序 */
  clearSorter: () => void;

  // 查询操作
  /** 设置查询参数 */
  setQuery: (query: QueryType | ((prev: QueryType) => QueryType)) => void;
  /** 获取查询参数 */
  getQuery: () => QueryType;
  /** 重置查询参数 */
  resetQuery: () => void;
  /** 合并查询参数 */
  mergeQuery: (query: Partial<QueryType>) => void;

  // 选择操作
  /** 设置选中行 */
  setSelectedRows: (keys: (string | number)[]) => void;
  /** 获取选中行键 */
  getSelectedRowKeys: () => (string | number)[];
  /** 获取选中行数据 */
  getSelectedRows: () => RecordType[];
  /** 获取选中的数据 */
  getSelectedData: () => RecordType[];
  /** 清除选中 */
  clearSelection: () => void;
  /** 全选 */
  selectAll: () => void;
  /** 反选 */
  invertSelection: () => void;

  // 展开操作
  /** 设置展开行 */
  setExpandedRows: (keys: (string | number)[]) => void;
  /** 设置展开行键 */
  setExpandedRowKeys: (keys: (string | number)[]) => void;
  /** 获取展开行键 */
  getExpandedRowKeys: () => (string | number)[];
  /** 展开所有行 */
  expandAll: () => void;
  /** 收起所有行 */
  collapseAll: () => void;

  // 状态操作
  /** 获取加载状态 */
  getLoading: () => boolean;
  /** 设置加载状态 */
  setLoading: (loading: boolean) => void;
  /** 获取错误信息 */
  getError: () => Error | null;
  /** 重置状态 */
  reset: (options?: {
    resetData?: boolean;
    resetQuery?: boolean;
    resetFilters?: boolean;
  }) => void;

  // 滚动操作
  /** 滚动到顶部 */
  scrollToTop: () => void;
  /** 滚动到底部 */
  scrollToBottom: () => void;
  /** 滚动到指定行 */
  scrollToRow: (index: number) => void;

  // 插件操作
  /** 执行插件方法 */
  executePlugin: (
    { pluginName, methodName }: { pluginName: string; methodName: string },
    ...args: unknown[]
  ) => unknown;
  /** 渲染插件内容 */
  renderPlugin: (
    { pluginName, renderer }: { pluginName: string; renderer: string },
    ...args: unknown[]
  ) => React.ReactNode;

  // 状态访问
  /** 获取当前状态 */
  state: CustomTableState<RecordType, QueryType>;
  /** 获取辅助方法 */
  helpers: CustomTableHelpers<RecordType, QueryType>;

  // 数据快照访问
  /** 格式化后的表格数据 */
  formattedTableData: RecordType[];
  /** 加载状态 */
  loading: boolean;
  /** 当前页 */
  current: number;
  /** 每页大小 */
  pageSize: number;
  /** 总数 */
  total: number;
  /** 过滤器状态 */
  filters: Record<string, (string | number)[]>;
  /** 排序状态 */
  sorter: ExtendedSorterInfo;

  // 工具方法
  /** 验证数据 */
  validate: () => Promise<boolean>;
  /** 获取表格实例 */
  getTableInstance: () => unknown;
  /** 获取插件管理器 */
  getPluginManager: () => unknown;
  /** 导出重置日志 */
  exportResetLogs: () => void;
  /** 获取重置日志统计 */
  getResetLogStats: () => Record<string, unknown>;
}

/**
 * CustomTable 实例状态
 */
export interface CustomTableInstanceState<
  RecordType extends BaseRecord = BaseRecord,
  QueryType extends BaseQuery = BaseQuery,
> {
  /** 当前数据 */
  data: RecordType[];
  /** 当前页 */
  current: number;
  /** 每页大小 */
  pageSize: number;
  /** 总数 */
  total: number;
  /** 查询参数 */
  query: QueryType;
  /** 过滤器 */
  filters: FiltersProps;
  /** 排序 */
  sorter: ExtendedSorterInfo;
  /** 选中行键 */
  selectedRowKeys: (string | number)[];
  /** 展开行键 */
  expandedRowKeys: (string | number)[];
  /** 加载状态 */
  loading: boolean;
  /** 错误信息 */
  error: Error | null;
}

/**
 * CustomTable 实例配置
 */
export interface CustomTableInstanceConfig<
  RecordType extends BaseRecord = BaseRecord,
  QueryType extends BaseQuery = BaseQuery,
> {
  /** 默认查询参数 */
  defaultQuery?: Partial<QueryType>;
  /** 默认过滤器 */
  defaultFilters?: FiltersProps;
  /** 默认排序 */
  defaultSorter?: ExtendedSorterInfo;
  /** 是否自动加载 */
  autoLoad?: boolean;
  /** 缓存配置 */
  cache?: {
    enabled: boolean;
    key?: string;
    ttl?: number;
  };
  /** 验证配置 */
  validation?: {
    enabled: boolean;
    rules?: Record<string, ValidationRule[]>;
  };
}

/**
 * 验证规则
 */
export interface ValidationRule {
  required?: boolean;
  message?: string;
  validator?: (
    value: unknown,
    record: BaseRecord,
  ) => boolean | Promise<boolean>;
}

/**
 * 实例事件类型
 */
export interface CustomTableInstanceEvents<
  RecordType extends BaseRecord = BaseRecord,
  QueryType extends BaseQuery = BaseQuery,
> {
  /** 数据变化 */
  onDataChange?: (data: RecordType[]) => void;
  /** 查询变化 */
  onQueryChange?: (query: QueryType) => void;
  /** 过滤器变化 */
  onFiltersChange?: (filters: FiltersProps) => void;
  /** 排序变化 */
  onSorterChange?: (sorter: ExtendedSorterInfo) => void;
  /** 选择变化 */
  onSelectionChange?: (
    selectedRowKeys: (string | number)[],
    selectedRows: RecordType[],
  ) => void;
  /** 展开变化 */
  onExpandChange?: (expandedRowKeys: (string | number)[]) => void;
  /** 加载状态变化 */
  onLoadingChange?: (loading: boolean) => void;
  /** 错误发生 */
  onError?: (error: Error) => void;
}

/**
 * 实例操作结果
 */
export interface OperationResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: Error;
  message?: string;
}

/**
 * 批量操作配置
 */
export interface BatchOperationConfig {
  /** 并发数 */
  concurrency?: number;
  /** 是否在出错时停止 */
  stopOnError?: boolean;
  /** 进度回调 */
  onProgress?: (completed: number, total: number) => void;
}

/**
 * 导出配置
 */
export interface ExportConfig {
  /** 导出格式 */
  format?: 'json' | 'csv' | 'xlsx';
  /** 导出文件名 */
  filename?: string;
  /** 是否包含表头 */
  includeHeader?: boolean;
  /** 自定义列 */
  columns?: string[];
  /** 数据转换 */
  transform?: (data: BaseRecord[]) => unknown[];
}
