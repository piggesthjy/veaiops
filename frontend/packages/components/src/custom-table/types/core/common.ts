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

import type { ModernTableColumnProps } from '@/shared/types';
/**
 * CustomTable 核心通用类型定义
 * 基于 Arco Design Table 的类型系统
 */
import type {
  RowSelectionProps as ArcoRowSelectionProps,
  SorterInfo as ArcoSorterInfo,
  TableProps as ArcoTableProps,
  SorterFn,
} from '@arco-design/web-react/es/Table/interface';
import type { BaseQuery, BaseRecord } from '@veaiops/types';
import type {
  AlertTypeEnum,
  ColumnFixedEnum,
  LifecyclePhaseEnum,
  PluginPriorityEnum,
  PluginStatusEnum,
  SortDirectionEnum,
  TableActionEnum,
  TableFeatureEnum,
} from './enums';

// Import base types from @veaiops/types to avoid duplication

// 重新导出 ModernTableColumnProps 供其他模块使用
export type { ModernTableColumnProps } from '@/shared/types';
export type { BaseRecord, BaseQuery };

/**
 * 标准查询接口（可选使用）
 * @description 提供标准的查询字段定义，用于通用组件
 */
export interface StandardQuery {
  // 前端分页参数（兼容 Arco Table）
  pageSize?: number;
  current?: number;

  // bam-service 分页参数 - 使用 skip/limit 格式
  page_req?: {
    skip: number;
    limit: number;
  };

  // 通用过滤和排序参数
  filters?: Record<string, FilterValue>;
  sortColumns?: Array<{
    column: string;
    direction: 'ASC' | 'DESC';
  }>;
}

/**
 * 过滤器值类型
 */
export type FilterValue = string | number | boolean | null | undefined;

/**
 * 查询参数值类型
 * @description 支持所有可能的查询参数值类型
 */
export type QueryValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Array<string | number | boolean>
  | Record<string, unknown>;

/**
 * React Key 类型
 */
export type Key = string | number;

/**
 * 查询格式化函数类型
 * @description 查询参数格式化函数的参数接口
 */
export interface QueryFormatParams {
  /**
   * 前一个值（用于累积处理）
   */
  pre: unknown;
  /**
   * 当前值
   */
  value: unknown;
}

// 泛型的查询格式化函数类型，支持自定义参数类型
export type QueryFormatFunction = (params: {
  pre: unknown;
  value: unknown;
}) => unknown;

// 基础查询格式化函数类型（向后兼容）
export type BaseQueryFormatFunction = QueryFormatFunction;

// 灵活的查询格式化对象类型，支持不同参数类型的格式化函数
export type QueryFormat = Record<string, QueryFormatFunction>;

/**
 * 分页请求参数
 */
export interface PageReq {
  skip: number;
  limit: number;
}

/**
 * 处理过滤器属性参数
 */
export interface HandleChangeSingleParams {
  key: string;
  value?: unknown;
}

export interface HandleChangeObjectParams {
  updates: Record<string, unknown>;
}

export interface HandleFilterProps<QueryType = BaseQuery> {
  query: QueryType;
  handleChange: (
    params: HandleChangeSingleParams | HandleChangeObjectParams,
  ) => void;
  handleFiltersProps?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * 服务请求类型约束
 * @description 服务实例的类型约束，支持泛型配置和方法调用
 * 说明：保持对象约束以适配更精准的服务类型（如 LocationService<Config>）
 * 要求仅为"对象"，具体方法签名由 serviceMethod: keyof ServiceType 保证
 */
export type ServiceRequestType = object;

/**
 * 处理成功响应类型
 */
export interface OnSuccessResponse<
  RecordType = BaseRecord,
  QueryType = BaseQuery,
> {
  query: QueryType;
  v: RecordType[];
  extra?: Record<string, unknown>;
  isQueryChange: boolean;
}

/**
 * 处理过程类型
 */
export interface OnProcessType {
  run: () => void;
  stop: () => void;
  resetQuery: (params?: { resetEmptyData?: boolean }) => void;
}

/**
 * 过滤器属性类型
 */
export type FiltersProps = Record<string, (string | number)[]>;

/**
 * 格式化表格数据配置
 */
export interface FormTableDataProps<RecordType = BaseRecord> {
  sourceData: RecordType[];
  addRowKey?: (item: RecordType, index: number) => string | number;
  arrayFields?: string[];
  formatDataConfig?: Record<string, (item: RecordType) => unknown>;
}

/**
 * 扩展的表格属性
 */
export interface ExtendedTableProps<RecordType = BaseRecord>
  extends Omit<ArcoTableProps<RecordType>, 'columns'> {
  columns?: ModernTableColumnProps<RecordType>[];
}

/**
 * 扩展的排序信息
 */
export interface ExtendedSorterInfo extends ArcoSorterInfo {
  sorterFn?: SorterFn;
  priority?: number;
}

/**
 * 扩展的行选择属性
 */
export interface ExtendedRowSelectionProps<RecordType = BaseRecord>
  extends ArcoRowSelectionProps<RecordType> {
  checkStrictly?: boolean;
  preserveSelectedRowKeys?: boolean;
}

/**
 * 表格尺寸类型
 */
export type TableSize = 'default' | 'middle' | 'small' | 'mini';

/**
 * 表格边框配置
 */
export type TableBorder =
  | boolean
  | {
      wrapper?: boolean;
      headerCell?: boolean;
      bodyCell?: boolean;
      cell?: boolean;
    };

/**
 * 滚动配置
 */
export interface ScrollConfig {
  x?: number | string | boolean;
  y?: number | string | boolean;
}

/**
 * 排序方向（基于枚举）
 */
export type SortDirection = SortDirectionEnum;

/**
 * 表格位置
 */
export type TablePosition =
  | 'br'
  | 'bl'
  | 'tr'
  | 'tl'
  | 'topCenter'
  | 'bottomCenter';

/**
 * 表格操作类型（基于枚举）
 */
export type TableActionType = TableActionEnum;

/**
 * 列固定位置类型（基于枚举）
 */
export type ColumnFixed = ColumnFixedEnum;

/**
 * 提示类型（基于枚举）
 */
export type AlertType = AlertTypeEnum;

/**
 * 插件优先级类型（基于枚举）
 */
// PluginPriority 已从 enums.ts 导出，此处移除避免重复

/**
 * 插件状态类型（基于枚举）
 */
// PluginStatus 已从 enums.ts 导出，此处移除避免重复

/**
 * 生命周期阶段类型（基于枚举）
 */
// LifecyclePhase 已从 enums.ts 导出，此处移除避免重复

/**
 * 表格特性类型（基于枚举）
 */
export type TableFeature = TableFeatureEnum;

/**
 * 表格特性配置（基于现有源码的实际属性名）
 */
export interface FeatureConfig {
  enablePagination: boolean;
  enableSorting: boolean;
  enableFilter: boolean; // 注意：现有源码中使用的是 enableFilter 而不是 enableFiltering
  enableSelection: boolean; // 注意：现有源码中使用的是 enableSelection 而不是 enableRowSelection
  enableColumnResize: boolean;
  enableFullScreen: boolean;
}
