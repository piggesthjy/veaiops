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
 * CustomTable React Context
 */

import type {
  ColumnProps,
  SorterInfo,
} from '@arco-design/web-react/es/Table/interface';
import type { BaseQuery, BaseRecord, PluginContext } from '@veaiops/types';
import { createContext } from 'react';

/**
 * CustomTable的React Context
 * 用于在组件树中传递插件上下文
 * 使用协变的PluginContext类型，支持任意扩展的泛型参数
 */
// 为了解决泛型协变问题，使用更宽泛的Context类型
// 支持任意扩展的Record和Query类型
// 🐛 修复React 18 Context.Consumer.Provider警告
// 使用具体的默认值而不是null，避免Context类型推断问题
const defaultContextValue: PluginContext<BaseRecord, BaseQuery> = {
  props: {
    finalQuery: {},
    baseColumns: [],
    configs: {},
  },
  state: {
    current: 1,
    pageSize: 10,
    query: {},
    sorter: {} as SorterInfo,
    filters: {},
    loading: false,
    formattedTableData: [],
    tableTotal: 0,
    tableColumns: [],
    selectedRowKeys: [],
  },
  helpers: {
    setCurrent: (_current: number) => {
      // 设置当前页码
    },
    setPageSize: (_pageSize: number) => {
      // 设置每页大小
    },
    setQuery: (_query: BaseQuery) => {
      // 设置查询条件
    },
    setFilters: (_filters: Record<string, (string | number)[]>) => {
      // 设置过滤条件
    },
    setSorter: (_sorter: SorterInfo) => {
      // 设置排序条件
    },
    setLoading: (_loading: boolean) => {
      // 设置加载状态
    },
    setFormattedTableData: (_data: BaseRecord[]) => {
      // 设置格式化后的表格数据
    },
    setTableTotal: (_total: number) => {
      // 设置表格总数
    },
    setTableColumns: (_columns: ColumnProps<BaseRecord>[]) => {
      // 设置表格列
    },
    setSelectedRowKeys: (_keys: (string | number)[]) => {
      // 设置选中的行键
    },
  },
};

export const CustomTableContext =
  createContext<PluginContext>(defaultContextValue);
