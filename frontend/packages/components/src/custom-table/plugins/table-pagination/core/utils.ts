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
 * 表格分页插件工具函数
 */

/**
 * getStateNumber 参数接口
 */
export interface GetStateNumberParams {
  value: unknown;
  defaultValue: number;
}

/**
 * 类型守卫：确保 state 属性存在且为 number 类型
 */
export function getStateNumber({
  value,
  defaultValue,
}: GetStateNumberParams): number {
  return typeof value === 'number' ? value : defaultValue;
}

/**
 * 类型守卫：确保 helper 方法存在且可调用
 */
export function isCallableFunction(
  value: unknown,
): value is (...args: unknown[]) => unknown {
  return typeof value === 'function';
}
