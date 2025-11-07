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
 * 表格配置 Hook 相关类型定义
 */
import type { PaginationProps } from '@arco-design/web-react/es/Pagination/pagination';
import type { BaseQuery, BaseRecord } from '../core';
// 使用相对路径避免跨层级导入（遵循 .cursorrules 规范）
import type { ColumnItem } from '../plugins/table-columns';

/**
 * useTableConfig Hook Props
 */
export interface TableConfigOptions<
  RecordType extends BaseRecord = BaseRecord,
  QueryType extends BaseQuery = BaseQuery,
> {
  /** 基础列配置 */
  baseColumns?: ColumnItem<RecordType>[];
  /** 处理列的函数 */
  handleColumns?: (props: Record<string, unknown>) => ColumnItem<RecordType>[];
  /** 列处理函数的额外参数 */
  handleColumnsProps?: Record<string, unknown>;
  /** 查询参数 */
  query?: QueryType;
  /** 是否启用列管理 */
  enableColumnManagement?: boolean;
  /** 是否启用筛选 */
  enableFilter?: boolean;
  /** 是否启用排序 */
  enableSorting?: boolean;
  /** 是否启用分页 */
  enablePagination?: boolean;
}

/**
 * 表格特性配置类型
 */
export interface TableFeaturesConfig {
  /** 列管理是否启用 */
  columnManagement?: boolean;
  /** 筛选是否启用 */
  filter?: boolean;
  /** 排序是否启用 */
  sorting?: boolean;
  /** 分页是否启用 */
  pagination?: boolean;
  /** 其他特性配置 */
  [key: string]: boolean | undefined;
}

/**
 * useTableConfig Hook 返回值
 */
export interface TableConfigResult<RecordType extends BaseRecord = BaseRecord> {
  // 处理后的列配置
  columns: ColumnItem<RecordType>[];

  // 表格属性
  tableProps: {
    columns: ColumnItem<RecordType>[];
    loading?: boolean;
    pagination?: PaginationProps | boolean;
    onChange?: (page: number, pageSize: number) => void;
  };

  // 分页配置
  paginationConfig: PaginationProps | boolean;

  // 特性配置
  features: TableFeaturesConfig;

  // 配置信息
  config: {
    enableColumnManagement: boolean;
    enableFilter: boolean;
    enableSorting: boolean;
    enablePagination: boolean;
  };

  // 更新配置
  updateConfig: (newConfig: Partial<TableConfigOptions<RecordType>>) => void;
}
