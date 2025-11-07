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
 * 检查对象是否为空
 */
function isEmpty(obj: any): boolean {
  if (obj == null) {
    return true;
  }
  if (Array.isArray(obj)) {
    return obj.length === 0;
  }
  if (typeof obj === 'object') {
    return Object.keys(obj).length === 0;
  }
  return false;
}

interface OmitParams<T extends Record<string, any>, K extends keyof T> {
  obj: T;
  keys: K[];
}

/**
 * 从对象中省略指定的键（内部辅助函数）
 */
function omit<T extends Record<string, any>, K extends keyof T>({
  obj,
  keys,
}: OmitParams<T, K>): Omit<T, K> {
  const result = { ...obj };
  keys.forEach((key) => {
    delete result[key];
  });
  return result as Omit<T, K>;
}

/**
 * 获取参数对象，过滤空值
 * @param params 原始参数对象
 * @returns 过滤后的参数对象
 */
export function getParamsObject<T extends Record<string, any>>(
  params: T,
): Partial<T> {
  const result: Partial<T> = {};

  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== '') {
      // 对于数组，只保留非空数组
      if (Array.isArray(value)) {
        if (value.length > 0) {
          (result as any)[key] = value;
        }
      } else {
        (result as any)[key] = value;
      }
    }
  }

  return result;
}

/**
 * 根据指定的键过滤空数据的参数接口
 */
export interface FilterEmptyDataByKeysParams<T extends Record<string, any>> {
  data: T;
  keys: (keyof T)[];
}

/**
 * 根据指定的键过滤空数据
 * @param params 包含 data 和 keys 的参数对象
 * @returns 过滤后的数据对象
 */
export function filterEmptyDataByKeys<T extends Record<string, any>>({
  data,
  keys,
}: FilterEmptyDataByKeysParams<T>): Partial<T> {
  const result: Partial<T> = { ...data };

  keys.forEach((key) => {
    const value = data[key];
    if (
      value === null ||
      value === undefined ||
      value === '' ||
      (Array.isArray(value) && value.length === 0) ||
      (typeof value === 'object' && !Array.isArray(value) && isEmpty(value))
    ) {
      delete result[key];
    }
  });

  return result;
}

/**
 * 从对象中省略指定的键的参数接口
 */
export interface OmitKeysFromObjectParams<
  T extends Record<string, any>,
  K extends keyof T,
> {
  obj: T;
  keys: K[];
}

/**
 * 从对象中省略指定的键
 * @param params 包含 obj 和 keys 的参数对象
 * @returns 省略指定键后的新对象
 */
export function omitKeysFromObject<
  T extends Record<string, any>,
  K extends keyof T,
>({ obj, keys }: OmitKeysFromObjectParams<T, K>): Omit<T, K> {
  return omit({ obj, keys });
}

/**
 * 转换参数类型的参数接口
 */
export interface ConvertParamsTypesParams<T extends Record<string, any>> {
  params: T;
  typeMap?: Record<keyof T, 'string' | 'number' | 'boolean' | 'array'>;
}

/**
 * 转换参数类型
 * @param paramObj 包含 params 和 typeMap 的参数对象
 * @returns 转换后的参数对象
 */
export function convertParamsTypes<T extends Record<string, any>>({
  params,
  typeMap,
}: ConvertParamsTypesParams<T>): T {
  if (!typeMap) {
    return params;
  }

  const result = { ...params } as any;

  Object.entries(typeMap).forEach(([key, targetType]) => {
    const value = result[key];

    if (value === null || value === undefined) {
      return;
    }

    switch (targetType) {
      case 'string': {
        result[key] = String(value);
        break;
      }
      case 'number': {
        const numValue = Number(value);
        if (!Number.isNaN(numValue)) {
          result[key] = numValue;
        }
        break;
      }
      case 'boolean': {
        if (typeof value === 'string') {
          result[key] = value === 'true' || value === '1';
        } else {
          result[key] = Boolean(value);
        }
        break;
      }
      case 'array': {
        if (!Array.isArray(value)) {
          result[key] = [value];
        }
        break;
      }
      default:
        break;
    }
  });

  return result;
}

/**
 * 深度合并查询参数的参数接口
 */
export interface MergeQueryParamsParams<T extends Record<string, any>> {
  target: T;
  source: Partial<T>;
}

/**
 * 深度合并查询参数
 * @param paramObj 包含 target 和 source 的参数对象
 * @returns 合并后的对象
 */
export function mergeQueryParams<T extends Record<string, any>>({
  target,
  source,
}: MergeQueryParamsParams<T>): T {
  const result = { ...target };

  Object.entries(source).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      (result as any)[key] = value;
    }
  });

  return result;
}

/**
 * 标准化查询参数，确保类型一致性
 * @param params 查询参数
 * @returns 标准化后的参数
 */
export function normalizeQueryParams<T extends Record<string, any>>(
  params: T,
): T {
  const result = { ...params } as any;

  Object.entries(result).forEach(([key, value]) => {
    // 处理字符串化的数组
    if (
      typeof value === 'string' &&
      value.startsWith('[') &&
      value.endsWith(']')
    ) {
      try {
        result[key] = JSON.parse(value);
      } catch (error: unknown) {
        // ✅ 静默处理 JSON.parse 错误（如果解析失败，保持原值）
        // 不需要记录警告，因为这是正常的容错处理
        // 如果解析失败，保持原值
      }
    }

    // 处理字符串化的布尔值
    if (value === 'true') {
      result[key] = true;
    } else if (value === 'false') {
      result[key] = false;
    }

    // 处理字符串化的数字
    if (typeof value === 'string' && /^\d+$/.test(value)) {
      const numValue = Number(value);
      if (!Number.isNaN(numValue)) {
        result[key] = numValue;
      }
    }
  });

  return result;
}
