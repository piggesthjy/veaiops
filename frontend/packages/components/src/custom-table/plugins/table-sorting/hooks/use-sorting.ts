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

import type { TableSortingConfig } from '@/custom-table/types';
import type { SorterInfo } from '@arco-design/web-react/es/Table/interface';
import { isEmpty, snakeCase } from 'lodash-es';
/**
 * 表格排序Hook
 */
import { useCallback, useMemo, useState } from 'react';
import { DEFAULT_TABLE_SORTING_CONFIG } from '../config';

export interface UseSortingProps {
  initialSorter?: SorterInfo | SorterInfo[];
  sortFieldMap?: Record<string, string>;
  config?: TableSortingConfig;
}

export const useSorting = ({
  initialSorter = {} as SorterInfo,
  sortFieldMap = {},
  config = {},
}: UseSortingProps) => {
  const { multiSorter = false, remoteSorting = true } = {
    ...DEFAULT_TABLE_SORTING_CONFIG,
    ...config,
  };

  // 排序状态
  const [sorter, setSorter] = useState<SorterInfo | SorterInfo[]>(
    initialSorter,
  );

  // 合并字段映射
  const finalSortFieldMap = useMemo(
    () => ({ ...DEFAULT_TABLE_SORTING_CONFIG.sortFieldMap, ...sortFieldMap }),
    [sortFieldMap],
  );

  // 重置排序
  const resetSorter = useCallback(() => {
    setSorter({} as SorterInfo);
  }, []);

  // 生成排序参数
  const getSorterParam = useCallback(() => {
    if (isEmpty(sorter)) {
      return {};
    }

    if (!remoteSorting) {
      return {};
    }

    if (Array.isArray(sorter)) {
      // 多字段排序处理
      if (multiSorter) {
        return {
          SortColumns: sorter.map((item) => ({
            Column:
              finalSortFieldMap[item.field as string] ||
              snakeCase(item.field as string),
            Desc: item.direction === 'descend',
          })),
        };
      }
      // 如果不支持多字段排序但收到多字段，只使用第一个
      else if (sorter.length > 0) {
        return {
          SortColumn: {
            Column:
              finalSortFieldMap[sorter[0].field as string] ||
              snakeCase(sorter[0].field as string),
            Desc: sorter[0].direction === 'descend',
          },
        };
      }
    } else {
      // 单字段排序
      return {
        SortColumn: {
          Column:
            finalSortFieldMap[sorter.field as string] ||
            snakeCase(sorter.field as string),
          Desc: sorter.direction === 'descend',
        },
      };
    }

    return {};
  }, [sorter, finalSortFieldMap, multiSorter, remoteSorting]);

  // 排序变更处理
  const handleSorterChange = useCallback(
    (newSorter: SorterInfo | SorterInfo[]) => {
      setSorter(newSorter);
    },
    [],
  );

  return {
    sorter,
    setSorter: handleSorterChange,
    resetSorter,
    getSorterParam,
    sortFieldMap: finalSortFieldMap,
  };
};
