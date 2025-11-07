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
 * Common utility function collection
 * Provides common data processing and conversion utilities
 *

 * @date 2025-12-19
 */

// URLSearchParams is a native browser API; no import needed
import {
  entries,
  fromPairs,
  isNull,
  isUndefined,
  isNaN as lodashIsNaN,
} from 'lodash-es';

/**
 * Ensure the input value is an array.
 * If the value is undefined, return an empty array.
 * If the value is not an array, return an array containing the value.
 * If the value is already an array, return it directly.
 */
export const ensureArray = <T>(value: unknown): T[] => {
  if (value === undefined || value === null) {
    return [];
  }
  return Array.isArray(value)
    ? value.filter(Boolean)
    : [value as T].filter(Boolean);
};

/**
 * 过滤掉参数对象中的空值、空数组和空字符串（兼容版本）
 */
export const filterEmptyQueryParams = (
  queryRequestParams?: Record<string, unknown>,
): Record<string, unknown> => {
  // Use entries to convert the object to [key, value] tuples and filter out empty values, empty arrays, and empty strings
  const filteredQueries = entries(queryRequestParams)?.filter(
    ([, val]: [string, unknown]) => {
      // Check if value is defined
      const isValueUndefined = isUndefined(val);
      // Check if value is null
      const isValueNull = isNull(val);
      // Check if value is NaN
      const isValueNan = lodashIsNaN(val);
      if (isValueUndefined) {
        return false;
      }

      if (isValueNull) {
        return false;
      }

      if (isValueNan) {
        return false;
      }

      if (!isValueUndefined && !isValueNull && !isValueNan) {
        // Check if value is a non-empty array
        if (Array.isArray(val)) {
          const isNonEmptyArray = val.length > 0;
          return isNonEmptyArray;
        }
        if (typeof val === 'string') {
          const isNonEmptyString = val.trim() !== '';
          return isNonEmptyString;
        }
      }

      return true;
    },
  );

  // Use fromPairs to convert filtered entries back to an object
  return fromPairs(filteredQueries);
};

/**
 * 从对象中移除指定的键的参数接口（兼容版本）
 */
export interface OmitObjectKeysParams<T extends Record<string, any>> {
  obj: T;
  keys: string[];
}

/**
 * 从对象中移除指定的键（兼容版本）
 */
export const omitObjectKeys = <T extends Record<string, any>>({
  obj,
  keys,
}: OmitObjectKeysParams<T>): Partial<T> => {
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => !keys.includes(key)),
  ) as Partial<T>;
};

/**
 * 转换参数类型（兼容版本）
 */
export const convertQueryParamsTypes = (
  params: Record<string, unknown>,
): Record<string, unknown> => {
  const result: Record<string, unknown> = {};

  for (const key in params) {
    if (Object.prototype.hasOwnProperty.call(params, key)) {
      const value = params[key];

      // Convert numeric strings to numbers
      if (
        typeof value === 'string' &&
        !Number.isNaN(Number(value)) &&
        value !== ''
      ) {
        result[key] = Number(value);
      } else if (Array.isArray(value)) {
        // Recursively handle arrays
        result[key] = value.map((item) =>
          typeof item === 'string' && !Number.isNaN(Number(item)) && item !== ''
            ? Number(item)
            : item,
        );
      } else {
        result[key] = value;
      }
    }
  }

  return result;
};

/**
 * 检查是否可以转换为数字
 */
export const canConvertToNumber = (value: any): boolean => {
  return (
    !Number.isNaN(Number(value)) &&
    value !== '' &&
    value !== null &&
    value !== undefined
  );
};

/**
 * 转换为数字
 */
export const toNumber = (value: any): number => {
  return canConvertToNumber(value) ? Number(value) : value;
};

/**
 * 将 URLSearchParams 转化为包含所有查询参数的对象（兼容版本）
 */
export const parseURLSearchParams = ({
  searchParams,
  querySearchParamsFormat = {},
}: {
  searchParams: globalThis.URLSearchParams | string;
  querySearchParamsFormat?: Record<
    string,
    (params: { value: string }) => unknown
  >;
}): Record<string, unknown> => {
  const params =
    typeof searchParams === 'string'
      ? new URLSearchParams(searchParams)
      : searchParams;

  const paramsObject: Record<string, any> = {};

  for (const [key, value] of params.entries()) {
    const formatFunc = querySearchParamsFormat[key];
    if (paramsObject[key] !== undefined) {
      const previousValues = ensureArray(paramsObject[key]);
      const newValue = formatFunc ? formatFunc({ value }) : value;
      paramsObject[key] = Array.isArray(newValue)
        ? newValue
        : [...previousValues, newValue];
    } else {
      paramsObject[key] = formatFunc ? formatFunc({ value }) : value;
    }
  }

  return paramsObject;
};

export interface SafeJSONParseParams {
  valueString: undefined | string;
  empty?: unknown;
  shouldThrow?: boolean;
}

/**
 * 安全的去解析JSON字符串
 */
export const safeJSONParse = ({
  valueString,
  empty = undefined,
  shouldThrow = false,
}: SafeJSONParseParams): unknown => {
  try {
    if (valueString !== undefined) {
      return JSON.parse(valueString);
    }
    return empty;
  } catch (error) {
    if (shouldThrow) {
      throw error;
    }
    return empty;
  }
};

/**
 * Get params object and filter empty values (imported from query.ts)
 * @param params Original params object
 * @returns Filtered params object
 */
export function getParamsObject<T extends Record<string, any>>(
  params: T,
): Partial<T> {
  const result: Partial<T> = {};

  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== '') {
      // For arrays, keep only non-empty arrays
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

// Note: The alias functions below are unused and removed
// If needed, use the original functions: convertQueryParamsTypes or omitObjectKeys

// /**
//  * Alias function for converting parameter types
//  */
// export const convertParamsTypes = convertQueryParamsTypes;

// /**
//  * Alias function for removing specified keys from an object
//  */
// export const omitKeysFromObject = omitObjectKeys;

/**
 * 表单数据属性类型
 */
export interface FormTableDataProps<
  RecordType = unknown,
  FormatRecordType = RecordType,
> {
  sourceData?: RecordType[];
  formattedData?: FormatRecordType[];
  [key: string]: unknown;
}

/**
 * Safe clipboard copy utility
 * - Prefer navigator.clipboard.writeText
 * - Fallback to textarea + document.execCommand('copy') when Clipboard API is unavailable
 *
 * Note: This utility doesn't depend on the UI layer (e.g., Message). On errors, it returns a result object, and the caller decides how to notify users.
 *
 * @param text Text to copy
 * @returns Result object of shape { success: boolean; error?: Error }
 */
export const safeCopyToClipboard = async (
  text: string,
): Promise<{ success: boolean; error?: Error }> => {
  try {
    if (
      typeof navigator !== 'undefined' &&
      (navigator as any).clipboard &&
      typeof (navigator as any).clipboard.writeText === 'function'
    ) {
      await (navigator as any).clipboard.writeText(text);
      return { success: true };
    }

    // Fallback implementation for older browsers / limited environments
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '0';
    textarea.style.left = '0';
    textarea.style.width = '1px';
    textarea.style.height = '1px';
    textarea.style.padding = '0';
    textarea.style.border = 'none';
    textarea.style.outline = 'none';
    textarea.style.boxShadow = 'none';
    textarea.style.background = 'transparent';
    document.body.appendChild(textarea);
    textarea.select();

    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);

    if (!successful) {
      throw new Error('浏览器不支持剪贴板复制');
    }

    return { success: true };
  } catch (err: unknown) {
    // ✅ Correct: expose the actual error info
    const error = err instanceof Error ? err : new Error(String(err));
    // The utility layer shouldn't depend directly on a logging lib; use console.error for minimal logging
    console.error('[safeCopyToClipboard] 复制失败:', {
      error: error.message,
      timestamp: Date.now(),
    });
    return { success: false, error };
  }
};
