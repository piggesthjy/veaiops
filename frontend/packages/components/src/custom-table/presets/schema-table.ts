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
 * Schema Table 预设组件
 * @description 基于 Schema 配置的表格预设

 *
 */

import type { CustomTableProps } from '@/custom-table/types/components/props';
import type { ModernTableColumnProps } from '@/shared/types';
import type { PaginationProps } from '@arco-design/web-react/es/Pagination/pagination';

/**
 * Schema Table 预设配置
 */
export interface SchemaTableConfig<RecordType = Record<string, unknown>> {
  /** 表格标题 */
  title?: string;
  /** 数据源配置 */
  dataSource?: CustomTableProps['dataSource'];
  /** 列配置 */
  columns?: ModernTableColumnProps<RecordType>[];
  /** 分页配置 */
  pagination?: PaginationProps | boolean;
}

/**
 * Schema Table 预设组件
 * @param config 预设配置
 * @returns 预设组件配置
 */
export const createSchemaTablePreset = (config: SchemaTableConfig) => {
  const paginationConfig =
    typeof config.pagination === 'object' &&
    config.pagination !== null &&
    !Array.isArray(config.pagination)
      ? config.pagination
      : {};
  return {
    ...config,
    // 默认配置
    pagination: {
      pageSize: 10,
      ...paginationConfig,
    },
  };
};

/**
 * 默认 Schema Table 预设
 */
export const defaultSchemaTablePreset = createSchemaTablePreset({
  title: 'Schema Table',
  pagination: {
    pageSize: 10,
  },
});
