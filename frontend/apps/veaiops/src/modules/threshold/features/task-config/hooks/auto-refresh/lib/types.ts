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
 * 自动刷新操作相关类型定义
 */

/**
 * 通用的自动刷新CRUD操作类型
 */
export interface AutoRefreshOperations {
  delete: (id: string) => Promise<boolean>;
  update: () => Promise<{ success: boolean; error?: Error }>;
  create?: (data: any) => Promise<{ success: boolean; error?: Error }>;
}

/**
 * 自定义操作包装器参数接口
 */
export interface CreateOperationWrapperParams<TArgs extends any[], TResult> {
  operation: (...args: TArgs) => Promise<TResult>;
  refreshFn: () => Promise<boolean> | Promise<{ success: boolean; error?: Error }>;
  successCondition?: (result: TResult) => boolean;
}

/**
 * 自动刷新操作Hook参数接口
 */
export interface UseAutoRefreshOperationsParams {
  refreshFn: () => Promise<boolean> | Promise<{ success: boolean; error?: Error }>;
  deleteApi?: (id: string) => Promise<boolean>;
  updateApi?: () => Promise<boolean> | Promise<{ success: boolean; error?: Error }>;
  createApi?: (data: any) => Promise<boolean> | Promise<{ success: boolean; error?: Error }>;
}
