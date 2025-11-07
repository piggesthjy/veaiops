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

import type { GetLabelValueParams } from '../types';

/**
 * 安全的数值解析函数
 */
export const parseToNumber = (value: unknown): number | undefined => {
  if (value === null || value === undefined) {
    return undefined;
  }

  // 边界检查：已经是数字
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }

  // 边界检查：字符串转数字
  if (typeof value === 'string') {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : undefined;
  }

  return undefined;
};

/**
 * 获取标签值
 */
export const getLabelValue = ({ obj, key }: GetLabelValueParams): string => {
  const value = obj[key];
  if (value === null || value === undefined) {
    return '';
  }
  // 确保值可以安全转换为字符串
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value);
  }
  return String(value);
};
