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

import type {
  BaseQuery,
  BaseRecord,
  PluginBaseConfig,
} from '@/custom-table/types';
import type { CustomTablePluginProps } from '@/custom-table/types/plugins/core';
/**
 * 表格列管理插件类型定义
 */
import type { ColumnProps } from '@arco-design/web-react/es/Table';

/**
 * 扩展的 PluginProps，包含列管理需要的属性
 */
export interface TableColumnsPluginProps<
  RecordType extends BaseRecord = BaseRecord,
  QueryType extends BaseQuery = BaseQuery,
> extends CustomTablePluginProps<RecordType, QueryType> {
  handleColumns?: (props: Record<string, unknown>) => ColumnProps<RecordType>[];
  handleColumnsProps?: Record<string, unknown>;
  initFilters?: Record<string, unknown>;
}

/**
 * 表格列配置
 */
export interface TableColumnsConfig extends PluginBaseConfig {
  enableColumnVisibility?: boolean;
  enableColumnResize?: boolean;
  enableColumnReorder?: boolean;
  enableAutoWidth?: boolean;
  RecordType?: BaseRecord;
  QueryType?: BaseQuery;
}

/**
 * 列配置项
 */
export interface ColumnItem<RecordType = Record<string, unknown>>
  extends Omit<ColumnProps<RecordType>, 'fixed'> {
  key: string;
  visible?: boolean;
  width?: number | string;
  fixed?: 'left' | 'right';
  order?: number;
  customRender?: boolean;
}

/**
 * 表格列状态
 */
export interface TableColumnsState<RecordType = Record<string, unknown>> {
  columns: ColumnItem<RecordType>[];
  visibleColumns: ColumnItem<RecordType>[];
  columnSettings: Record<
    string,
    {
      visible: boolean;
      width?: number | string;
      fixed?: boolean | 'left' | 'right';
      order?: number;
    }
  >;
}

/**
 * 表格列方法
 */
export interface TableColumnsMethods<RecordType = Record<string, unknown>> {
  setColumnVisible: (key: string, visible: boolean) => void;
  setColumnWidth: (key: string, width: number | string) => void;
  setColumnFixed: (key: string, fixed: boolean | 'left' | 'right') => void; // 兼容 Arco Design 的类型
  setColumnOrder: (key: string, order: number) => void;
  resetColumns: () => void;
  getColumns: () => ColumnItem<RecordType>[];
}
