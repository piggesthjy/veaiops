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

import type { BaseQuery, BaseRecord } from '@/custom-table/types';
import type { PaginationProps } from '@arco-design/web-react';
import type { ColumnProps } from '@arco-design/web-react/es/Table';

/**
 * 表格渲染配置参数类型
 */
export interface TableRenderConfig<RecordType extends BaseRecord = BaseRecord> {
  /** 表格样式配置 */
  style: {
    className: string;
    rowKey: string | ((record: RecordType) => React.Key);
  };

  /** 列配置 */
  columns: {
    baseColumns: ColumnProps<RecordType>[];
  };

  /** 数据配置 */
  data: {
    formattedData: RecordType[];
    total: number;
    emptyStateElement: React.ReactNode;
  };

  /** 分页配置 */
  pagination: {
    current: number;
    pageSize: number;
    config: PaginationProps | boolean;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
  };

  /** 加载状态配置 */
  loading: {
    isLoading: boolean;
    useCustomLoader: boolean;
  };
}

export type { BaseRecord, BaseQuery };
