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

import type { ModernTableColumnProps } from '@veaiops/components';
import { CellRender } from '@veaiops/components';
import { EMPTY_CONTENT } from '@veaiops/constants';
import type { DataSource } from 'api-generate';

// 解构组件，避免重复调用
const { CustomOutlineTag } = CellRender;

/**
 * 名称/ID列配置
 */
export const getNameColumn = (): ModernTableColumnProps<DataSource> => ({
  title: '数据源名称/ID',
  dataIndex: 'name',
  key: 'name',
  fixed: 'left',
  width: 250,
  render: (name: string, record: DataSource) => (
    <CellRender.InfoWithCode name={name || ''} code={record._id || ''} />
  ),
});

/**
 * 数据源类型列配置
 */
export const getTypeColumn = (): ModernTableColumnProps<DataSource> => ({
  title: '数据源类型',
  dataIndex: 'type',
  key: 'type',
  width: 120,
  align: 'center',
  render: (type: string) => {
    if (!type) {
      return EMPTY_CONTENT;
    }
    return <CustomOutlineTag>{type}</CustomOutlineTag>;
  },
});

/**
 * 状态列配置
 */
export const getStatusColumn = (): ModernTableColumnProps<DataSource> => ({
  title: '状态',
  dataIndex: 'is_active',
  key: 'is_active',
  width: 100,
  align: 'center',
  render: (isActive: boolean) => (
    <CustomOutlineTag>{isActive ? '已启动' : '未启动'}</CustomOutlineTag>
  ),
});

/**
 * 创建时间列配置
 */
export const getCreatedAtColumn = (): ModernTableColumnProps<DataSource> => ({
  title: '创建时间',
  dataIndex: 'created_at',
  key: 'created_at',
  width: 180,
  render: (createdAt: string) => <CellRender.StampTime time={createdAt} />,
});

/**
 * 更新时间列配置
 */
export const getUpdatedAtColumn = (): ModernTableColumnProps<DataSource> => ({
  title: '更新时间',
  dataIndex: 'updated_at',
  key: 'updated_at',
  width: 180,
  render: (updatedAt: string) => <CellRender.StampTime time={updatedAt} />,
});
