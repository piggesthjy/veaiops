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
 * Props 稳定化工具集
 *
 * 🎯 目的：防止 props 对象/函数引用变化导致的无限循环
 *
 * 使用场景：
 * - handleColumns/handleFilters 等函数 props
 * - tableActions 等对象 props
 * - 任何可能频繁变化但内容相同的 props
 */

import { isEqual } from 'lodash-es';
import { useRef } from 'react';

/**
 * 稳定化回调函数
 *
 * 通过 useRef 保持函数引用稳定，同时始终调用最新的函数实现
 *
 * @param callback - 回调函数
 * @returns 稳定的函数引用
 *
 * @example
 * ```typescript
 * const stableOnEdit = useStableCallback(onEdit);
 * // stableOnEdit 的引用永远不变，但内部调用的是最新的 onEdit
 * ```
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T | undefined,
): T | undefined {
  const callbackRef = useRef(callback);

  // 始终保持最新的函数引用
  callbackRef.current = callback;

  // 返回稳定的包装函数
  const stableCallbackRef = useRef<T>();

  if (!stableCallbackRef.current && callback) {
    stableCallbackRef.current = ((...args: any[]) => {
      return callbackRef.current?.(...args);
    }) as T;
  }

  return callback ? stableCallbackRef.current : undefined;
}

/**
 * 稳定化对象
 *
 * 使用深度对比（isEqual），只在内容真正变化时才返回新引用
 *
 * @param obj - 对象
 * @returns 稳定的对象引用
 *
 * @example
 * ```typescript
 * const stableActions = useStableObject({ onEdit, onDelete, onCreate });
 * // 只有当对象内容真正变化时，stableActions 的引用才会改变
 * ```
 */
export function useStableObject<T extends Record<string, any>>(
  obj: T | undefined,
): T | undefined {
  const ref = useRef(obj);

  // 深度对比：只在内容真正变化时更新
  if (!isEqual(ref.current, obj)) {
    ref.current = obj;
  }

  return ref.current;
}

/**
 * 稳定化处理函数（高阶函数）
 *
 * 特殊处理：handleColumns/handleFilters 等返回函数的函数
 *
 * @param handler - 处理函数
 * @returns 稳定的处理函数
 *
 * @example
 * ```typescript
 * const stableHandleColumns = useStableHandler(handleColumns);
 * // stableHandleColumns 的引用永远不变
 * ```
 */
export function useStableHandler<T extends (...args: any[]) => any>(
  handler: T | undefined,
): T | undefined {
  const handlerRef = useRef(handler);

  // 始终保持最新的函数引用
  handlerRef.current = handler;

  // 返回稳定的包装函数
  const stableHandlerRef = useRef<T>();

  if (!stableHandlerRef.current && handler) {
    stableHandlerRef.current = ((...args: any[]) => {
      return handlerRef.current?.(...args);
    }) as T;
  }

  return handler ? stableHandlerRef.current : undefined;
}

/**
 * 批量稳定化 Props（简化版本）
 *
 * 使用深度对比稳定化整个对象
 *
 * @param props - Props对象
 * @returns 稳定的Props对象
 *
 * @example
 * ```typescript
 * const stableProps = useStableProps({
 *   onEdit,
 *   onDelete,
 *   onCreate,
 * });
 * ```
 */
export function useStableProps<T extends Record<string, any>>(props: T): T {
  return useStableObject(props) as T;
}
