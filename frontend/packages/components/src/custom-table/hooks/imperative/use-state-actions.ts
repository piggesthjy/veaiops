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
 * CustomTable 状态操作 Hook
 * 负责处理加载状态、错误状态等管理操作
 *

 * @date 2025-12-19
 */
import type {
  BaseQuery,
  BaseRecord,
  PluginContext,
} from '@/custom-table/types';

/**
 * @name 状态操作相关的实例方法
 */
export interface StateActionMethods {
  /** @name 设置加载状态 */
  setLoading: (newLoading: boolean) => void;
  /** @name 设置错误状态 */
  setError: (error: Error | null) => void;
  /** @name 获取完整状态 */
  getState: () => Record<string, unknown>;
  /** @name 获取加载状态 */
  getLoading: () => boolean;
  /** @name 获取错误状态 */
  getError: () => Error | null;
}

/**
 * @name 创建状态操作方法
 * @description 基于 pro-components 状态管理设计模式
 */
export const createStateActions = <
  RecordType extends BaseRecord = BaseRecord,
  QueryType extends BaseQuery = BaseQuery,
>(
  context: PluginContext<RecordType, QueryType>,
): StateActionMethods => ({
  /** @name 设置加载状态 */
  setLoading: (newLoading: boolean) => {
    // 通过上下文的 helpers 设置加载状态
    context.helpers.setLoading(newLoading);
  },

  /** @name 设置错误状态 */
  setError: (error: Error | null) => {
    // 通过上下文的 helpers 设置错误状态
    context.helpers.setError(error);
  },

  /** @name 获取完整状态 */
  getState: () => context.state as unknown as Record<string, unknown>,

  /** @name 获取加载状态 */
  getLoading: () => context.state.loading,

  /** @name 获取错误状态 */
  getError: () => context.state.error || null,
});
