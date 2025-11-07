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
 * CustomTable 实例 API Hook
 * 基于 pro-components 优秀设计模式重构 - 模块化架构
 *

 * @date 2025-12-19
 */
import type {
  BaseRecord,
  CustomTableHelpers,
  PluginContext,
  PluginManager,
} from '@/custom-table/types';
import type { CustomTableActionType } from '@/custom-table/types/api/action-type';
import type { BaseQuery, RequestManager } from '@/custom-table/types/core';
import { createRequestManager } from '@/custom-table/types/core';
import { resetLogCollector } from '@/custom-table/utils/reset-log-collector';
import type { SorterInfo } from '@arco-design/web-react/es/Table/interface';
import { useCallback, useImperativeHandle, useRef } from 'react';
import {
  createDataActions,
  createExpandActions,
  createFilterActions,
  createPaginationActions,
  createSelectionActions,
  createStateActions,
  createUtilityActions,
} from './imperative';

/**
 * @name 创建实例 API 处理 Hook
 * @description 基于 pro-components ActionRef 设计模式，提供完整的表格操作 API
 */
const useCustomTableImperativeHandle = <
  RecordType extends BaseRecord = BaseRecord,
  QueryType extends BaseQuery = BaseQuery,
>(
  ref: React.Ref<CustomTableActionType<RecordType, QueryType>>,
  context: PluginContext<RecordType, QueryType>,
  state: {
    formattedTableData: RecordType[];
    filters: Record<string, (string | number)[]>;
    sorter: SorterInfo;
    current: number;
    pageSize: number;
    tableTotal: number;
  },
  pluginManager: PluginManager,
) => {
  const { formattedTableData, filters, sorter, current, pageSize, tableTotal } =
    state;

  /** @name 请求管理器，用于取消进行中的请求 */
  const requestManagerRef = useRef<RequestManager>(createRequestManager());

  /** @name 获取当前请求管理器 */
  const getRequestManager = useCallback(() => requestManagerRef.current, []);

  // 创建各功能模块的操作方法
  const dataActions = createDataActions(
    context,
    formattedTableData,
    getRequestManager,
  );
  const paginationActions = createPaginationActions(context, {
    current,
    pageSize,
    tableTotal,
  });
  const selectionActions = createSelectionActions(context, formattedTableData);
  const filterActions = createFilterActions(context, { filters, sorter });
  const stateActions = createStateActions(context);
  const expandActions = createExpandActions(context, formattedTableData);
  const utilityActions = createUtilityActions(
    context,
    formattedTableData,
    pluginManager,
    getRequestManager,
  );

  useImperativeHandle(
    ref,
    () => ({
      // 数据操作模块
      ...dataActions,

      // 分页操作模块
      ...paginationActions,

      // 选择操作模块
      ...selectionActions,

      // 筛选和查询操作模块
      ...filterActions,

      // 状态操作模块
      ...stateActions,

      // 展开操作模块
      ...expandActions,

      // 工具操作模块
      ...utilityActions,

      // 插件操作
      executePlugin: ({
        pluginName,
        methodName,
        args = [],
      }: { pluginName: string; methodName: string; args?: unknown[] }) => {
        // 通过插件管理器执行插件方法
        const pluginManager = context?.plugins;
        if (
          pluginManager &&
          typeof pluginManager === 'object' &&
          'use' in pluginManager
        ) {
          return (
            pluginManager as {
              use: (params: {
                pluginName: string;
                method: string;
                args?: unknown[];
              }) => unknown;
            }
          ).use({ pluginName, method: methodName, args });
        }
        return undefined;
      },
      renderPlugin: ({
        pluginName,
        renderer,
        args = [],
      }: { pluginName: string; renderer: string; args?: unknown[] }) => {
        // 通过插件管理器渲染插件内容
        const pluginManager = context?.plugins;
        if (
          pluginManager &&
          typeof pluginManager === 'object' &&
          'render' in pluginManager
        ) {
          return (
            pluginManager as {
              render: (params: {
                pluginName: string;
                renderer: string;
                args?: unknown[];
              }) => unknown;
            }
          ).render({ pluginName, renderer, args }) as React.ReactNode;
        }
        return null;
      },

      // 状态访问
      state: context.state,
      helpers: context.helpers as unknown as CustomTableHelpers<
        RecordType,
        QueryType
      >,

      // 数据快照访问
      formattedTableData,
      loading: context.state.loading,
      current,
      pageSize,
      total: tableTotal,
      filters,
      sorter,

      // 缺失的方法
      setExpandedRowKeys: (keys: (string | number)[]) =>
        context.helpers.setExpandedRowKeys?.(keys),
      selectAll: () => {
        // 全选所有行
        const allRowKeys = formattedTableData.map((_, index) =>
          index.toString(),
        );
        context.helpers.setSelectedRowKeys?.(allRowKeys);
      },
      invertSelection: () => {
        // 反选当前选中行
        const currentSelected = context.state.selectedRowKeys || [];
        const allRowKeys = formattedTableData.map((_, index) =>
          index.toString(),
        );
        const invertedKeys = allRowKeys.filter(
          (key) => !currentSelected.includes(key),
        );
        context.helpers.setSelectedRowKeys?.(invertedKeys);
      },
      clearFilters: () => context.helpers.setFilters({}),
      applyFilters: () => {
        // 应用当前过滤器
        context.helpers.setFilters?.(context.state.filters || {});
      },
      clearSorter: () => context.helpers.resetSorter?.(),
      setQuery: (query: QueryType | ((prev: QueryType) => QueryType)) =>
        context.helpers.setQuery(query),
      getQuery: () => context.state.query || ({} as QueryType),
      resetQuery: () => context.helpers.resetQuery?.(),
      mergeQuery: (query: Partial<QueryType>) =>
        context.helpers.setQuery((prev: QueryType) => ({
          ...prev,
          ...query,
        })),
      getSelectedData: () => selectionActions.getSelectedRows(),

      // 数据源操作
      setDataSource: (_dataSource: RecordType[]) => {
        // 设置数据源的实现
        // 临时实现，直接设置数据
      },

      // 日志导出功能
      exportResetLogs: () => {
        resetLogCollector.exportResetLogs();
      },
      getResetLogStats: () => {
        return resetLogCollector.getStats();
      },
    }),
    [
      dataActions,
      paginationActions,
      selectionActions,
      filterActions,
      stateActions,
      expandActions,
      utilityActions,
      getRequestManager,
      context.helpers,
      context?.plugins,
      context.state,
      current,
      filters,
      formattedTableData,
      pageSize,
      sorter,
      tableTotal,
    ],
  );
};

export { useCustomTableImperativeHandle as useImperativeHandle };
