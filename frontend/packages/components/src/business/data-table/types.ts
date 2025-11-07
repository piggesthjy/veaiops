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

import type { TableProps } from '@arco-design/web-react';
import type { ReactNode } from 'react';

/**
 * 列配置接口
 */
export interface ColumnConfig<T = any> {
  /** 列标题 */
  title: string;
  /** 数据字段 */
  dataIndex?: keyof T;
  /** 列宽度 */
  width?: number;
  /** 是否可排序 */
  sortable?: boolean;
  /** 是否可筛选 */
  filterable?: boolean;
  /** 自定义渲染 */
  render?: (value: any, record: T, index: number) => ReactNode;
  /** 列对齐方式 */
  align?: 'left' | 'center' | 'right';
  /** 是否固定列 */
  fixed?: 'left' | 'right';
  /** 是否可调整宽度 */
  resizable?: boolean;
}

/**
 * 操作按钮配置
 */
export interface ActionConfig<T = any> {
  /** 按钮文本 */
  text: string;
  /** 按钮类型 */
  type?: 'primary' | 'secondary' | 'outline' | 'text';
  /** 按钮状态 */
  status?: 'default' | 'warning' | 'danger' | 'success';
  /** 图标 */
  icon?: ReactNode;
  /** 点击事件 */
  onClick: (record: T, index: number) => void;
  /** 是否显示 */
  visible?: (record: T) => boolean;
  /** 是否禁用 */
  disabled?: (record: T) => boolean;
  /** 确认提示 */
  confirm?: {
    title: string;
    content?: string;
  };
}

/**
 * 分页配置
 */
export interface PaginationConfig {
  /** 当前页 */
  current?: number;
  /** 每页条数 */
  pageSize?: number;
  /** 总条数 */
  total?: number;
  /** 是否显示总数 */
  showTotal?: boolean;
  /** 是否显示快速跳转 */
  showJumper?: boolean;
  /** 是否可以改变每页条数 */
  sizeCanChange?: boolean;
  /** 每页条数选项 */
  pageSizeOptions?: number[];
  /** 页码改变回调 */
  onChange?: (page: number, pageSize: number) => void;
}

/**
 * 数据表格属性
 */
export interface DataTableProps<T = any>
  extends Omit<TableProps, 'columns' | 'data' | 'footer' | 'title'> {
  /** 表格数据 */
  data: T[];
  /** 列配置 */
  columns: ColumnConfig<T>[];
  /** 加载状态 */
  loading?: boolean;
  /** 分页配置 */
  pagination?: PaginationConfig | false;
  /** 操作列配置 */
  actions?: ActionConfig<T>[];
  /** 操作列标题 */
  actionTitle?: string;
  /** 操作列宽度 */
  actionWidth?: number;
  /** 是否显示序号列 */
  showIndex?: boolean;
  /** 序号列标题 */
  indexTitle?: string;
  /** 是否可选择行 */
  rowSelection?: {
    /** 选择类型 */
    type?: 'checkbox' | 'radio';
    /** 已选择的行 */
    selectedRowKeys?: (string | number)[];
    /** 选择改变回调 */
    onChange?: (
      selectedRowKeys: (string | number)[],
      selectedRows: T[],
    ) => void;
    /** 是否可选择 */
    checkboxProps?: (record: T) => { disabled?: boolean };
  };
  /** 行唯一标识字段 */
  rowKey?: string | ((record: T) => string);
  /** 空数据提示 */
  emptyText?: ReactNode;
  /** 表格尺寸 */
  size?: 'mini' | 'small' | 'default' | 'middle';
  /** 是否显示边框 */
  border?: boolean;
  /** 是否显示斑马纹 */
  stripe?: boolean;
  /** 表格标题 */
  title?: ReactNode;
  /** 表格底部 */
  footer?: ReactNode;
}
