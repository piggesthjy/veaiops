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

import type { PluginBaseConfig } from '@/custom-table/types';
/**
 * 表格排序插件类型定义
 */
import type { SorterInfo } from '@arco-design/web-react/es/Table/interface';

/**
 * 排序配置
 */
export interface TableSortingConfig extends PluginBaseConfig {
  defaultSorterField?: string;
  defaultSorterDirection?: 'ascend' | 'descend';
  multiSorter?: boolean;
  remoteSorting?: boolean;
  sortFieldMap?: Record<string, string>;
}

/**
 * 排序状态
 */
export interface TableSortingState {
  sorter: SorterInfo | SorterInfo[];
  sortFieldMap: Record<string, string>;
}

/**
 * 排序方法
 */
export interface TableSortingMethods {
  setSorter: (sorter: SorterInfo | SorterInfo[]) => void;
  resetSorter: () => void;
  getSorterParam: () => Record<string, string | number>;
}
