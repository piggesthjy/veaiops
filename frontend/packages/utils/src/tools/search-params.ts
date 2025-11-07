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

import { has, isString } from 'lodash-es';

import { canConvertToNumber, ensureArray, toNumber } from './common';

/**
 * Query format value properties interface
 */
export interface QueryFormatValueProps {
  pre: unknown;
  value: unknown;
}

/**
 * 将 URLSearchParams 转化为包含所有查询参数的对象
 * @param searchParams URLSearchParams 实例
 * @returns 包含所有查询参数的对象，如果有相同键但不同值的情况，则值以数组形式存储
 */
export const getSearchParamsObject = ({
  searchParams,
  queryFormat = {},
}: {
  searchParams: URLSearchParams;
  queryFormat?: Record<
    string,
    (v: {
      pre: unknown;
      value: unknown;
    }) => number | number[] | string | string[]
  >;
}): Record<string, number | number[] | string | string[]> => {
  const paramsObject: Record<string, number | number[] | string | string[]> =
    {};
  for (const [key, value] of Array.from(searchParams.entries())) {
    const formatFunc = queryFormat[key];
    if (has(paramsObject, key)) {
      const previousValues = ensureArray<any>(paramsObject[key]);
      const newValue = formatFunc
        ? formatFunc?.({ pre: previousValues, value })
        : value;
      paramsObject[key] = newValue;
    } else {
      paramsObject[key] = formatFunc
        ? formatFunc?.({ pre: paramsObject[key], value })
        : value;
    }
  }
  return paramsObject;
};

/**
 * 默认query数组处理函数
 * @param pre
 * @param value
 */
export const queryArrayFormat = <T>({ pre, value }: QueryFormatValueProps) => {
  if (pre === undefined) {
    return ensureArray<T>(value);
  } else if (Array.isArray(pre)) {
    return [...pre, value];
  }
  return [...ensureArray<T>(pre), value];
};

/**
 * 默认query单选级联数组处理函数
 * @param pre
 * @param value
 */
export const queryArrayCascaderFormat = ({
  pre,
  value,
}: QueryFormatValueProps) => {
  if (pre === undefined && isString(value)) {
    return value?.split(',');
  }
  return pre;
};

/**
 * 默认query多选级联数组处理函数
 * @param pre
 * @param value
 */
export const queryArrayMultiCascaderFormat = <T>({
  pre,
  value,
}: QueryFormatValueProps) => {
  if (pre === undefined) {
    if (isString(value)) {
      return [value.split(',')];
    }
    return ensureArray<T>(value);
  } else if (Array.isArray(pre)) {
    let currentValue;
    if (isString(value)) {
      currentValue = value.split(',');
    } else if (Array.isArray(value)) {
      currentValue = value;
    }
    return [...pre, currentValue].filter(Boolean);
  }
  return [...ensureArray<T>(pre), value];
};

/**
 * 默认query数值类型数组处理函数
 * @param pre - 前一个数组
 * @param value - 要合并的值
 * @returns {Array} - 合并后的数组
 */
export const queryNumberArrayFormat = ({
  pre,
  value,
}: QueryFormatValueProps): Array<number> => {
  // 将 value 转换为数字（如果可以）
  const current = toNumber(value);

  // 如果前一个数组未定义，返回当前值组成的数组
  if (pre === undefined) {
    const arr = Array.isArray(current) ? current : [current];
    return ensureArray(arr);
  }
  // 如果前一个数组是一个数组，使用展开运算符将当前值添加到前一个数组并返回
  else if (Array.isArray(pre)) {
    return [...pre, current];
  }
  // 如果前一个数组不是数组，使用 concat 方法将前一个数组和当前值连接到一个新的数组中并返回
  return ensureArray<number>(pre).concat(current);
};

/**
 * 默认query数值类型处理函数
 * @param value
 */
export const queryNumberFormat = ({ value }: QueryFormatValueProps) =>
  canConvertToNumber(value) ? Number(value) : value;

/**
 * 默认query布尔值处理函数
 * @param value
 */
export const queryBooleanFormat = <T>({ value }: { value: T }) => {
  switch (value) {
    case 'true':
      return true;
    case 'false':
      return false;
    default:
      return false;
  }
};
