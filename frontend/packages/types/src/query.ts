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
 * 查询参数相关类型定义
 * 用于统一所有 API 查询和筛选场景
 */

/**
 * 筛选值类型
 * 支持常见的筛选值类型
 */
export type FilterValue =
  | string
  | number
  | boolean
  | string[]
  | number[]
  | undefined
  | null;

/**
 * 筛选参数
 * 使用索引签名支持动态字段
 */
export interface FilterParams {
  [key: string]: FilterValue;
}

/**
 * 完整的查询参数
 */
export type QueryParams = FilterParams;

/**
 * 表格查询参数
 * 包含页面请求和其他参数
 */
export interface TableQueryParams {
  /** 分页请求 */
  page_req?: {
    skip: number;
    limit: number;
  };
  /** 其他筛选参数 */
  [key: string]: FilterValue | { skip: number; limit: number } | undefined;
}
