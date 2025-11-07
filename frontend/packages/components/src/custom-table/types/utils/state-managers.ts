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
 * 状态管理器类型安全工具
 * 替代 as unknown 和不安全的属性删除操作
 */

import type { BaseQuery, BaseRecord, PluginContext } from '@veaiops/types';

/**
 * 状态字段删除操作类型
 */
export type StateFieldKey = string;

/**
 * 安全的状态清理器
 */
export interface SafeStateCleaner<
  RecordType extends BaseRecord = BaseRecord,
  QueryType extends BaseQuery = BaseQuery,
> {
  /** 移除状态字段 */
  removeStateFields: (
    context: PluginContext<RecordType, QueryType>,
    fields: StateFieldKey[],
  ) => void;

  /** 移除助手方法 */
  removeHelperMethods: (
    context: PluginContext<RecordType, QueryType>,
    methods: string[],
  ) => void;

  /** 重置特定状态 */
  resetStateFields: <T extends Record<string, unknown>>(
    target: T,
    resetFields: Partial<T>,
  ) => T;

  /** 安全地检查字段是否存在 */
  hasStateField: (
    context: PluginContext<RecordType, QueryType>,
    field: StateFieldKey,
  ) => boolean;

  /** 安全地获取状态字段值 */
  getStateField: <T = unknown>(
    context: PluginContext<RecordType, QueryType>,
    field: StateFieldKey,
  ) => T | undefined;
}

/**
 * 创建类型安全的状态清理器
 */
export function createSafeStateCleaner<
  RecordType extends BaseRecord = BaseRecord,
  QueryType extends BaseQuery = BaseQuery,
>(): SafeStateCleaner<RecordType, QueryType> {
  return {
    removeStateFields(
      context: PluginContext<RecordType, QueryType>,
      fields: StateFieldKey[],
    ): void {
      fields.forEach((field) => {
        if (field in context.state) {
          // 使用 Reflect.deleteProperty 进行安全删除
          Reflect.deleteProperty(context.state, field);
        }
      });
    },

    removeHelperMethods(
      context: PluginContext<RecordType, QueryType>,
      methods: string[],
    ): void {
      methods.forEach((method) => {
        if (method in context.helpers) {
          // 使用 Reflect.deleteProperty 进行安全删除
          Reflect.deleteProperty(context.helpers, method);
        }
      });
    },

    resetStateFields<T extends Record<string, unknown>>(
      target: T,
      resetFields: Partial<T>,
    ): T {
      return {
        ...target,
        ...resetFields,
      };
    },

    hasStateField(
      context: PluginContext<RecordType, QueryType>,
      field: StateFieldKey,
    ): boolean {
      return field in context.state;
    },

    getStateField<T = unknown>(
      context: PluginContext<RecordType, QueryType>,
      field: StateFieldKey,
    ): T | undefined {
      if (this.hasStateField(context, field)) {
        return (context.state as unknown as Record<string, unknown>)[
          field
        ] as T;
      }
      return undefined;
    },
  };
}

/**
 * 分页状态管理器
 */
export interface PaginationStateManager<
  RecordType extends BaseRecord = BaseRecord,
  QueryType extends BaseQuery = BaseQuery,
> {
  /** 清理分页状态 */
  cleanupPaginationState: (
    context: PluginContext<RecordType, QueryType>,
  ) => void;

  /** 重置分页状态 */
  resetPaginationState: (context: PluginContext<RecordType, QueryType>) => void;

  /** 设置分页参数 */
  setPaginationParams: (
    context: PluginContext<RecordType, QueryType>,
    params: { current?: number; pageSize?: number },
  ) => void;

  /** 获取分页参数 */
  getPaginationParams: (context: PluginContext<RecordType, QueryType>) => {
    current?: number;
    pageSize?: number;
  };
}

/**
 * 创建分页状态管理器
 */
export function createPaginationStateManager<
  RecordType extends BaseRecord = BaseRecord,
  QueryType extends BaseQuery = BaseQuery,
>(): PaginationStateManager<RecordType, QueryType> {
  const stateCleaner = createSafeStateCleaner<RecordType, QueryType>();

  return {
    cleanupPaginationState(
      context: PluginContext<RecordType, QueryType>,
    ): void {
      // 清理分页相关状态字段
      stateCleaner.removeStateFields(context, [
        'current',
        'pageSize',
        'isChangingPage',
      ]);

      // 清理分页相关方法
      stateCleaner.removeHelperMethods(context, ['setCurrent', 'setPageSize']);
    },

    resetPaginationState(context: PluginContext<RecordType, QueryType>): void {
      const resetState = stateCleaner.resetStateFields(
        context.state as unknown as Record<string, unknown>,
        {
          current: 1,
          pageSize: 20,
          isChangingPage: false,
        },
      );

      // 更新状态
      Object.assign(context.state, resetState);
    },

    setPaginationParams(
      context: PluginContext<RecordType, QueryType>,
      params: { current?: number; pageSize?: number },
    ): void {
      if (params.current !== undefined) {
        (context.state as unknown as Record<string, unknown>).current =
          params.current;
      }
      if (params.pageSize !== undefined) {
        (context.state as unknown as Record<string, unknown>).pageSize =
          params.pageSize;
      }
    },

    getPaginationParams(context: PluginContext<RecordType, QueryType>): {
      current?: number;
      pageSize?: number;
    } {
      return {
        current: stateCleaner.getStateField<number>(context, 'current'),
        pageSize: stateCleaner.getStateField<number>(context, 'pageSize'),
      };
    },
  };
}

/**
 * 排序状态管理器
 */
export interface SorterStateManager<
  RecordType extends BaseRecord = BaseRecord,
  QueryType extends BaseQuery = BaseQuery,
> {
  /** 清理排序状态 */
  cleanupSorterState: (context: PluginContext<RecordType, QueryType>) => void;

  /** 重置排序状态 */
  resetSorterState: (context: PluginContext<RecordType, QueryType>) => void;

  /** 设置排序参数 */
  setSorterParam: (
    context: PluginContext<RecordType, QueryType>,
    sorter: Record<string, string | number>,
  ) => void;

  /** 获取排序参数 */
  getSorterParam: (
    context: PluginContext<RecordType, QueryType>,
  ) => Record<string, string | number>;
}

/**
 * 创建排序状态管理器
 */
export function createSorterStateManager<
  RecordType extends BaseRecord = BaseRecord,
  QueryType extends BaseQuery = BaseQuery,
>(): SorterStateManager<RecordType, QueryType> {
  const stateCleaner = createSafeStateCleaner<RecordType, QueryType>();

  return {
    cleanupSorterState(context: PluginContext<RecordType, QueryType>): void {
      stateCleaner.removeStateFields(context, ['sorter']);
      stateCleaner.removeHelperMethods(context, ['setSorter', 'resetSorter']);
    },

    resetSorterState(context: PluginContext<RecordType, QueryType>): void {
      const resetState = stateCleaner.resetStateFields(
        context.state as unknown as Record<string, unknown>,
        {
          sorter: {},
        },
      );

      Object.assign(context.state, resetState);
    },

    setSorterParam(
      context: PluginContext<RecordType, QueryType>,
      sorter: Record<string, string | number>,
    ): void {
      (context.state as unknown as Record<string, unknown>).sorter = sorter;
    },

    getSorterParam(
      context: PluginContext<RecordType, QueryType>,
    ): Record<string, string | number> {
      return (
        stateCleaner.getStateField<Record<string, string | number>>(
          context,
          'sorter',
        ) || {}
      );
    },
  };
}

/**
 * 过滤器状态管理器
 */
export interface FilterStateManager<
  RecordType extends BaseRecord = BaseRecord,
  QueryType extends BaseQuery = BaseQuery,
> {
  /** 清理过滤器状态 */
  cleanupFilterState: (context: PluginContext<RecordType, QueryType>) => void;

  /** 重置过滤器状态 */
  resetFilterState: (context: PluginContext<RecordType, QueryType>) => void;

  /** 设置过滤器参数 */
  setFilterParams: (
    context: PluginContext<RecordType, QueryType>,
    filters: Record<
      string,
      string | number | boolean | (string | number | boolean)[]
    >,
  ) => void;

  /** 获取过滤器参数 */
  getFilterParams: (
    context: PluginContext<RecordType, QueryType>,
  ) => Record<
    string,
    string | number | boolean | (string | number | boolean)[]
  >;
}

/**
 * 创建过滤器状态管理器
 */
export function createFilterStateManager<
  RecordType extends BaseRecord = BaseRecord,
  QueryType extends BaseQuery = BaseQuery,
>(): FilterStateManager<RecordType, QueryType> {
  const stateCleaner = createSafeStateCleaner<RecordType, QueryType>();

  return {
    cleanupFilterState(context: PluginContext<RecordType, QueryType>): void {
      stateCleaner.removeStateFields(context, [
        'filters',
        'visibleFilters',
        'isFilterExpanded',
      ]);
      stateCleaner.removeHelperMethods(context, ['setFilters', 'resetFilters']);
    },

    resetFilterState(context: PluginContext<RecordType, QueryType>): void {
      const resetState = stateCleaner.resetStateFields(
        context.state as unknown as Record<string, unknown>,
        {
          filters: {},
          visibleFilters: [],
          isFilterExpanded: false,
        },
      );

      Object.assign(context.state, resetState);
    },

    setFilterParams(
      context: PluginContext<RecordType, QueryType>,
      filters: Record<
        string,
        string | number | boolean | (string | number | boolean)[]
      >,
    ): void {
      (context.state as unknown as Record<string, unknown>).filters = filters;
    },

    getFilterParams(
      context: PluginContext<RecordType, QueryType>,
    ): Record<
      string,
      string | number | boolean | (string | number | boolean)[]
    > {
      return (
        stateCleaner.getStateField<
          Record<
            string,
            string | number | boolean | (string | number | boolean)[]
          >
        >(context, 'filters') || {}
      );
    },
  };
}
