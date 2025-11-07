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

import type { ModuleType } from '@/types/module';
import { CustomTable } from '@veaiops/components';
import type { SubscribeRelationWithAttributes } from 'api-generate';
import type React from 'react';
import { getSubscribeRelationFilters } from './filters';
import { useTableColumns } from './table-columns';
import {
  useSubscribeRelationActionConfig,
  useSubscribeRelationTableConfig,
} from './use-relation-table';

/**
 * 订阅关系表格组件属性接口
 */
export interface SubscribeRelationTableProps {
  moduleType: ModuleType;
  title?: string;
  showModuleTypeColumn?: boolean;
  customActions?: (record: SubscribeRelationWithAttributes) => React.ReactNode;
  onCreate: () => void;
  onEdit: (record: SubscribeRelationWithAttributes) => void;
  onDelete: (recordId: string) => void;
  onRefresh: () => void;
  loading?: boolean;
}

/**
 * 订阅关系表格组件
 * 封装表格的渲染逻辑，提供清晰的接口
 */
export const SubscribeRelationTable: React.FC<SubscribeRelationTableProps> = ({
  moduleType,
  title = '订阅关系',
  showModuleTypeColumn = true,
  customActions,
  onCreate,
  onEdit,
  onDelete,
  onRefresh,
  loading = false,
}) => {
  // 表格配置
  const { dataSource, tableProps } = useSubscribeRelationTableConfig({
    moduleType,
  });

  // 操作按钮配置
  const { actions: actionButtons } = useSubscribeRelationActionConfig({
    onCreate,
    onRefresh,
    loading,
  });

  // 获取表格列配置
  const columns = useTableColumns({
    showModuleTypeColumn,
    customActions,
    onEdit,
    onDelete,
  });

  return (
    <CustomTable
      // 表格标题
      title={title}
      // 数据源配置
      dataSource={dataSource}
      // 基础列配置
      baseColumns={columns}
      // 过滤器处理函数
      handleFilters={getSubscribeRelationFilters}
      // 使用Hook返回的表格属性配置
      tableProps={tableProps}
      // 操作按钮
      actions={actionButtons}
      // 表格样式
      tableClassName="subscribe-relation-table"
    />
  );
};
