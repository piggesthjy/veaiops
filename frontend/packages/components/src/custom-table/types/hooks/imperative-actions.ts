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
 * 命令式操作 Hook 相关类型定义
 * 重新导出 api/imperative-actions.ts 中的类型以保持向后兼容
 */
import type {
  DataActionMethods,
  ExpandActionMethods,
  FilterActionMethods,
  PaginationActionMethods,
  ResetOptions,
  SelectionActionMethods,
  StateActionMethods,
  UtilityActionMethods,
} from '../api';
import type { BaseQuery, BaseRecord } from '../core';

// 重新导出 API 类型以保持向后兼容
export type {
  DataActionMethods,
  FilterActionMethods,
  PaginationActionMethods,
  SelectionActionMethods,
  ExpandActionMethods,
  UtilityActionMethods,
  StateActionMethods,
  ResetOptions,
} from '../api/imperative-actions';

/**
 * ResetOptions 已在 api/imperative-actions.ts 中定义，此处移除避免重复
 * 如需使用，请从 '@/custom-table/types/api' 或 '@/custom-table/types' 导入
 */

/**
 * 命令式操作上下文
 */
export interface ImperativeActionContext<
  RecordType extends BaseRecord = BaseRecord,
> {
  /** 数据操作方法 */
  data: DataActionMethods<RecordType>;
  /** 筛选操作方法 */
  filter: FilterActionMethods<BaseQuery>;
  /** 分页操作方法 */
  pagination: PaginationActionMethods;
  /** 选择操作方法 */
  selection: SelectionActionMethods<RecordType>;
  /** 展开操作方法 */
  expand: ExpandActionMethods;
  /** 工具类操作方法 */
  utility: UtilityActionMethods<RecordType>;
  /** 状态操作方法 */
  state: StateActionMethods;
  /** 重置操作 */
  reset: (options?: ResetOptions) => void;
}

/**
 * useImperativeActions Hook Props
 */
export interface UseImperativeActionsProps<
  RecordType extends BaseRecord = BaseRecord,
> {
  /** 表格引用 */
  tableRef?: React.RefObject<ImperativeActionContext<RecordType>>;
  /** 数据刷新函数 */
  onRefresh?: () => Promise<void>;
  /** 查询变更回调 */
  onQueryChange?: (query: BaseQuery) => void;
  /** 选择变更回调 */
  onSelectionChange?: (
    selectedKeys: React.Key[],
    selectedRows: RecordType[],
  ) => void;
  /** 展开变更回调 */
  onExpandChange?: (expandedKeys: React.Key[]) => void;
}

/**
 * useImperativeActions Hook 返回值
 */
export interface UseImperativeActionsReturn<
  RecordType extends BaseRecord = BaseRecord,
> {
  /** 命令式操作上下文 */
  actions: ImperativeActionContext<RecordType>;
  /** 是否正在执行操作 */
  isActionPending: boolean;
  /** 最后执行的操作 */
  lastAction: string | null;
  /** 操作历史记录 */
  actionHistory: Array<{
    action: string;
    timestamp: number;
    params?: unknown;
  }>;
}
