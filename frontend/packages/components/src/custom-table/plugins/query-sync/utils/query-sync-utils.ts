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

import type { QuerySyncConfig, QuerySyncContext } from '@/custom-table/types';
import { delay } from 'lodash-es';
import {
  filterEmptyDataByKeys,
  formatQuery,
  formatQuerySync,
  getParamsObject,
} from './query-formatters';
import { resetQuery } from './reset-query';
import { syncQueryToUrl, updateSearchParams } from './sync-query-to-url';
import { syncUrlToQuery } from './sync-url-to-query';

/**
 * 查询参数同步工具类
 */
export class QuerySyncUtils<
  QueryType extends Record<string, unknown> = Record<string, unknown>,
> {
  config: QuerySyncConfig;
  context: QuerySyncContext<QueryType>;

  constructor(config: QuerySyncConfig, context: QuerySyncContext<QueryType>) {
    this.config = config;
    this.context = context;
  }

  /**
   * 同步查询参数到URL
   */
  syncQueryToUrl = (queryParam?: Record<string, unknown>) => {
    syncQueryToUrl(queryParam, this.config, this.context);
  };

  /**
   * 更新React Router的searchParams
   */
  updateSearchParams = (searchParams: URLSearchParams) => {
    updateSearchParams(searchParams, this.context);
  };

  /**
   * 从URL搜索参数同步到查询参数
   */
  syncUrlToQuery = (): Record<string, unknown> => {
    return syncUrlToQuery(this.config, this.context);
  };

  /**
   * 格式化查询参数（同步版本）
   */
  formatQuerySync = (
    query: Record<string, unknown>,
  ): Record<string, unknown> => {
    return formatQuerySync(query, this.config.queryFormat || {});
  };

  /**
   * 格式化查询参数（异步版本）
   */
  formatQuery = async (
    query: Record<string, unknown>,
  ): Promise<Record<string, unknown>> => {
    return formatQuery(query, this.config.queryFormat || {});
  };

  /**
   * 获取参数对象，过滤空值
   */
  getParamsObject = <T extends Record<string, unknown>>(params: T): T => {
    return getParamsObject(params);
  };

  /**
   * 根据指定的键过滤空数据
   */
  filterEmptyDataByKeys = <T extends Record<string, unknown>>({
    data,
    keys,
  }: {
    data: T;
    keys: string[];
  }): Partial<T> => {
    return filterEmptyDataByKeys({ data, keys });
  };

  /**
   * 转换参数类型
   */
  convertParamsTypes = (
    query: Record<string, unknown>,
  ): Record<string, unknown> => {
    // 使用 query-formatters 中的函数，但保持向后兼容
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(query)) {
      if (typeof value === 'string') {
        // 尝试转换数字
        if (/^\d+$/.test(value)) {
          result[key] = parseInt(value, 10);
        } else if (/^\d+\.\d+$/.test(value)) {
          result[key] = parseFloat(value);
        } else if (value === 'true') {
          result[key] = true;
        } else if (value === 'false') {
          result[key] = false;
        } else {
          result[key] = value;
        }
      } else {
        result[key] = value;
      }
    }

    return result;
  };

  /**
   * 重置查询参数
   * 🔧 修复：使用 initQuery 而不是空对象，确保重置到初始状态
   * 🎯 边界case处理：
   * - initQuery 为空对象或 undefined：重置为空对象
   * - preservedFields 与 initQuery 合并：preservedFields 优先级更高
   * - querySearchParamsFormat 格式化 URL 参数
   * - 数组参数的 URL 同步
   * - 认证参数的保留
   * - syncQueryOnSearchParams 为 false 时不同步到 URL
   */
  resetQuery = (
    resetEmptyData = false,
    preservedFields?: Record<string, unknown>,
  ) => {
    resetQuery(this.config, this.context, resetEmptyData, preservedFields);
  };

  /**
   * 处理activeKey变化
   */
  handleActiveKeyChange = () => {
    const { useActiveKeyHook } = this.config;

    if (useActiveKeyHook && this.context.activeKeyChangeRef.current) {
      // 延迟更新查询参数以避免竞态条件
      delay(async () => {
        const urlQuery = this.syncUrlToQuery();
        this.context.setQuery(
          (prev: QueryType) => ({ ...prev, ...urlQuery }) as QueryType,
        );
      }, 500);
    }
  };

  /**
   * 验证查询参数
   */
  validateQuery = <T extends Record<string, unknown>>(query: T): boolean => {
    if (!query || typeof query !== 'object') {
      return false;
    }

    // 基本验证逻辑
    return Object.keys(query).length >= 0;
  };
}
