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
 * CustomTable Imperative Actions 类型定义
 * 从 hooks/imperative/ 目录下各个文件迁移而来
 */

import type { SorterInfo } from '@arco-design/web-react/es/Table/interface';
import type { BaseQuery, BaseRecord } from '@veaiops/types';

// ==================== 数据操作相关 ====================

/**
 * @name 数据操作相关的实例方法
 */
export interface DataActionMethods<RecordType extends BaseRecord> {
  /** @name 重新加载数据 */
  reload: (resetPageIndex?: boolean) => Promise<void>;
  /** @name 刷新数据（重置页码并清空选择） */
  refresh: () => Promise<void>;
  /** @name 取消当前进行中的请求 */
  cancel: () => void;
  /** @name 获取当前表格数据 */
  getData: () => RecordType[];
  /** @name 获取格式化后的表格数据 */
  getFormattedData: () => RecordType[];
  /** @name 设置表格数据 */
  setData: (data: RecordType[]) => void;
  /** @name 获取筛选后的数据 */
  getFilteredData: () => RecordType[];
  /** @name 获取选中的数据 */
  getSelectedData: () => RecordType[];
}

// ==================== 筛选操作相关 ====================

/**
 * @name 筛选操作相关的实例方法
 */
export interface FilterActionMethods<QueryType extends BaseQuery> {
  /** @name 设置查询参数 */
  setQueryParams: (
    params: QueryType | ((prev: QueryType) => QueryType),
  ) => void;
  /** @name 获取当前查询参数 */
  getQueryParams: () => QueryType;
  /** @name 重置查询参数 */
  resetQueryParams: (keys?: string[]) => void;
  /** @name 设置筛选条件 */
  setFilters: (filters: Record<string, (string | number)[]>) => void;
  /** @name 获取当前筛选条件 */
  getFilters: () => Record<string, (string | number)[]>;
  /** @name 重置筛选条件 */
  resetFilters: () => void;
  /** @name 设置排序 */
  setSorter: (sorter: SorterInfo) => void;
  /** @name 获取当前排序 */
  getSorter: () => SorterInfo | undefined;
  /** @name 重置排序 */
  resetSorter: () => void;
  /** @name 提交筛选 */
  submitFilters: () => void;
  /** @name 重置所有筛选和查询 */
  resetAll: () => void;
}

// ==================== 分页操作相关 ====================

/**
 * @name 页面信息接口
 */
export interface PageInfo {
  /** @name 当前页码 */
  current: number;
  /** @name 每页条数 */
  pageSize: number;
  /** @name 总条数 */
  total: number;
}

/**
 * @name 分页操作相关的实例方法
 */
export interface PaginationActionMethods {
  /** @name 跳转到指定页 */
  goToPage: (page: number) => void;
  /** @name 跳转到第一页 */
  goToFirst: () => void;
  /** @name 跳转到最后一页 */
  goToLast: () => void;
  /** @name 上一页 */
  goToPrev: () => void;
  /** @name 下一页 */
  goToNext: () => void;
  /** @name 设置每页条数 */
  setPageSize: (size: number) => void;
  /** @name 获取当前分页信息 */
  getPageInfo: () => PageInfo;
  /** @name 重置分页 */
  resetPagination: () => void;
}

// ==================== 选择操作相关 ====================

/**
 * @name 选择操作相关的实例方法
 */
export interface SelectionActionMethods<RecordType extends BaseRecord> {
  /** @name 全选 */
  selectAll: () => void;
  /** @name 取消全选 */
  unselectAll: () => void;
  /** @name 反选 */
  invertSelection: () => void;
  /** @name 选择指定行 */
  selectRows: (keys: (string | number)[]) => void;
  /** @name 取消选择指定行 */
  unselectRows: (keys: (string | number)[]) => void;
  /** @name 获取选中的行键 */
  getSelectedRowKeys: () => (string | number)[];
  /** @name 获取选中的行数据 */
  getSelectedRows: () => RecordType[];
  /** @name 检查是否选中指定行 */
  isRowSelected: (key: string | number) => boolean;
  /** @name 获取选择状态统计 */
  getSelectionInfo: () => {
    selectedCount: number;
    totalCount: number;
    isAllSelected: boolean;
    isPartialSelected: boolean;
  };
}

// ==================== 展开操作相关 ====================

/**
 * @name 展开操作相关的实例方法
 */
export interface ExpandActionMethods {
  /** @name 展开所有行 */
  expandAll: () => void;
  /** @name 收起所有行 */
  collapseAll: () => void;
  /** @name 展开指定行 */
  expandRows: (keys: (string | number)[]) => void;
  /** @name 收起指定行 */
  collapseRows: (keys: (string | number)[]) => void;
  /** @name 获取展开的行键 */
  getExpandedRowKeys: () => (string | number)[];
  /** @name 检查指定行是否展开 */
  isRowExpanded: (key: string | number) => boolean;
}

// ==================== 工具操作相关 ====================

/**
 * @name 重置选项接口
 */
export interface ResetOptions {
  /** @name 是否重置查询参数 */
  resetQuery?: boolean;
  /** @name 是否重置筛选条件 */
  resetFilters?: boolean;
  /** @name 是否重置分页 */
  resetPagination?: boolean;
  /** @name 是否重置选择 */
  resetSelection?: boolean;
  /** @name 是否重置展开状态 */
  resetExpanded?: boolean;
  /** @name 是否重置排序 */
  resetSorter?: boolean;
}

/**
 * @name 工具操作相关的实例方法
 */
export interface UtilityActionMethods<RecordType extends BaseRecord> {
  /** @name 导出数据 */
  exportData: (format?: 'excel' | 'csv' | 'json') => RecordType[];
  /** @name 刷新表格 */
  refresh: () => Promise<void>;
  /** @name 重置表格状态 */
  reset: (options?: ResetOptions) => void;
  /** @name 获取表格当前状态 */
  getTableState: () => Record<string, unknown>;
  /** @name 设置表格状态 */
  setTableState: (state: Record<string, unknown>) => void;
  /** @name 重新加载数据 */
  reload: (resetPageIndex?: boolean) => Promise<void>;
}

// ==================== 状态操作相关 ====================

/**
 * @name 状态操作相关的实例方法
 */
export interface StateActionMethods {
  /** @name 设置加载状态 */
  setLoading: (loading: boolean) => void;
  /** @name 获取加载状态 */
  getLoading: () => boolean;
  /** @name 设置错误状态 */
  setError: (error: Error | string | null) => void;
  /** @name 获取错误状态 */
  getError: () => Error | string | null;
  /** @name 清除错误状态 */
  clearError: () => void;
  /** @name 获取表格就绪状态 */
  isReady: () => boolean;
}
