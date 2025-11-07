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
 * 查询同步插件相关类型定义
 *

 * @date 2025-12-19
 */

import type { BaseQuery } from '@veaiops/types';
import type React from 'react';

// Formatter types
export type QuerySearchParamsFormatter = (value: unknown) => string;
export type QueryFormatter = (params: {
  pre: unknown;
  value: unknown;
}) => unknown;

/**
 * 查询同步配置
 */
export interface QuerySyncConfig<QueryType extends BaseQuery = BaseQuery> {
  enabled?: boolean;
  debug?: boolean;
  useActiveKeyHook?: boolean;
  querySearchParamsFormat?: Record<string, QuerySearchParamsFormatter>;
  queryFormat?: Record<string, QueryFormatter>;
  authQueryPrefixOnSearchParams?: Record<string, unknown>;
  syncQueryOnSearchParams?: boolean;
  /** 初始查询参数，重置时恢复到此值 */
  initQuery?: QueryType;
  customReset?: (options: {
    resetEmptyData: boolean;
    setQuery: (query: QueryType | ((prev: QueryType) => QueryType)) => void;
    /** 初始查询参数，重置目标值 */
    initQuery?: QueryType;
    /** 需要保留的字段（与 initQuery 合并） */
    preservedFields?: Record<string, unknown>;
  }) => void;
}

/**
 * 查询同步插件配置
 */
export interface QuerySyncPluginConfig<QueryType extends BaseQuery = BaseQuery>
  extends QuerySyncConfig<QueryType> {
  syncToUrl?: boolean;
  urlSyncKey?: string;
}

/**
 * 查询同步上下文
 */
export interface QuerySyncContext<QueryType extends BaseQuery = BaseQuery> {
  query: QueryType;
  setQuery: (query: QueryType | ((prev: QueryType) => QueryType)) => void;
  searchParams: URLSearchParams;
  setSearchParams: (
    params: URLSearchParams | ((prev: URLSearchParams) => URLSearchParams),
  ) => void;
  isMounted: boolean;
  resetRef: React.MutableRefObject<boolean>;
  activeKeyChangeRef: React.MutableRefObject<Record<string, unknown>>;
  /** 是否重置时清空数据 */
  resetEmptyData?: boolean;
}

/**
 * 查询同步工具类接口
 */
export interface QuerySyncUtils<QueryType extends BaseQuery = BaseQuery> {
  config: QuerySyncConfig<QueryType>;
  context: QuerySyncContext<QueryType>;

  /**
   * 同步 URL 到查询参数
   */
  syncUrlToQuery: () => Record<string, unknown>;

  /**
   * 同步查询参数到 URL
   */
  syncQueryToUrl: (query?: Record<string, unknown>) => void;

  /**
   * 格式化查询参数（异步）
   */
  formatQuery: (
    query: Record<string, unknown>,
  ) => Promise<Record<string, unknown>>;

  /**
   * 格式化查询参数（同步）
   */
  formatQuerySync: (query: Record<string, unknown>) => Record<string, unknown>;

  /**
   * 验证查询参数
   */
  validateQuery: (query: QueryType) => boolean;

  /**
   * 重置查询参数
   * @param resetEmptyData - 是否清空数据
   * @param preservedFields - 需要保留的字段（与 initQuery 合并）
   */
  resetQuery: (
    resetEmptyData?: boolean,
    preservedFields?: Record<string, unknown>,
  ) => void;

  /**
   * 处理 activeKey 变化
   */
  handleActiveKeyChange?: () => void;
}
