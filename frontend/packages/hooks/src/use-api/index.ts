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

import { useCallback, useEffect, useState } from 'react';

/**
 * API调用选项
 */
export interface UseApiOptions {
  /** 是否立即执行 */
  immediate?: boolean;
  /** 依赖项 */
  deps?: any[];
  /** 错误处理函数 */
  onError?: (error: Error) => void;
  /** 成功回调 */
  onSuccess?: (data: any) => void;
  /** 缓存键 */
  cacheKey?: string;
  /** 缓存时间(毫秒) */
  cacheTime?: number;
}

/**
 * API调用状态
 */
export interface UseApiResult<T> {
  /** 数据 */
  data: T | null;
  /** 加载状态 */
  loading: boolean;
  /** 错误信息 */
  error: Error | null;
  /** 执行API调用 */
  execute: (...args: any[]) => Promise<T>;
  /** 重置状态 */
  reset: () => void;
  /** 刷新数据 */
  refresh: () => Promise<T>;
}

// 简单的内存缓存
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

/**
 * 通用API调用Hook的参数接口
 */
export interface UseApiParams<T, P extends any[] = any[]> {
  apiCall: (...params: P) => Promise<T>;
  options?: UseApiOptions;
}

/**
 * 通用API调用Hook
 * @description 提供统一的API调用、错误处理、加载状态管理


 */
export const useApi = <T, P extends any[] = any[]>({
  apiCall,
  options = {},
}: UseApiParams<T, P>): UseApiResult<T> => {
  const {
    immediate = false,
    deps = [],
    onError,
    onSuccess,
    cacheKey,
    cacheTime = 5 * 60 * 1000, // 默认5分钟缓存
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastParams, setLastParams] = useState<P | null>(null);

  interface GetCachedDataParams {
    key: string;
  }

  // 检查缓存
  const getCachedData = useCallback(
    ({ key }: GetCachedDataParams): T | null => {
      if (!cacheKey) {
        return null;
      }

      const cached = cache.get(key);
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        return cached.data;
      }

      // 清理过期缓存
      if (cached) {
        cache.delete(key);
      }

      return null;
    },
    [cacheKey],
  );

  interface SetCachedDataParams {
    key: string;
    data: T;
  }

  // 设置缓存
  const setCachedData = useCallback(
    ({ key, data }: SetCachedDataParams) => {
      if (!cacheKey) {
        return;
      }

      cache.set(key, {
        data,
        timestamp: Date.now(),
        ttl: cacheTime,
      });
    },
    [cacheKey, cacheTime],
  );

  // 执行API调用
  const execute = useCallback(
    async (...params: P): Promise<T> => {
      try {
        setLoading(true);
        setError(null);
        setLastParams(params);

        // 检查缓存
        if (cacheKey) {
          const cachedData = getCachedData({ key: cacheKey });
          if (cachedData) {
            setData(cachedData);
            setLoading(false);
            return cachedData;
          }
        }

        const result = await apiCall(...params);

        setData(result);

        // 设置缓存
        if (cacheKey) {
          setCachedData({ key: cacheKey, data: result });
        }

        // 成功回调
        if (onSuccess) {
          onSuccess(result);
        }

        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);

        // 错误处理
        if (onError) {
          onError(error);
        } else {
          // 默认错误处理可以在这里添加
        }

        throw error;
      } finally {
        setLoading(false);
      }
    },
    [apiCall, onError, onSuccess, cacheKey, getCachedData, setCachedData],
  );

  // 重置状态
  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
    setLastParams(null);

    // 清理缓存
    if (cacheKey) {
      cache.delete(cacheKey);
    }
  }, [cacheKey]);

  // 刷新数据
  const refresh = useCallback(async (): Promise<T> => {
    if (!lastParams) {
      throw new Error('没有可刷新的请求参数');
    }

    // 清理缓存后重新请求
    if (cacheKey) {
      cache.delete(cacheKey);
    }

    return execute(...lastParams);
  }, [execute, lastParams, cacheKey]);

  // 立即执行
  useEffect(() => {
    if (immediate) {
      execute(...([] as unknown as P));
    }
  }, [immediate, ...deps]);

  return {
    data,
    loading,
    error,
    execute: execute as (...args: any[]) => Promise<T>,
    reset,
    refresh,
  };
};

/**
 * 批量API调用Hook的参数接口
 */
export interface UseBatchApiParams<T> {
  apiCalls: Array<() => Promise<T>>;
  options?: UseApiOptions;
}

/**
 * 批量API调用Hook
 */
export const useBatchApi = <T>({
  apiCalls,
  options = {},
}: UseBatchApiParams<T>) => {
  const [results, setResults] = useState<(T | null)[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<(Error | null)[]>([]);

  const execute = useCallback(async () => {
    setLoading(true);
    setErrors(new Array(apiCalls.length).fill(null));

    try {
      const promises = apiCalls.map(async (apiCall, index) => {
        try {
          return await apiCall();
        } catch (error) {
          setErrors((prev) => {
            const newErrors = [...prev];
            newErrors[index] =
              error instanceof Error ? error : new Error(String(error));
            return newErrors;
          });
          return null;
        }
      });

      const results = await Promise.all(promises);
      setResults(results);

      return results;
    } finally {
      setLoading(false);
    }
  }, [apiCalls]);

  useEffect(() => {
    if (options.immediate) {
      execute();
    }
  }, [options.immediate, execute]);

  return {
    results,
    loading,
    errors,
    execute,
  };
};

export default useApi;
