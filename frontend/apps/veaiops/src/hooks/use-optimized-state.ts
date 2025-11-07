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

import { memoryCache } from '@/utils/cache-manager';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * 优化的状态管理 Hook
 * 提供防抖、节流、缓存等功能
 */

/**
 * 防抖状态 Hook
 */
export interface UseDebouncedStateParams<T> {
  initialValue: T;
  delay?: number;
}

export function useDebouncedState<T>({
  initialValue,
  delay = 300,
}: UseDebouncedStateParams<T>) {
  const [value, setValue] = useState<T>(initialValue);
  const [debouncedValue, setDebouncedValue] = useState<T>(initialValue);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return [debouncedValue, setValue] as const;
}

/**
 * 节流状态 Hook
 */
export interface UseThrottledStateParams<T> {
  initialValue: T;
  delay?: number;
}

export function useThrottledState<T>({
  initialValue,
  delay = 300,
}: UseThrottledStateParams<T>) {
  const [value, setValue] = useState<T>(initialValue);
  const [throttledValue, setThrottledValue] = useState<T>(initialValue);
  const lastExecuted = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const updateThrottledValue = useCallback(
    (newValue: T) => {
      const now = Date.now();

      if (now - lastExecuted.current >= delay) {
        setThrottledValue(newValue);
        lastExecuted.current = now;
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(
          () => {
            setThrottledValue(newValue);
            lastExecuted.current = Date.now();
          },
          delay - (now - lastExecuted.current),
        );
      }
    },
    [delay],
  );

  useEffect(() => {
    updateThrottledValue(value);
  }, [value, updateThrottledValue]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [throttledValue, setValue] as const;
}

/**
 * 缓存状态 Hook
 * @param key 缓存键
 * @param initialValue 初始值
 * @param ttl 缓存生存时间（毫秒）
 */
export interface UseCachedStateParams<T> {
  key: string;
  initialValue: T;
  ttl?: number;
}

export function useCachedState<T>({
  key,
  initialValue,
  ttl = 5 * 60 * 1000,
}: UseCachedStateParams<T>) {
  // 尝试从缓存获取初始值
  const getCachedValue = useCallback(() => {
    const cached = memoryCache.get(key);
    return cached !== null ? cached : initialValue;
  }, [key, initialValue]);

  const [value, setValue] = useState<T>(getCachedValue);

  // 更新状态并缓存
  const setCachedValue = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const nextValue =
          typeof newValue === 'function'
            ? (newValue as (prev: T) => T)(prev)
            : newValue;

        // 缓存新值
        memoryCache.set({ key, value: nextValue, ttl });
        return nextValue;
      });
    },
    [key, ttl],
  );

  return [value, setCachedValue] as const;
}

/**
 * 异步状态 Hook
 * 提供加载状态、错误处理和重试功能
 */
export interface UseAsyncStateParams<T, E = Error> {
  asyncFunction: () => Promise<T>;
  _deps?: React.DependencyList;
}

export function useAsyncState<T, E = Error>({
  asyncFunction,
  _deps = [],
}: UseAsyncStateParams<T, E>) {
  const [state, setState] = useState<{
    data: T | null;
    loading: boolean;
    error: E | null;
  }>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const data = await asyncFunction();
      setState({ data, loading: false, error: null });
      return data;
    } catch (error: unknown) {
      setState({ data: null, loading: false, error: error as E });
      // ✅ 正确：将错误转换为 Error 对象再抛出（符合 @typescript-eslint/only-throw-error 规则）
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      throw errorObj;
    }
  }, [asyncFunction]);

  const retry = useCallback(() => {
    return execute();
  }, [execute]);

  useEffect(() => {
    execute();
  }, [execute]);

  return {
    ...state,
    execute,
    retry,
  };
}

/**
 * 优化的对象状态 Hook
 * 提供浅比较优化，避免不必要的重渲染
 */
export interface UseOptimizedObjectStateParams<T extends Record<string, any>> {
  initialValue: T;
}

export function useOptimizedObjectState<T extends Record<string, any>>({
  initialValue,
}: UseOptimizedObjectStateParams<T>) {
  const [state, setState] = useState<T>(initialValue);
  const prevStateRef = useRef<T>(initialValue);

  const setOptimizedState = useCallback(
    (newState: Partial<T> | ((prev: T) => Partial<T>)) => {
      setState((prev) => {
        const updates =
          typeof newState === 'function' ? newState(prev) : newState;
        const nextState = { ...prev, ...updates };

        // 浅比较，如果没有变化则不更新
        const hasChanged = Object.keys(updates).some(
          (key) => prev[key] !== nextState[key],
        );

        if (!hasChanged) {
          return prev;
        }

        prevStateRef.current = nextState;
        return nextState;
      });
    },
    [],
  );

  return [state, setOptimizedState] as const;
}

/**
 * 列表状态 Hook
 * 提供常用的列表操作方法
 */
interface InsertParams<T> {
  index: number;
  item: T;
}

interface UpdateParams<T> {
  index: number;
  item: T;
}

interface UpdateWhereParams<T> {
  predicate: (item: T) => boolean;
  updater: (item: T) => T;
}

interface MoveParams {
  fromIndex: number;
  toIndex: number;
}

export interface UseListStateParams<T> {
  initialValue?: T[];
}

export function useListState<T>({
  initialValue = [],
}: UseListStateParams<T> = {}) {
  const [list, setList] = useState<T[]>(initialValue);

  const actions = {
    // 添加项
    append: useCallback((item: T) => {
      setList((prev) => [...prev, item]);
    }, []),

    // 添加到开头
    prepend: useCallback((item: T) => {
      setList((prev) => [item, ...prev]);
    }, []),

    // 在指定位置插入
    insert: useCallback(({ index, item }: InsertParams<T>) => {
      setList((prev) => [...prev.slice(0, index), item, ...prev.slice(index)]);
    }, []),

    // 删除指定索引的项
    remove: useCallback((index: number) => {
      setList((prev) => prev.filter((_, i) => i !== index));
    }, []),

    // 删除符合条件的项
    removeWhere: useCallback((predicate: (item: T) => boolean) => {
      setList((prev) => prev.filter((item) => !predicate(item)));
    }, []),

    // 更新指定索引的项
    update: useCallback(({ index, item }: UpdateParams<T>) => {
      setList((prev) =>
        prev.map((prevItem, i) => (i === index ? item : prevItem)),
      );
    }, []),

    // 更新符合条件的项
    updateWhere: useCallback(({ predicate, updater }: UpdateWhereParams<T>) => {
      setList((prev) =>
        prev.map((item) => (predicate(item) ? updater(item) : item)),
      );
    }, []),

    // 清空列表
    clear: useCallback(() => {
      setList([]);
    }, []),

    // 重置为初始值
    reset: useCallback(() => {
      setList(initialValue);
    }, [initialValue]),

    // 移动项
    move: useCallback(({ fromIndex, toIndex }: MoveParams) => {
      setList((prev) => {
        const newList = [...prev];
        const [removed] = newList.splice(fromIndex, 1);
        newList.splice(toIndex, 0, removed);
        return newList;
      });
    }, []),
  };

  return [list, actions, setList] as const;
}

/**
 * 表单状态 Hook
 * 提供表单验证和错误处理
 */
export interface UseFormStateParams<T extends Record<string, any>> {
  initialValues: T;
  validators?: Partial<Record<keyof T, (value: any) => string | null>>;
}

export function useFormState<T extends Record<string, any>>({
  initialValues,
  validators,
}: UseFormStateParams<T>) {
  const [values, setValues] = useOptimizedObjectState<T>({
    initialValue: initialValues,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  interface SetValueParams {
    field: keyof T;
    value: any;
  }

  const setValue = useCallback(
    ({ field, value }: SetValueParams) => {
      setValues({ [field]: value } as Partial<T>);

      // 验证字段
      if (validators?.[field]) {
        const error = validators[field](value);
        setErrors((prev) => ({
          ...prev,
          [field]: error,
        }));
      }
    },
    [setValues, validators],
  );

  const setTouchedField = useCallback((field: keyof T) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const validateAll = useCallback(() => {
    if (!validators) {
      return true;
    }

    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    Object.keys(validators).forEach((field) => {
      const validator = validators[field as keyof T];
      if (validator) {
        const error = validator(values[field as keyof T]);
        if (error) {
          newErrors[field as keyof T] = error;
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [validators, values]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues, setValues]);

  return {
    values,
    errors,
    touched,
    setValue,
    setTouchedField,
    validateAll,
    reset,
    isValid: Object.keys(errors).length === 0,
  };
}
