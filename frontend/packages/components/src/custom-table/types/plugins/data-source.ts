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
 * 数据源插件类型定义
 */

import type { BaseQuery, BaseRecord } from '@veaiops/types';
import type { PluginBaseConfig } from './core';

/**
 * 数据源配置
 */
export interface DataSourceConfig extends PluginBaseConfig {
  /** API 端点 */
  apiUrl?: string;
  /** 请求方法 */
  method?: 'GET' | 'POST';
  /** 请求头 */
  headers?: Record<string, string>;
  /** 请求参数转换 */
  transformRequest?: <TRequest = Record<string, unknown>>(
    query: BaseQuery,
  ) => TRequest;
  /** 响应数据转换 */
  transformResponse?: <TResponse = unknown>(
    response: TResponse,
  ) => { data: BaseRecord[]; total: number };
  /** 缓存配置 */
  cache?: {
    enabled: boolean;
    ttl: number; // 毫秒
    key?: string;
  };
  /** 默认分页大小 */
  defaultPageSize?: number;
  /** 默认当前页 */
  defaultCurrent?: number;
  /** 是否自动重置 */
  autoReset?: boolean;
  /** 是否启用客户端排序 */
  enableClientSorting?: boolean;
  /** 是否启用客户端筛选 */
  enableClientFiltering?: boolean;
}

/**
 * 数据源状态
 */
export interface DataSourceState {
  /** 原始数据 */
  rawData: BaseRecord[];
  /** 过滤后的数据 */
  filteredData: BaseRecord[];
  /** 加载状态 */
  loading: boolean;
  /** 错误信息 */
  error: Error | null;
  /** 总条数 */
  total: number;
  /** 最后更新时间 */
  lastUpdated: number;
}

/**
 * 数据源方法
 */
export interface DataSourceMethods {
  /** 加载数据 */
  loadData: (query?: BaseQuery) => Promise<void>;
  /** 刷新数据 */
  refreshData: () => Promise<void>;
  /** 清空数据 */
  clearData: () => void;
  /** 设置数据 */
  setData: (data: BaseRecord[]) => void;
  /** 更新单条数据 */
  updateRecord: (record: BaseRecord) => void;
  /** 删除单条数据 */
  deleteRecord: (id: string | number) => void;
}
