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
 * 表格实例 Hook 相关类型定义
 */
import type { PaginationProps } from '@arco-design/web-react/es/Pagination/pagination';
import type { TableProps as ArcoTableProps } from '@arco-design/web-react/es/Table/interface';
import type { CustomTableActionType } from '../api/action-type';
import type { BaseQuery, BaseRecord } from '../core';

/**
 * useTableInstance Hook Props
 */
export interface UseTableInstanceProps<
  RecordType extends BaseRecord = BaseRecord,
  QueryType extends BaseQuery = BaseQuery,
> {
  // 状态相关
  /** 初始数据源 */
  initialDataSource?: RecordType[];
  /** 初始查询参数 */
  initialQuery?: QueryType;
  /** 初始页码 */
  initialCurrent?: number;
  /** 初始页面大小 */
  initialPageSize?: number;

  // 数据获取相关
  /** 数据源 */
  dataSource?: RecordType[];
  /** 手动模式 */
  manual?: boolean;
  /** 是否准备就绪 */
  ready?: boolean;
  /** 启用获取 */
  enableFetch?: boolean;
  /** 轮询间隔 */
  pollingInterval?: number;
  /** 防抖时间 */
  debounceTime?: number;
  /** 成功回调 */
  onSuccess?: (data: RecordType[], params: QueryType) => void;
  /** 错误回调 */
  onError?: (error: Error, params: QueryType) => void;
  /** 完成回调 */
  onFinally?: (params: QueryType, data?: RecordType[], error?: Error) => void;
  /** 依赖项 */
  effects?: unknown[];

  // 表格配置
  /** 查询参数 */
  query?: QueryType;
  /** 分页配置 */
  pagination?: PaginationProps | boolean;
  /** 表格配置 */
  tableProps?: Partial<Omit<ArcoTableProps<RecordType>, 'columns' | 'data'>>;
  /** 启用的功能 */
  features?: string[];

  /** 其他配置 */
  [key: string]: unknown;
}

/**
 * useTableInstance Hook 返回值
 */
export interface UseTableInstanceReturn<
  RecordType extends BaseRecord = BaseRecord,
> {
  // 表格操作 API（类似 pro-components 的 ActionType）
  tableRef: React.MutableRefObject<
    CustomTableActionType<RecordType> | undefined
  >;

  // 状态和数据
  dataSource: RecordType[];
  loading: boolean;
  error: Error | null;

  // 分页信息
  pagination: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, size?: number) => void;
  };

  // 选择信息
  rowSelection: {
    selectedRowKeys: (string | number)[];
    onSelectionChange: (keys: (string | number)[]) => void;
    clearSelection: () => void;
  };

  // 操作方法
  actions: {
    reload: (resetPageIndex?: boolean) => Promise<void>;
    reset: () => void;
    refresh: () => Promise<void>;
    loadMore: () => Promise<void>;
    search: (query: Record<string, unknown>) => void;
  };
}
