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

/**
 * 执行原生URL更新的参数接口
 */
export interface PerformNativeUrlUpdateParams {
  newUrl: string;
  expectedSearch: string;
  _beforeUpdate: string;
}

/**
 * 根据指定的键过滤空数据的参数接口
 */
export interface FilterEmptyDataByKeysParams<
  T extends Record<string, unknown>,
> {
  data: T;
  keys: string[];
}

/**
 * 创建查询参数同步工具实例的参数接口
 */
export interface CreateQuerySyncUtilsParams<
  QueryType extends Record<string, unknown> = Record<string, unknown>,
> {
  config: QuerySyncConfig;
  context: QuerySyncContext<QueryType>;
}
