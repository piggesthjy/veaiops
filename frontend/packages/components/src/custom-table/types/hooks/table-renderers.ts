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
 * 表格渲染器 Hook 相关类型定义
 */
import type { PaginationProps } from '@arco-design/web-react/es/Pagination/pagination';
import type { SorterInfo } from '@arco-design/web-react/es/Table/interface';
import type React from 'react';
import type { BaseQuery, BaseRecord } from '../core';

/**
 * 表格渲染器配置
 */
export interface TableRenderers {
  /** @name 无数据元素渲染器 */
  noDataElement?: React.ComponentType<{
    error?: Error;
    loading?: boolean;
    dataSource?: Record<string, unknown>[];
  }>;

  /** @name 加载元素渲染器 */
  loadingElement?: React.ComponentType<{
    loading?: boolean;
    tip?: string;
  }>;

  /** @name 错误元素渲染器 */
  errorElement?: React.ComponentType<{
    error?: Error;
    retry?: () => void;
  }>;

  /** @name 工具栏渲染器 */
  toolbarRenderer?: React.ComponentType<{
    selectedRowKeys?: (string | number)[];
    actions?: Record<string, (...args: unknown[]) => void>;
  }>;

  /** @name 表格标题渲染器 */
  titleRenderer?: React.ComponentType<{
    title?: React.ReactNode;
    actions?: React.ReactNode[];
  }>;

  /** @name 表格页脚渲染器 */
  footerRenderer?: React.ComponentType<{
    dataSource?: Record<string, unknown>[];
    pagination?: PaginationProps | boolean;
  }>;

  /** @name 表格警告渲染器 */
  alertRenderer?: React.ComponentType<{
    message?: React.ReactNode;
    type?: 'info' | 'success' | 'warning' | 'error';
    showIcon?: boolean;
    closable?: boolean;
    onClose?: () => void;
  }>;
}

/**
 * 渲染器上下文
 */
export interface RenderContext<RecordType extends BaseRecord = BaseRecord> {
  /** 表格数据 */
  dataSource: RecordType[];
  /** 加载状态 */
  loading: boolean;
  /** 错误信息 */
  error: Error | null;
  /** 选中的行键 */
  selectedRowKeys: (string | number)[];
  /** 展开的行键 */
  expandedRowKeys: (string | number)[];
  /** 分页信息 */
  pagination: PaginationProps | boolean;
  /** 筛选器 */
  filters: Record<string, (string | number)[]>;
  /** 排序器 */
  sorter: SorterInfo;
  /** 查询参数 */
  query: BaseQuery;
  /** 表格操作 */
  actions: Record<string, (...args: unknown[]) => void>;
}

/**
 * 自定义渲染器
 */
export interface CustomRenderer<T = Record<string, unknown>> {
  /** 渲染函数 */
  render: (context: RenderContext & T) => React.ReactNode;
  /** 渲染条件 */
  condition?: (context: RenderContext & T) => boolean;
  /** 优先级 */
  priority?: number;
  /** 是否缓存 */
  cache?: boolean;
}
