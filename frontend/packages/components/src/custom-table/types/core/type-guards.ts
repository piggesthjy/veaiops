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
 * CustomTable 类型守卫函数
 * 用于安全的类型转换和验证，替代 as unknown 断言
 */

import type { PluginContext, TableDataSource } from '@veaiops/types';
import type { BaseQuery, BaseRecord } from './common';

/**
 * 检查是否为有效的记录类型
 */
export function isValidRecord<T extends BaseRecord>(
  value: unknown,
): value is T {
  if (value === null || typeof value !== 'object') {
    return false;
  }

  const record = value as Record<string, unknown>;

  // // 支持多种主键字段命名约定：
  // // - Id (标准约定)
  // // - id (小写约定)
  // // - approvalId (工单主键)
  // // - 其他常见主键字段
  // const hasValidId =
  //   typeof record.Id !== 'undefined' ||
  //   typeof record.id !== 'undefined' ||
  //   typeof record.approvalId !== 'undefined' ||
  //   typeof record.ApprovalId !== 'undefined' ||
  //   typeof record.key !== 'undefined' ||
  //   typeof record.Key !== 'undefined';

  return true;
}

/**
 * 检查是否为有效的查询类型
 */
export function isValidQuery<T extends BaseQuery>(value: unknown): value is T {
  return value !== null && typeof value === 'object';
}

/**
 * 检查是否为有效的记录数组
 */
export function isValidRecordArray<T extends BaseRecord>(
  value: unknown,
): value is T[] {
  return Array.isArray(value) && value.every((item) => isValidRecord<T>(item));
}

/**
 * 安全的记录类型转换
 */
export function safeRecordCast<T extends BaseRecord>(
  value: unknown,
  fallback: T[] = [],
): T[] {
  if (isValidRecordArray<T>(value)) {
    return value;
  }

  // 提供更详细的调试信息
  if (Array.isArray(value) && value.length > 0) {
    const firstRecord = value[0] as Record<string, unknown>;
    const availableKeys = Object.keys(firstRecord);
  } else {
    // No action for empty array
  }

  return fallback;
}

/**
 * 安全的查询类型转换
 */
export function safeQueryCast<T extends BaseQuery>(
  value: unknown,
  fallback: T = {} as T,
): T {
  if (isValidQuery<T>(value)) {
    return value;
  }

  return fallback;
}

/**
 * 检查是否为有效的插件上下文
 */
export function isValidPluginContext<
  RecordType extends BaseRecord,
  QueryType extends BaseQuery,
>(value: unknown): value is PluginContext<RecordType, QueryType> {
  return (
    value !== null &&
    typeof value === 'object' &&
    'state' in value &&
    'props' in value &&
    'helpers' in value
  );
}

/**
 * 安全的插件上下文转换
 */
export function safeContextCast<
  RecordType extends BaseRecord,
  QueryType extends BaseQuery,
>(value: unknown): PluginContext<RecordType, QueryType> | null {
  if (isValidPluginContext<RecordType, QueryType>(value)) {
    return value;
  }

  return null;
}

/**
 * 检查是否为有效的数据源
 */
export function isValidDataSource<
  RecordType extends BaseRecord,
  QueryType extends BaseQuery,
>(value: unknown): value is TableDataSource<RecordType, QueryType> {
  if (value === null || typeof value !== 'object') {
    return false;
  }

  const obj = value as Record<string, unknown>;

  // 支持两种数据源配置模式：
  // 1. 直接请求函数模式: 有 request 属性
  // 2. 服务实例模式: 有 serviceInstance 和 serviceMethod 属性
  const hasRequestFunction =
    'request' in obj && typeof obj.request === 'function';
  const hasServiceConfig = 'serviceInstance' in obj && 'serviceMethod' in obj;

  return hasRequestFunction || hasServiceConfig;
}

/**
 * 安全的数据源转换
 */
export function safeDataSourceCast<
  RecordType extends BaseRecord,
  QueryType extends BaseQuery,
>(value: unknown): TableDataSource<RecordType, QueryType> | undefined {
  if (isValidDataSource<RecordType, QueryType>(value)) {
    return value;
  }

  if (value !== undefined) {
    // Invalid data source
  }
  return undefined;
}

/**
 * 泛型兼容性转换工具
 * 用于处理复杂的泛型协变性问题
 */
export interface TypeSafeConverter {
  /**
   * 安全的上下文转换，处理泛型协变性
   */
  convertContext: <
    FromRecord extends BaseRecord,
    FromQuery extends BaseQuery,
    ToRecord extends BaseRecord,
    ToQuery extends BaseQuery,
  >(
    context: PluginContext<FromRecord, FromQuery>,
  ) => PluginContext<ToRecord, ToQuery>;

  /**
   * 安全的数据转换，处理格式化记录类型
   */
  convertRecordData: <
    FromRecord extends BaseRecord,
    ToRecord extends BaseRecord,
  >(
    data: FromRecord[],
  ) => ToRecord[];
}

/**
 * 类型安全转换器实现
 */
export const typeSafeConverter: TypeSafeConverter = {
  convertContext<
    FromRecord extends BaseRecord,
    FromQuery extends BaseQuery,
    ToRecord extends BaseRecord,
    ToQuery extends BaseQuery,
  >(
    context: PluginContext<FromRecord, FromQuery>,
  ): PluginContext<ToRecord, ToQuery> {
    // 这里使用结构化克隆确保类型安全
    return {
      state: {
        ...context.state,
        formattedTableData: context.state.formattedTableData as ToRecord[],
      },
      props: context.props as unknown as PluginContext<
        ToRecord,
        ToQuery
      >['props'],
      helpers: {
        ...context.helpers,
        setQuery: context.helpers.setQuery,
      },
    } as unknown as PluginContext<ToRecord, ToQuery>;
  },

  convertRecordData<FromRecord extends BaseRecord, ToRecord extends BaseRecord>(
    data: FromRecord[],
  ): ToRecord[] {
    // 验证数据格式是否兼容
    if (!isValidRecordArray(data)) {
      return [];
    }

    return data as unknown as ToRecord[];
  },
};
