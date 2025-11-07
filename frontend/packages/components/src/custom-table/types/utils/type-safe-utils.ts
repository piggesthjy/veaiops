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
 * 类型安全工具函数
 * 替代 any 类型，提供更安全的类型操作
 */

import type { BaseQuery, BaseRecord } from '@veaiops/types';

/**
 * 安全的记录类型字段访问
 */
export type SafeRecordAccess<T extends BaseRecord, K extends keyof T> = T[K];

/**
 * 安全的查询参数类型
 */
export type SafeQueryParams<T extends BaseQuery> = {
  [K in keyof T]: T[K];
};

/**
 * 配置对象的类型安全访问
 */
export interface TypeSafeConfig<T = Record<string, unknown>> {
  /** 原始配置 */
  raw: T;
  /** 获取配置值 */
  get: <K extends keyof T>(key: K) => T[K];
  /** 设置配置值 */
  set: <K extends keyof T>(key: K, value: T[K]) => void;
  /** 检查配置键是否存在 */
  has: <K extends keyof T>(key: K) => boolean;
  /** 获取所有键 */
  keys: () => (keyof T)[];
  /** 验证配置格式 */
  validate: () => boolean;
}

/**
 * 创建类型安全的配置对象
 */
export function createTypeSafeConfig<T extends Record<string, unknown>>(
  initialConfig: T,
): TypeSafeConfig<T> {
  const config = { ...initialConfig };

  return {
    raw: config,
    get<K extends keyof T>(key: K): T[K] {
      return config[key];
    },
    set<K extends keyof T>(key: K, value: T[K]): void {
      config[key] = value;
    },
    has<K extends keyof T>(key: K): boolean {
      return key in config;
    },
    keys(): (keyof T)[] {
      return Object.keys(config) as (keyof T)[];
    },
    validate(): boolean {
      return typeof config === 'object' && config !== null;
    },
  };
}

/**
 * 安全的数组操作工具
 */
export interface SafeArrayUtils<T> {
  /** 过滤数组 */
  filter: (predicate: (item: T, index: number) => boolean) => T[];
  /** 映射数组 */
  map: <U>(mapper: (item: T, index: number) => U) => U[];
  /** 查找元素 */
  find: (predicate: (item: T, index: number) => boolean) => T | undefined;
  /** 检查是否存在 */
  some: (predicate: (item: T, index: number) => boolean) => boolean;
  /** 检查所有元素 */
  every: (predicate: (item: T, index: number) => boolean) => boolean;
  /** 归约操作 */
  reduce: <U>(
    reducer: (acc: U, item: T, index: number) => U,
    initialValue: U,
  ) => U;
  /** 获取长度 */
  length: number;
  /** 原始数组 */
  raw: T[];
}

/**
 * 创建安全的数组工具
 */
export function createSafeArrayUtils<T>(array: T[]): SafeArrayUtils<T> {
  const safeArray = Array.isArray(array) ? [...array] : [];

  return {
    filter(predicate: (item: T, index: number) => boolean): T[] {
      return safeArray.filter(predicate);
    },
    map<U>(mapper: (item: T, index: number) => U): U[] {
      return safeArray.map(mapper);
    },
    find(predicate: (item: T, index: number) => boolean): T | undefined {
      return safeArray.find(predicate);
    },
    some(predicate: (item: T, index: number) => boolean): boolean {
      return safeArray.some(predicate);
    },
    every(predicate: (item: T, index: number) => boolean): boolean {
      return safeArray.every(predicate);
    },
    reduce<U>(
      reducer: (acc: U, item: T, index: number) => U,
      initialValue: U,
    ): U {
      return safeArray.reduce(reducer, initialValue);
    },
    get length(): number {
      return safeArray.length;
    },
    get raw(): T[] {
      return safeArray;
    },
  };
}

/**
 * 事件处理器的类型安全封装
 */
export type SafeEventHandler<EventType extends string, EventData = unknown> = {
  eventType: EventType;
  handler: (data: EventData) => void;
  once?: boolean;
};

/**
 * 请求参数的类型安全处理
 */
export interface SafeRequestParams<T = Record<string, unknown>> {
  /** 查询参数 */
  query?: T;
  /** 路径参数 */
  params?: Record<string, string | number>;
  /** 请求体 */
  body?: unknown;
  /** 请求头 */
  headers?: Record<string, string>;
}

/**
 * 响应数据的类型安全处理
 */
export interface SafeResponseData<T = unknown> {
  /** 响应数据 */
  data: T;
  /** 状态码 */
  status: number;
  /** 状态文本 */
  statusText: string;
  /** 响应头 */
  headers: Record<string, string>;
  /** 是否成功 */
  success: boolean;
}

/**
 * 分页数据的类型安全处理
 */
export interface SafePaginationData<T = unknown> {
  /** 数据列表 */
  list: T[];
  /** 当前页码 */
  current: number;
  /** 每页大小 */
  pageSize: number;
  /** 总数据量 */
  total: number;
  /** 总页数 */
  totalPages: number;
  /** 是否有下一页 */
  hasNext: boolean;
  /** 是否有上一页 */
  hasPrev: boolean;
}

/**
 * 创建类型安全的分页数据
 */
export function createSafePaginationData<T>(
  list: T[],
  current: number,
  pageSize: number,
  total: number,
): SafePaginationData<T> {
  const totalPages = Math.ceil(total / pageSize);

  return {
    list: Array.isArray(list) ? list : [],
    current: Math.max(1, current),
    pageSize: Math.max(1, pageSize),
    total: Math.max(0, total),
    totalPages,
    hasNext: current < totalPages,
    hasPrev: current > 1,
  };
}

/**
 * 字段验证器类型
 */
export type FieldValidator<T> = (value: T) => boolean | string;

/**
 * 表单验证的类型安全处理
 */
export interface SafeFormValidation<T extends Record<string, unknown>> {
  /** 验证规则 */
  rules: {
    [K in keyof T]?: FieldValidator<T[K]>[];
  };
  /** 执行验证 */
  validate: (data: T) => {
    isValid: boolean;
    errors: Partial<Record<keyof T, string[]>>;
  };
}

/**
 * 创建类型安全的表单验证器
 */
export function createSafeFormValidation<T extends Record<string, unknown>>(
  rules: {
    [K in keyof T]?: FieldValidator<T[K]>[];
  },
): SafeFormValidation<T> {
  return {
    rules,
    validate(data: T) {
      const errors: Partial<Record<keyof T, string[]>> = {};
      let isValid = true;

      for (const [field, validators] of Object.entries(rules) as [
        keyof T,
        FieldValidator<T[keyof T]>[] | undefined,
      ][]) {
        if (!validators) {
          continue;
        }

        const fieldErrors: string[] = [];
        const value = data[field];

        for (const validator of validators) {
          const result = validator(value);
          if (result !== true) {
            fieldErrors.push(
              typeof result === 'string'
                ? result
                : `${String(field)} is invalid`,
            );
            isValid = false;
          }
        }

        if (fieldErrors.length > 0) {
          errors[field] = fieldErrors;
        }
      }

      return { isValid, errors };
    },
  };
}
