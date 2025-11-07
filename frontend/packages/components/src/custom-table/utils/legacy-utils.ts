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

import { isEmpty, omit, pick, snakeCase } from 'lodash-es';
import type React from 'react';

import type {
  QueryFormat,
  QuerySearchParamsFormat,
} from '@/custom-table/types/legacy-interface';
import type { SorterInfo } from '@arco-design/web-react/es/Table/interface';
import { getParamsObject } from '@veaiops/utils';
// 模拟 SortColumn 类型，避免依赖外部模块
interface SortColumn {
  field: string;
  direction: 'asc' | 'desc';
}

export const ACTIVE_TAB_KEYS = ['activeTab'];

const CustomTableUtil = {
  syncQueryOnSearchParams: ({
    useActiveKeyHook,
    setSearchParams,
    query,
    queryFormat,
    resetRef,
    activeKeyChangeRef,
    querySearchParamsFormat,
  }: {
    useActiveKeyHook: boolean;
    setSearchParams: (
      params: Record<string, string> | (() => Record<string, string>),
    ) => void;
    query: Record<string, unknown>;
    queryFormat: QueryFormat;
    resetRef: React.MutableRefObject<boolean>;
    activeKeyChangeRef: React.MutableRefObject<
      Record<string, unknown> & { value?: unknown; reset?: () => void }
    >;
    querySearchParamsFormat?: QuerySearchParamsFormat;
  }) => {
    // 在浏览器环境中使用 URLSearchParams
    const preUrlSearchParams = new URLSearchParams(window.location.search);
    const queryInSearchParams = getParamsObject({
      searchParams: preUrlSearchParams,
      queryFormat: queryFormat
        ? Object.fromEntries(
            Object.entries(queryFormat).map(([key, fn]) => [
              key,
              (params: { value: string }) =>
                fn({ value: params.value, pre: undefined }),
            ]),
          )
        : undefined,
    });
    const paramsToSet = (() => {
      if (resetRef.current) {
        resetRef.current = false;
        return pick(queryInSearchParams, ACTIVE_TAB_KEYS);
      }
      if (activeKeyChangeRef?.current?.value) {
        activeKeyChangeRef?.current?.reset?.();
      }
      const queryWithoutActiveTabs = omit(query, ACTIVE_TAB_KEYS);
      const mergeQuery = useActiveKeyHook
        ? {
            ...(activeKeyChangeRef?.current?.value
              ? {}
              : queryWithoutActiveTabs),
            ...pick(queryInSearchParams, ACTIVE_TAB_KEYS),
          }
        : { ...queryInSearchParams, ...queryWithoutActiveTabs };
      // 优化query映射
      const formatQuery = querySearchParamsFormat
        ? Object.entries(querySearchParamsFormat)?.reduce<
            Record<string, unknown>
          >(
            (pre, [queryKey, func]) => ({
              ...pre,
              [queryKey]:
                typeof func === 'function'
                  ? func({
                      value: mergeQuery[queryKey as keyof typeof mergeQuery],
                    })
                  : mergeQuery[queryKey as keyof typeof mergeQuery],
            }),
            {},
          )
        : {};
      const finalQuery = { ...mergeQuery, ...formatQuery };
      return getParamsObject({
        searchParams: new URLSearchParams(
          Object.entries(finalQuery).map(([k, v]) => {
            let stringValue: string;
            if (typeof v === 'string') {
              stringValue = v;
            } else if (v === null || v === undefined) {
              stringValue = '';
            } else if (typeof v === 'object') {
              stringValue = JSON.stringify(v);
            } else {
              stringValue = String(v);
            }
            return [k, stringValue];
          }),
        ),
      });
    })();
    setSearchParams(paramsToSet as Record<string, string>);
  },
  /**
   * 生成排序列参数接口
   */
  generateSortColumn: ({
    sorter,
    sortFieldMap,
  }: {
    sorter: SorterInfo;
    sortFieldMap: { [key: string]: string };
  }) => ({
    column:
      sortFieldMap[sorter.field as string] || snakeCase(sorter.field as string),
    desc: sorter.direction === 'descend',
  }),
  /**
   * 生成排序请求
   * @param sorters
   * @param sorter
   * @param sortFieldMap
   */
  generateSortRequest: ({
    sorters,
    sorter,
    sortFieldMap = {},
    supportSortColumns,
  }: {
    sorter: SorterInfo;
    sorters: SorterInfo[];
    sortFieldMap?: Record<string, string>;
    supportSortColumns?: boolean;
  }) => {
    if ((sorters && sorters.length > 0) || supportSortColumns) {
      if (supportSortColumns && !isEmpty(sorter)) {
        return {
          sortColumns: [
            CustomTableUtil.generateSortColumn({ sorter, sortFieldMap }),
          ],
        };
      }
      // 多列排序
      const sortColumns: SortColumn[] = sorters.map((sorter) => ({
        field:
          'field' in sorter && typeof sorter.field === 'string'
            ? sorter.field
            : 'unknown',
        direction: sorter.direction === 'descend' ? 'desc' : 'asc',
      }));

      return { sortColumns };
    } else if (sorter && !isEmpty(sorter)) {
      // 单列排序
      return {
        sortColumn: CustomTableUtil.generateSortColumn({
          sorter,
          sortFieldMap,
        }),
      };
    } else {
      return {}; // 如果 sorters 为空且 sorter 也为空，则返回空对象
    }
  },
};

export { CustomTableUtil };
