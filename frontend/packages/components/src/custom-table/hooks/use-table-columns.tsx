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

import type {
  CustomTableColumnProps,
  IQueryOptions,
} from '@/custom-table/types/components';
import type { SorterResult } from '@arco-design/web-react/es/Table/interface';
import { get, omit, pickBy } from 'lodash-es';
import { useCallback, useMemo, useState } from 'react';

/**
 * 根据fields顺序对列进行排序
 */
function sortColumnsByFields<T = Record<string, unknown>>({
  columns,
  fields,
}: {
  columns: CustomTableColumnProps<T>[];
  fields?: string[];
}): CustomTableColumnProps<T>[] {
  if (!fields || fields.length === 0) {
    return columns;
  }

  return columns.sort((a, b) => {
    const aIndex = fields.indexOf(a.dataIndex ?? '');
    const bIndex = fields.indexOf(b.dataIndex ?? '');

    // 如果都不在fields中，保持原有顺序
    if (aIndex === -1 && bIndex === -1) {
      return 0;
    }
    // 如果a不在fields中，排在后面
    if (aIndex === -1) {
      return 1;
    }
    // 如果b不在fields中，排在前面
    if (bIndex === -1) {
      return -1;
    }
    // 按照fields中的顺序排序
    return aIndex - bIndex;
  });
}

/**
 * 根据用户选择的fields过滤出需要展示的字段
 */
function filterTreeColumns<T = Record<string, unknown>>({
  baseColumns,
  fields,
}: {
  /** 定制的基础的columns */
  baseColumns: CustomTableColumnProps<T>[];
  /** 需要展现的字段 */
  fields?: string[];
}): CustomTableColumnProps<T>[] {
  const filterColumns: CustomTableColumnProps<T>[] = [];

  baseColumns.forEach((baseColumn) => {
    const { children, dataIndex } = baseColumn;

    if (Array.isArray(children)) {
      const nextChildren = filterTreeColumns<T>({
        baseColumns: children,
        fields,
      });
      if (nextChildren.length) {
        filterColumns.push({
          ...baseColumn,
          children: nextChildren,
        });
      }
    } else if (!fields || (dataIndex && fields.includes(dataIndex))) {
      filterColumns.push({
        ...baseColumn,
      });
    }
  });

  return filterColumns;
}

/**
 * 将columns进行转换，主要是有CustomTitleComponent【自定义表头】的column
 */
function transferTreeColumns<T>(params: {
  /**
   * 特殊的columns
   */
  columns: CustomTableColumnProps<T>[];
  /**
   * 排序的值
   */
  sorter: SorterResult | undefined;
  /**
   * 表格内筛选获得的值
   */
  filters: Record<string, unknown>;
  /**
   * 表格内部修改 排序值 和 筛选值的方法
   * @param type 类型
   * @param value 值
   * @returns void
   */
  handleChange: (params: {
    type: string;
    value?: Record<string, unknown>;
  }) => void;
  /**
   * 表头内部模糊查询的函数
   */
  queryOptions?: any;
}): CustomTableColumnProps<T>[] {
  const { columns, sorter, filters, handleChange, queryOptions } = params;

  return columns.map((column) => {
    const {
      dataIndex,
      filterDataIndex,
      title,
      children,
      CustomTitleComponent,
      customTitleProps,
    } = column;

    const lastColumn: CustomTableColumnProps<T> = {
      ...omit(column, ['children', 'customTitleProps', 'CustomTitleComponent']),
      title: column.title,
      dataIndex: column.dataIndex,
    };

    if (CustomTitleComponent) {
      const titleNode = (CustomTitleComponent as any)({
        dataIndex: dataIndex ?? '',
        filterDataIndex,
        title: title as string,
        sorter,
        filters: filters as Record<
          string,
          string | number | string[] | number[]
        >,
        onChange: handleChange,
        queryOptions,
        ...(customTitleProps as any),
      });
      lastColumn.title = titleNode;
    }

    if (Array.isArray(children) && children.length > 0) {
      const nextChildren = transferTreeColumns({
        columns: children,
        sorter,
        filters,
        handleChange,
        queryOptions,
      });
      lastColumn.children = nextChildren;
    }

    return lastColumn;
  });
}

/**
 *
 * @param originFilters 原来的表格顶部筛选
 * @param nextFilter 需要改变的表格筛选
 * @returns 最终的表格筛选项
 */
const getNextFilters = (
  originFilters: Record<string, unknown>,
  nextFilter: Record<string, unknown>,
): Record<string, string[] | number[]> => {
  const key = Object.keys(nextFilter)[0];
  const nextValue = get(nextFilter, key);
  const originValue = get(originFilters, key);
  const nextFilters =
    nextValue !== originValue
      ? {
          ...originFilters,
          [key]: nextValue,
        }
      : originFilters;
  return pickBy(nextFilters, (v: unknown) => v !== null) as Record<
    string,
    string[] | number[]
  >;
};

/**
 * 完整的表格列业务管理Hook
 *
 * @description 这是完整的业务表格列管理实现，包含：
 * - 字段过滤和排序
 * - 表格内筛选功能
 * - 自定义表头组件支持
 * - 树形列结构处理
 * - 排序和筛选状态管理
 *
 *
 * @example
 * ```tsx
 * const { columns, sorter, filters, setFilters } = useTableColumns({
 *   baseColumns: myColumns,
 *   fields: ['name', 'age'],
 *   defaultSorter: { field: 'name', direction: 'ascend' }
 * });
 * ```
 */
export const useTableColumns = <T = Record<string, unknown>>({
  baseColumns,
  queryOptions,
  defaultSorter,
  fields,
  defaultFilters = {},
}: {
  /** 基础的列 */
  baseColumns: CustomTableColumnProps<T>[];
  /** 需要展示的字段 */
  fields?: string[];
  /** 默认的排序 */
  defaultSorter?: SorterResult;
  /** 默认的筛选 */
  defaultFilters?: Record<string, unknown>;
  /** 字段查询的通用函数 */
  queryOptions?: any;
}) => {
  const [query, setQuery] = useState<Record<string, unknown>>({});
  const [sorter, setSorter] = useState<SorterResult | undefined>(defaultSorter);
  const [filters, setFilters] = useState<Record<string, string[] | number[]>>(
    defaultFilters as Record<string, string[] | number[]>,
  );

  /**
   * 改不排序和筛选的方法的参数接口
   */
  interface HandleChangeParams {
    type: string;
    value?: unknown;
  }

  /** 改不排序和筛选的方法 */
  const handleChange = useCallback(({ type, value }: HandleChangeParams) => {
    switch (type) {
      case 'sorter':
        setSorter(value as SorterResult);
        break;
      case 'filters':
        setFilters((originFilters) =>
          getNextFilters(originFilters, value as Record<string, unknown>),
        );
        break;
      case 'query':
        setQuery((preQuery) => ({
          ...preQuery,
          ...(value as Record<string, unknown>),
        }));
        break;
      default:
        break;
    }
  }, []);

  /** 最终的列 */
  const columns = useMemo(() => {
    // 1. 先根据fields过滤对应的字段
    const filterColumns: CustomTableColumnProps<T>[] = filterTreeColumns<T>({
      baseColumns,
      fields,
    });
    // 2. 将自定义的columns转换为标准的columns
    const standardColumns = transferTreeColumns<T>({
      columns: filterColumns,
      sorter,
      filters,
      handleChange,
      queryOptions,
    });
    // 3.按照fields的顺序进行排序
    const sortColumns = sortColumnsByFields<T>({
      columns: standardColumns,
      fields,
    });

    return sortColumns;
  }, [baseColumns, fields, sorter, filters, handleChange, queryOptions]);

  return {
    /** 返回的列 */
    columns,
    /** 查询 */
    query,
    /** 排序 */
    sorter,
    /** 筛选 */
    filters,
    /** 设置筛序 */
    setFilters,
  };
};
