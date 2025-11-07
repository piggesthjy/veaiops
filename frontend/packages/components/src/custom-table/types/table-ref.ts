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
 * 通用表格引用接口
 * 提供开箱即用的 ref 类型，消除业务侧重复定义
 */

import type { BaseQuery, BaseRecord } from '@veaiops/types';
import type { CustomTableHelpers } from './plugins/core';

/**
 * 基础表格 Ref 接口
 * 包含最常用的表格操作方法
 */
export interface BaseTableRef {
  /** 刷新表格数据 */
  refresh: () => Promise<void>;
  /** 重新加载数据 */
  reload?: () => Promise<void>;
}

/**
 * 增强表格 Ref 接口
 * 包含完整的表格操作方法
 */
export interface EnhancedTableRef<
  RecordType extends BaseRecord = BaseRecord,
  QueryType extends BaseQuery = BaseQuery,
> extends BaseTableRef {
  /** 获取表格数据 */
  getData: () => RecordType[];
  /** 设置表格查询参数 */
  setQuery: (query: QueryType | ((prev: QueryType) => QueryType)) => void;
  /** 获取当前查询参数 */
  getQuery: () => QueryType;
  /** 获取表格辅助方法 */
  helpers?: CustomTableHelpers<RecordType, QueryType>;
}

/**
 * 自动类型推导函数
 * 根据需要的功能返回不同的 ref 类型
 * 注意：这是一个类型辅助函数，实际使用时应使用 useRef<EnhancedTableRef>()
 */
export function createTableRef(): EnhancedTableRef<BaseRecord, BaseQuery> {
  // 这是一个类型辅助函数，实际使用时应使用 useRef<EnhancedTableRef>()
  throw new Error(
    'createTableRef is a type helper only. Use useRef<EnhancedTableRef>() instead.',
  );
}

/**
 * 完整表格 Ref 接口
 * 包含所有可能的表格操作方法
 */
export interface FullTableRef<
  RecordType extends BaseRecord = BaseRecord,
  QueryType extends BaseQuery = BaseQuery,
> extends BaseTableRef {
  // 数据操作
  reload: () => Promise<void>;
  getData: () => RecordType[];
  setData: (data: RecordType[]) => void;

  // 查询操作
  setQuery: (query: QueryType | ((prev: QueryType) => QueryType)) => void;
  getQuery: () => QueryType;

  // 刷新操作（新增业务语义化方法）
  afterCreate?: () => Promise<void>;
  afterUpdate?: () => Promise<void>;
  afterDelete?: () => Promise<void>;
  afterImport?: () => Promise<void>;
  afterBatchOperation?: () => Promise<void>;

  // 辅助方法
  helpers?: CustomTableHelpers<RecordType, QueryType>;
}

/**
 * 最常用的表格 Ref 类型
 * 提供基础的刷新功能
 */
export type TableRef = BaseTableRef;
