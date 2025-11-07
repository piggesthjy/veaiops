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
 * 表格数据获取 Hook 相关类型定义
 */
import type { BaseQuery, BaseRecord } from '../core';

/**
 * 表格数据获取配置
 */
export interface TableFetchOptions<
  RecordType extends BaseRecord = BaseRecord,
  QueryType extends BaseQuery = BaseQuery,
> {
  /** 请求服务 */
  service?: (...args: unknown[]) => Promise<unknown>;
  /** 查询参数 */
  params?: QueryType;
  /** 请求配置 */
  options?: {
    manual?: boolean;
    ready?: boolean;
    refreshDeps?: unknown[];
    pollingInterval?: number;
    debounceWait?: number;
    throttleWait?: number;
    loadingDelay?: number;
    retryCount?: number;
    retryInterval?: number;
    cacheKey?: string;
    cacheTime?: number;
    staleTime?: number;
    formatResult?: <TResult = unknown>(data: TResult) => RecordType[];
    onBefore?: (params: QueryType) => void;
    onSuccess?: (data: RecordType[], params: QueryType) => void;
    onError?: (error: Error, params: QueryType) => void;
    onFinally?: (params: QueryType, data?: RecordType[], error?: Error) => void;
  };
  /** 是否启用分页 */
  pagination?: boolean;
  /** 数据格式化 */
  formatResult?: <TResponse = unknown>(
    response: TResponse,
  ) => { data: RecordType[]; total: number };
}

/**
 * 表格数据获取操作
 */
export interface TableFetchActions {
  // 请求控制
  run: (...args: unknown[]) => Promise<unknown>;
  runAsync: (...args: unknown[]) => Promise<unknown>;
  refresh: () => void;
  cancel: () => void;
  mutate: <TData = unknown>(data: TData) => void;

  // 分页控制
  reload: (resetCurrent?: boolean) => void;
  loadMore: () => void;

  // 缓存控制
  clearCache: () => void;
  refreshCache: () => void;

  // 轮询控制
  startPolling: () => void;
  stopPolling: () => void;
}

/**
 * 数据源配置
 */
export interface DataSourceConfig {
  /** 服务实例 */
  serviceInstance?: Record<string, unknown>;
  /** 服务方法名 */
  serviceMethod?: string;
  /** 请求函数 */
  request?: (...args: unknown[]) => Promise<unknown>;
  /** 响应数据格式化 */
  formatPayload?: <TData = unknown, TResult = unknown>(data: TData) => TResult;
}

/**
 * useTableFetch Hook Props
 */
export interface UseTableFetchProps<
  RecordType extends BaseRecord = BaseRecord,
  QueryType extends BaseQuery = BaseQuery,
> extends TableFetchOptions<RecordType, QueryType> {
  /** 静态数据源 */
  dataSource?: RecordType[] | DataSourceConfig;
  /** 手动触发 */
  manual?: boolean;
  /** 是否准备就绪 */
  ready?: boolean;
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
  /** 表格状态 */
  tableState?: Record<string, unknown>;
}

/**
 * useTableFetch Hook 返回值
 */
export interface UseTableFetchReturn<TData = unknown, TParams = unknown> {
  actions: TableFetchActions;
  loading: boolean;
  error: Error | null;
  data: TData;
  params: TParams;
}
