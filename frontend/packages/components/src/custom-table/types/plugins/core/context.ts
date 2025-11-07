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
 * 插件上下文和Props类型定义
 */

import type { PaginationProps } from '@arco-design/web-react/es/Pagination/pagination';
import type { ColumnProps } from '@arco-design/web-react/es/Table/interface';
import type { BaseQuery, BaseRecord } from '@veaiops/types';
import type { ReactNode } from 'react';
import type { ArcoScrollConfig } from './base';
import type { CustomTableHelpers, CustomTableState } from './state';

/**
 * 插件props类型
 */
export interface CustomTablePluginProps<
  RecordType extends BaseRecord = BaseRecord,
  QueryType extends BaseQuery = BaseQuery,
> {
  finalQuery: QueryType;
  baseColumns: ColumnProps<RecordType>[];
  configs: Record<string, unknown>;
  // 基础表格属性
  rowKey?: string | ((record: RecordType) => string);
  dataSource?: RecordType[];
  loading?: boolean;
  pagination?: PaginationProps | boolean;
  scroll?: ArcoScrollConfig;
  size?: 'mini' | 'small' | 'default' | 'large';
  border?: boolean;
  children?: ReactNode;

  // 标题相关配置
  title?: ReactNode;
  titleClassName?: string;
  titleStyle?: React.CSSProperties;
  actions?: ReactNode;

  // 表格核心配置
  tableProps?: Partial<Omit<any, 'columns' | 'data'>>;
  tableClassName?: string;

  // 加载状态相关配置
  useCustomLoading?: boolean;
  loadingTip?: string;
  customLoading?: boolean;

  // 过滤器和Alert相关配置
  showReset?: boolean;
  isAlertShow?: boolean;
  alertType?: 'info' | 'success' | 'warning' | 'error';
  alertContent?: ReactNode;
  customAlertNode?: ReactNode;

  // 自定义渲染配置
  customRender?: {
    table?: (table: ReactNode) => ReactNode;
    footer?: (props: {
      hasMoreData: boolean;
      needContinue?: boolean;
      onLoadMore: () => void;
    }) => ReactNode;
    [key: string]: unknown;
  };
}

/**
 * 插件上下文类型（支持 Props 泛型，从源头提升类型精度）
 *
 * 第三个泛型 PProps 默认采用 CustomTablePluginProps<RecordType, QueryType>，
 * 这样现有插件无需改动；需要自定义扩展 Props 的插件可在使用处传入专用类型。
 */
export interface PluginContext<
  RecordType extends BaseRecord = BaseRecord,
  QueryType extends BaseQuery = BaseQuery,
  PProps = CustomTablePluginProps<RecordType, QueryType>,
> {
  readonly props: PProps;
  readonly state: CustomTableState<RecordType, QueryType>;
  readonly helpers: CustomTableHelpers<RecordType, QueryType>;
  readonly methods?: Record<string, unknown>;
  plugins?: Record<string, unknown>;
}
