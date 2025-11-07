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

import { PluginMethods, PluginNames } from '@/custom-table/constants';
import type { PluginContext, PluginManager } from '@/custom-table/types';
import type { PaginationProps } from '@arco-design/web-react';
import type { ColumnProps } from '@arco-design/web-react/es/Table';
import { logger } from '@veaiops/utils';
import type { BaseQuery, BaseRecord } from './table-renderer.types';

export interface GetProcessedColumnsParams<
  RecordType extends BaseRecord = BaseRecord,
  QueryType extends BaseQuery = BaseQuery,
> {
  pluginManager: PluginManager;
  context: PluginContext<RecordType, QueryType>;
  baseColumns: ColumnProps<RecordType>[];
}

export function getProcessedColumns<
  RecordType extends BaseRecord = BaseRecord,
  QueryType extends BaseQuery = BaseQuery,
>({
  pluginManager,
  context,
  baseColumns,
}: GetProcessedColumnsParams<
  RecordType,
  QueryType
>): ColumnProps<RecordType>[] {
  // ✅ 添加错误捕获和详细日志
  try {
    const pluginColumns = pluginManager.use({
      pluginName: PluginNames.TABLE_COLUMNS,
      method: PluginMethods.GET_COLUMNS,
      args: [context],
    });

    let columns: ColumnProps<RecordType>[];

    if (Array.isArray(pluginColumns)) {
      columns = pluginColumns as ColumnProps<RecordType>[];
    } else if (Array.isArray(baseColumns)) {
      columns = baseColumns;
    } else {
      columns = [];
    }

    return columns;
  } catch (error: unknown) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    // 使用 logger 记录错误（对象解构参数）
    logger.error({
      message: 'getProcessedColumns 失败',
      data: {
        error: errorObj.message,
        stack: errorObj.stack,
        errorObj,
        baseColumnsType: typeof baseColumns,
        baseColumnsIsArray: Array.isArray(baseColumns),
        baseColumnsLength: Array.isArray(baseColumns) ? baseColumns.length : 0,
        hasPluginManager: Boolean(pluginManager),
        hasContext: Boolean(context),
      },
      source: 'CustomTable',
      component: 'getProcessedColumns',
    });
    // 降级方案：返回 baseColumns 或空数组
    return Array.isArray(baseColumns) ? baseColumns : [];
  }
}

export interface BuildPaginationConfigParams<
  RecordType extends BaseRecord = BaseRecord,
  QueryType extends BaseQuery = BaseQuery,
> {
  pluginManager: PluginManager;
  context: PluginContext<RecordType, QueryType>;
  fallback: {
    current: number;
    pageSize: number;
    total: number;
    paginationConfig: PaginationProps | boolean;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
  };
}

export function buildPaginationConfig<
  RecordType extends BaseRecord = BaseRecord,
  QueryType extends BaseQuery = BaseQuery,
>({
  pluginManager,
  context,
  fallback,
}: BuildPaginationConfigParams<RecordType, QueryType>):
  | PaginationProps
  | boolean {
  const {
    current,
    pageSize,
    total,
    paginationConfig,
    onPageChange,
    onPageSizeChange,
  } = fallback;

  const configFromPlugin = pluginManager.use({
    pluginName: PluginNames.TABLE_PAGINATION,
    method: PluginMethods.GET_PAGINATION_CONFIG,
    args: [context],
  });

  if (configFromPlugin) {
    return configFromPlugin as PaginationProps | boolean;
  }

  // Unify pagination props naming for Arco Table/Pagination
  // Compose showTotal renderer: "第start-end条，共total条（pages页），pageSize条/页"
  interface RenderTotalParams {
    t: number;
    range?: [number, number];
  }

  const renderTotal = ({ t, range }: RenderTotalParams) => {
    const safeTotal = Number.isFinite(t) ? t : 0;
    const safePageSize =
      Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 10;
    const safeCurrent = Number.isFinite(current) && current > 0 ? current : 1;

    const pages =
      safePageSize > 0 ? Math.ceil((safeTotal || 0) / safePageSize) : 0;
    const start =
      range?.[0] ??
      (safeTotal > 0 && safePageSize > 0
        ? (safeCurrent - 1) * safePageSize + 1
        : 0);
    const end =
      range?.[1] ??
      (safePageSize > 0
        ? Math.min(safeCurrent * safePageSize, safeTotal || 0)
        : 0);
    return `第${start}-${end}条，共${safeTotal}条（${pages}页），${safePageSize}条/页`;
  };

  const base: PaginationProps = {
    current,
    pageSize,
    total,
    showTotal: renderTotal,
    // Correct Arco prop names
    showJumper: true,
    sizeCanChange: true,
    // Keep behavior consistent
    pageSizeChangeResetCurrent: false,
    onChange: onPageChange,
    onPageSizeChange,
    ...(typeof paginationConfig === 'object' && paginationConfig !== null
      ? paginationConfig
      : {}),
  } as PaginationProps;

  return base;
}
