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

import { CellRender, type ModernTableColumnProps } from '@veaiops/components';
import { EMPTY_CONTENT } from '@veaiops/constants';
import type { DataSource, DataSourceType } from 'api-generate';
import type React from 'react';
import { createBaseConfigFields } from './lib/base-fields';
import { getSpecificFields } from './lib/specific-fields';

/**
 * 创建监控表格列配置
 *
 * 完整对齐 origin/feat/web-v2 分支（包含配置信息分组列）
 *
 * @param dataSourceType - 数据源类型
 * @returns 列配置数组
 */
export const createMonitorTableColumns = (
  dataSourceType: DataSourceType,
): ModernTableColumnProps<DataSource>[] => {
  // 解构 CellRender 组件
  const { CustomOutlineTag, Ellipsis, StampTime, InfoWithCode } =
    CellRender;

  // 基础配置字段（所有数据源都有）
  const baseConfigFields = createBaseConfigFields(dataSourceType);

  // 根据数据源类型添加特定字段
  const specificFields = getSpecificFields(dataSourceType);

  // 配置信息分组列
  const configColumn: ModernTableColumnProps<DataSource> = {
    title: '配置信息',
    children: [...baseConfigFields, ...specificFields],
  };

  return [
    {
      title: '数据源名称/ID',
      dataIndex: 'name',
      key: 'name',
      width: 250,
      fixed: 'left' as const,
      render: (name: string, record: DataSource) => (
        <InfoWithCode name={name || ''} code={record._id || ''} />
      ),
    },
    {
      title: '数据源类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      align: 'center' as const,
      render: (type: string) => {
        if (!type) {
          return EMPTY_CONTENT;
        }
        return <CustomOutlineTag>{type}</CustomOutlineTag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      align: 'center' as const,
      render: (isActive: boolean) => (
        <CustomOutlineTag>{isActive ? '已启动' : '未启动'}</CustomOutlineTag>
      ),
    },
    configColumn,
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (createdAt: string) => (
        <StampTime time={createdAt} />
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 180,
      render: (updatedAt: string) => (
        <StampTime time={updatedAt} />
      ),
    },
    // 注意：操作列由 CustomTable 的内置操作处理，或由外部传入
  ];
};
