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
 * 数据源连接表格组件
 */

import { Empty } from '@arco-design/web-react';
import { CustomTable } from '@veaiops/components';
import { createLocalDataSource } from '@veaiops/utils';
import type { Connect } from 'api-generate';
import type React from 'react';
import { useMemo } from 'react';
import {
  type DataSourceConnectionTableProps,
  TABLE_CONFIG,
} from '../../../connection/lib';
import { getTableColumns } from './table-columns';
import { getTableFilters } from './table-filters';

/**
 * 数据源连接表格组件
 */
export const ConnectionTable: React.FC<DataSourceConnectionTableProps> = ({
  type,
  connects,
  loading: _loading,
  selectedRowKeys = [],
  onSelectionChange,
  onRefresh: _onRefresh,
  onEdit,
  onDelete,
  onTest,
  onCreateMonitor,
}) => {
  // 创建 handleColumns 函数，传递操作回调给列配置
  const handleColumns = (_props: Record<string, unknown>) => {
    return getTableColumns({
      type,
      onEdit,
      onDelete,
      onTest,
      onCreateMonitor,
    });
  };

  // 创建 handleFilters 函数
  const handleFilters = () => {
    return getTableFilters({
      type,
      onFilter: () => {}, // 提供默认的 onFilter 函数
    });
  };

  // 创建空状态组件
  const emptyElement = (
    <div className="text-center py-10">
      <Empty />
    </div>
  );

  // 使用 createLocalDataSource 创建本地数据源
  const dataSource = useMemo(
    () => createLocalDataSource({ dataList: connects }),
    [connects],
  );

  return (
    <CustomTable<Connect>
      handleColumns={handleColumns}
      handleFilters={handleFilters}
      dataSource={dataSource}
      tableProps={{
        rowKey: '_id',
        pagination: {
          pageSize: TABLE_CONFIG.PAGE_SIZE,
          showTotal: true,
          showJumper: true,
          sizeCanChange: true,
        },
        scroll: { x: TABLE_CONFIG.SCROLL_X },
        size: 'default',
        noDataElement: emptyElement,
        border: {
          wrapper: true,
          cell: true,
        },
      }}
    />
  );
};

export default ConnectionTable;
