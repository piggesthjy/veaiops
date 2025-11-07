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
 * 分页和排序 Hook 相关类型定义
 * 基于 Arco Design 类型标准优化
 */
import type {
  RowSelectionProps,
  SorterInfo,
} from '@arco-design/web-react/es/Table/interface';
import type { ReactNode } from 'react';

/**
 * usePagination Hook Props
 */
export interface UsePaginationProps<
  ConfigType extends Record<string, unknown> = Record<string, unknown>,
> {
  total?: number;
  current?: number;
  pageSize?: number;
  defaultCurrent?: number;
  defaultPageSize?: number;
  onChange?: (current: number, pageSize: number) => void;
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
  showTotal?:
    | boolean
    | ((total: number, range: [number, number]) => React.ReactNode);
  pageSizeOptions?: string[];
  size?: 'mini' | 'small' | 'default' | 'large';
  disabled?: boolean;
  hideOnSinglePage?: boolean;
  simple?: boolean;
  isPaginationInCache?: boolean;
  config?: ConfigType;
}

/**
 * useSorting Hook Props
 */
export interface UseSortingProps<
  SortFieldMapType extends Record<string, string> = Record<string, string>,
  ConfigType extends Record<string, unknown> = Record<string, unknown>,
> {
  initialSorter?: SorterInfo | SorterInfo[];
  onChange?: (sorter: SorterInfo | SorterInfo[]) => void;
  sortDirections?: ('ascend' | 'descend')[];
  showSorterTooltip?: boolean;
  multiple?: boolean;
  sortFieldMap?: SortFieldMapType;
  config?: ConfigType;
}

/**
 * 分页信息
 */
export interface PaginationPageInfo {
  current: number;
  pageSize: number;
  total: number;
}

/**
 * 排序信息
 */
export interface SortInfo {
  field?: string;
  direction?: 'ascend' | 'descend';
}

/**
 * 基于 Arco Design 的筛选器配置
 */
export interface FilterItem<ValueType = unknown> {
  text?: ReactNode;
  value?: ValueType;
  [key: string]: unknown;
}

/**
 * Hooks 筛选器配置（重命名避免与 components/props.ts 中的 FilterConfig 冲突）
 */
export interface HooksFilterConfig<RecordType = Record<string, unknown>> {
  filters?: FilterItem[];
  defaultFilters?: string[];
  filteredValue?: string[];
  onFilter?: (value: unknown, record: RecordType) => boolean;
}

/**
 * 基于 Arco Design 的行选择配置
 */
export interface TableRowSelectionConfig<RecordType = Record<string, unknown>>
  extends RowSelectionProps<RecordType> {
  enableCrossPage?: boolean;
  enableSelectAll?: boolean;
  enableCheckStrictly?: boolean;
}

/**
 * usePagination Hook 返回值
 */
export interface UsePaginationResult {
  current: number;
  pageSize: number;
  total: number;
  onChange: (current: number, pageSize: number) => void;
  showSizeChanger: boolean;
  showQuickJumper: boolean;
  showTotal:
    | boolean
    | ((total: number, range: [number, number]) => React.ReactNode);
  pageSizeOptions: string[];
  size: 'mini' | 'small' | 'default' | 'large';
  disabled: boolean;
  hideOnSinglePage: boolean;
  simple: boolean;
}

/**
 * useSorting Hook 返回值
 */
export interface UseSortingResult {
  sorter: SorterInfo | SorterInfo[];
  onSorterChange: (sorter: SorterInfo | SorterInfo[]) => void;
  sortDirections: ('ascend' | 'descend')[];
  showSorterTooltip: boolean;
  multiple: boolean;
}
