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

import type { AffixProps } from '@arco-design/web-react/es/Affix/interface';
import type { PaginationProps } from '@arco-design/web-react/es/Pagination/pagination';
import type { TableProps } from '@arco-design/web-react/es/Table/interface';
import type { FormTableDataProps } from '@veaiops/utils';
import type Fetch from 'ahooks/lib/useRequest/src/Fetch';
import type {
  CSSProperties,
  Dispatch,
  Key,
  ReactNode,
  SetStateAction,
} from 'react';
import type { CustomTableColumnProps } from './components';
// FiltersProps 类型已移动到 filters/core/types
// import type { FiltersProps } from '../../../filters/core/types';
export interface FiltersProps {
  config?: unknown[];
  query?: Record<string, unknown>;
  showReset?: boolean;
  resetFilterValues?: (props: { resetEmptyData?: boolean }) => void;
  className?: string;
  wrapperClassName?: string;
  style?: CSSProperties;
  actions?: ReactNode[];
  [key: string]: unknown;
}
// 临时注释掉，避免导入错误
// import type { CustomFieldsProps } from '../../custom-fields';
type CustomFieldsProps<T = Record<string, unknown>> = Record<string, unknown>; // 临时泛型类型
// import { PluginConfig, ServiceRequestType } from '../../../../types';
// 临时注释，这些类型可能在别的地方定义或者不再需要
type PluginConfig = Record<string, unknown>;
type ServiceRequestType = Record<string, unknown>;

export type PageReq =
  | {
      page_req: {
        skip: number;
        limit: number;
      };
    }
  | {
      page_req: undefined;
    };

export interface OnProcessType<TData, TParams extends unknown[] = unknown[]> {
  run: Fetch<TData, TParams>['run'];
  stop: Fetch<TData, TParams>['cancel'];
  resetQuery: (props: { resetEmptyData?: boolean }) => void;
}

export interface QueryFormatValueProps {
  pre: unknown;
  value: unknown;
}

export type QueryFormat = Record<string, (v: QueryFormatValueProps) => unknown>;

export interface HandleFilterProps<QueryType> {
  query: QueryType;
  handleChange: (
    key: string,
    value: unknown,
    handleFilter?: () => Record<string, string[] | number[]>,
    ctx?: Record<string, unknown>,
  ) => void;
  handleFiltersProps: Record<string, unknown>;
}

export interface OnSuccessResponse<FormatRecordType> {
  query: Record<string, unknown>;
  v: Array<FormatRecordType>;
  extra: Record<string, unknown>;
  isQueryChange: boolean;
}

export type TableDataSource<
  ServiceType,
  RecordType,
  TParams extends unknown[] = unknown[],
  FormatRecordType = RecordType,
> = {
  dataList?: Array<FormatRecordType | RecordType>;
  serviceInstance?: ServiceType;
  serviceMethod?: keyof ServiceType;
  formatPayload?: (payload: Record<string, unknown>) => Record<string, unknown>;
  paginationConvert?: (req: PageReq) => Record<string, unknown>;
  scrollFetchData?: boolean;
  hasMoreData?: boolean;
  responseItemsKey?: string;
  payload?: Record<string, unknown>;
  isEmptyColumnsFilter?: boolean;
  isServerPagination?: boolean; // 默认为false，前端分页
  querySearchKey?: string; // 前端分页关键搜索key
  querySearchMatchKeys?: Array<keyof FormatRecordType>; // 前端分页搜索匹配字段列表
  ready?: boolean; // auto request
  manual?: boolean; // 手动发起请求
  isCancel?: boolean; // 手动取消
  onProcess?: (props: OnProcessType<FormatRecordType, TParams>) => void;
  onSuccess?: (props: OnSuccessResponse<FormatRecordType>) => void;
  onError?: () => void;
  onFinally?: () => void;
  pluginConfig?: PluginConfig;
  flattenData?: boolean;
} & Omit<FormTableDataProps<RecordType, FormatRecordType>, 'sourceData'>;

export type QuerySearchParamsFormat = Record<
  string,
  (v: { value: unknown }) => unknown
>;

export interface CustomTableProps<
  RecordType extends { [key: string]: unknown },
  QueryType extends { [key: string]: unknown },
  ServiceType extends ServiceRequestType,
  FormatRecordType extends { [key: string]: unknown } | undefined,
> {
  title?: string; // 标题
  titleClassName?: string; // table标题wrap样式
  titleStyle?: CSSProperties; // table标题wrap样式
  handleColumns: (
    props: Record<string, unknown>,
  ) => CustomTableColumnProps<FormatRecordType>[]; // 列处理函数
  handleColumnsProps?: Record<string, unknown>;
  handleFiltersProps?: Record<string, unknown>;
  syncQueryOnSearchParams?: boolean; // 同步query到searchParams
  pagination?: PaginationProps;
  rowKey?: string | ((record: FormatRecordType) => Key);
  isAlertShow?: boolean;
  isFilterShow?: boolean;
  isFilterEffective?: boolean;
  isFilterAffixed?: boolean;
  isContainerFullWidth?: boolean;
  isRenderWrapperFullWidth?: boolean;
  tableFilterProps?: FiltersProps;
  affixProps?: AffixProps;
  isPaginationInCache?: boolean;
  isEditable?: boolean;
  alertType?: 'info' | 'success' | 'warning' | 'error';
  alertContent?: ReactNode | string;
  handleFilters?: ({
    query,
    handleChange,
    handleFiltersProps,
  }: HandleFilterProps<QueryType>) => Array<Record<string, unknown>>;
  filterStyleCfg?: {
    isWithBackgroundAndBorder: boolean; // 是否选用默认背景色和border
  }; // filter样式配置
  filterResetKeys?: string[];
  tableClassName?: string;
  actions?: ReactNode[]; // 筛选项操作
  operations?: ReactNode[]; // filter中操作项
  initQuery?: Partial<QueryType> | Record<string, unknown>; // 表单查询参数
  initFilters?: Partial<QueryType> | Record<string, unknown>; // table筛选查询参数
  queryFormat?: QueryFormat;
  sortFieldMap?: Record<string, unknown>;
  dataSource: TableDataSource<
    ServiceType,
    RecordType,
    QueryType[],
    FormatRecordType
  >;
  customActions?: ReactNode[]; // 自定义操作
  customActionsStyle?: CSSProperties; // 自定义操作样式
  customReset?: (props: {
    resetEmptyData: boolean;
    setQuery: Dispatch<SetStateAction<QueryType>>;
  }) => void;
  tableFilterWrapperClassName?: string;
  tableProps?: Partial<TableProps<FormatRecordType>>;
  showReset?: boolean;
  onLoadingChange?: (loading: boolean) => void;
  onQueryChange?: ({ query }: { query: QueryType }) => void;
  isTableHeaderSticky?: boolean; // 表头吸顶
  tableHeaderStickyTopOffset?: number;
  useActiveKeyHook?: boolean; // 使用useActiveKeyHook
  querySearchParamsFormat?: QuerySearchParamsFormat;
  enableCustomFields?: boolean; // 启用自定义字段
  customFieldsProps?: Pick<
    CustomFieldsProps<FormatRecordType>,
    'disabledFields' | 'initialFields' | 'confirm' | 'value'
  >; // 自定义字段配置
  supportSortColumns?: boolean;
}
