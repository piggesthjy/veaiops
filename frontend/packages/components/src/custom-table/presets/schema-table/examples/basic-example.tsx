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
 * Schema表格基础使用示例
 * @description 展示如何通过配置化+Schema的方式快速搭建表格

 * @date 2025-12-19
 */

import type { SchemaTableInstance, TableSchema } from '@/custom-table/types';
import { Message } from '@arco-design/web-react';
import { IconDelete, IconEdit, IconEye } from '@arco-design/web-react/icon';
import type { BaseRecord } from '@veaiops/types';
import type React from 'react';
import { useRef } from 'react';
import { TableSchemaBuilder } from '../utils';

import { SchemaTable } from '../schema-table';

// 示例数据类型
interface UserRecord extends BaseRecord {
  id: string;
  name: string;
  email: string;
  age: number;
  status: 'active' | 'inactive' | 'pending';
  role: string;
  salary: number;
  joinDate: string;
  avatar: string;
  tags: string[];
}

// 模拟数据
const mockUsers: UserRecord[] = [
  {
    id: '1',
    name: '张三',
    email: 'zhangsan@example.com',
    age: 28,
    status: 'active',
    role: 'developer',
    salary: 15000,
    joinDate: '2023-01-15',
    avatar: 'https://via.placeholder.com/40',
    tags: ['前端', 'React'],
  },
  {
    id: '2',
    name: '李四',
    email: 'lisi@example.com',
    age: 32,
    status: 'active',
    role: 'designer',
    salary: 12000,
    joinDate: '2022-08-20',
    avatar: 'https://via.placeholder.com/40',
    tags: ['UI', '设计'],
  },
  {
    id: '3',
    name: '王五',
    email: 'wangwu@example.com',
    age: 25,
    status: 'pending',
    role: 'developer',
    salary: 10000,
    joinDate: '2024-03-10',
    avatar: 'https://via.placeholder.com/40',
    tags: ['后端', 'Node.js'],
  },
];

// 方式1: 使用Schema Builder构建配置
const buildSchemaWithBuilder = (): TableSchema<UserRecord> => {
  return (
    new TableSchemaBuilder<UserRecord>()
      .setTitle('用户管理')
      .setDescription('系统用户信息管理')

      // 添加列配置
      .addColumn({
        key: 'avatar',
        title: '头像',
        dataIndex: 'avatar',
        valueType: 'image',
        width: 80,
        hideInSearch: true,
      })
      .addColumn({
        key: 'name',
        title: '姓名',
        dataIndex: 'name',
        valueType: 'text',
        filterable: true,
        filterConfig: {
          type: 'input',
          placeholder: '请输入姓名',
        },
        copyable: true,
      })
      .addColumn({
        key: 'email',
        title: '邮箱',
        dataIndex: 'email',
        valueType: 'text',
        filterable: true,
        filterConfig: {
          type: 'input',
          placeholder: '请输入邮箱',
        },
        ellipsis: true,
        tooltip: true,
      })
      .addColumn({
        key: 'age',
        title: '年龄',
        dataIndex: 'age',
        valueType: 'number',
        width: 80,
        sortable: true,
        filterable: true,
        filterConfig: {
          type: 'numberRange',
        },
      })
      .addColumn({
        key: 'status',
        title: '状态',
        dataIndex: 'status',
        valueType: 'select',
        width: 100,
        filterable: true,
        filterConfig: {
          type: 'select',
          options: [
            { label: '激活', value: 'active' },
            { label: '未激活', value: 'inactive' },
            { label: '待审核', value: 'pending' },
          ],
        },
        valueEnum: {
          active: { text: '激活', status: 'success' },
          inactive: { text: '未激活', status: 'error' },
          pending: { text: '待审核', status: 'warning' },
        },
      })
      .addColumn({
        key: 'role',
        title: '角色',
        dataIndex: 'role',
        valueType: 'select',
        filterable: true,
        filterConfig: {
          type: 'select',
          options: [
            { label: '开发者', value: 'developer' },
            { label: '设计师', value: 'designer' },
            { label: '产品经理', value: 'pm' },
          ],
        },
      })
      .addColumn({
        key: 'salary',
        title: '薪资',
        dataIndex: 'salary',
        valueType: 'money',
        width: 120,
        sortable: true,
        hideInSearch: true,
      })
      .addColumn({
        key: 'joinDate',
        title: '入职日期',
        dataIndex: 'joinDate',
        valueType: 'date',
        width: 120,
        sortable: true,
        filterable: true,
        filterConfig: {
          type: 'dateRange',
        },
      })
      .addColumn({
        key: 'tags',
        title: '标签',
        dataIndex: 'tags',
        valueType: 'tag',
        hideInSearch: true,
      })

      // 配置功能
      .enablePagination({
        pageSize: 10,
        showSizeChanger: true,
        showQuickJumper: true,
      })
      .enableSearch({
        layout: 'horizontal',
        collapsed: false,
      })
      .enableToolbar({
        title: '用户列表',
        actions: [
          {
            key: 'add',
            label: '新增用户',
            type: 'primary',
            onClick: () => Message.info('点击新增用户'),
          },
          {
            key: 'export',
            label: '导出数据',
            onClick: () => Message.info('点击导出数据'),
          },
        ],
        settings: {
          density: true,
          columnSetting: true,
          fullScreen: true,
          reload: true,
        },
      })
      .enableRowSelection({
        type: 'checkbox',
        onChange: (_keys: React.Key[], _rows: UserRecord[]) => {
          // 行选择变化处理
        },
      })

      // 添加操作
      .addAction({
        key: 'view',
        label: '查看',
        icon: <IconEye />,
        onClick: (record: BaseRecord, _index: number) => {
          const userRecord = record as UserRecord;
          const name: string = userRecord.name || '';
          Message.info(`查看用户: ${name}`);
        },
      })
      .addAction({
        key: 'edit',
        label: '编辑',
        type: 'primary',
        icon: <IconEdit />,
        onClick: (record: BaseRecord, _index: number) => {
          const userRecord = record as UserRecord;
          const name: string = userRecord.name || '';
          Message.info(`编辑用户: ${name}`);
        },
      })
      .addAction({
        key: 'delete',
        label: '删除',
        type: 'text',
        status: 'danger',
        icon: <IconDelete />,
        confirm: {
          title: '确认删除',
          content: '删除后无法恢复，确认删除吗？',
        },
        onClick: (record: BaseRecord, _index: number) => {
          const userRecord = record as UserRecord;
          const name: string = userRecord.name || '';
          Message.success(`删除用户: ${name}`);
        },
      })

      // 设置数据源
      .setDataSource(mockUsers)

      .build()
  );
};

// 方式2: 直接使用Schema配置
const directSchema: TableSchema<UserRecord> = {
  title: '用户管理 - 直接配置',
  description: '通过直接配置Schema的方式创建表格',
  preset: 'advanced', // 使用高级预设

  columns: [
    {
      key: 'name',
      title: '姓名',
      dataIndex: 'name',
      valueType: 'text',
      filterable: true,
      filterConfig: {
        type: 'input',
        placeholder: '请输入姓名',
      },
    },
    {
      key: 'email',
      title: '邮箱',
      dataIndex: 'email',
      valueType: 'text',
      ellipsis: true,
    },
    {
      key: 'status',
      title: '状态',
      dataIndex: 'status',
      valueType: 'select',
      filterable: true,
      filterConfig: {
        type: 'select',
        options: [
          { label: '激活', value: 'active' },
          { label: '未激活', value: 'inactive' },
          { label: '待审核', value: 'pending' },
        ],
      },
      valueEnum: {
        active: { text: '激活', status: 'success' },
        inactive: { text: '未激活', status: 'error' },
        pending: { text: '待审核', status: 'warning' },
      },
    },
    {
      key: 'salary',
      title: '薪资',
      dataIndex: 'salary',
      valueType: 'money',
      sortable: true,
    },
  ],

  dataSource: mockUsers,

  actions: {
    items: [
      {
        key: 'edit',
        label: '编辑',
        type: 'primary',
        onClick: (record: BaseRecord, index: number) => {
          const userRecord = record as UserRecord;
          Message.info(`编辑: ${userRecord.name}`);
        },
      },
    ],
  },
};

// 方式3: 使用请求函数的Schema
const requestSchema: TableSchema<UserRecord> = {
  title: '用户管理 - 异步数据',
  preset: 'basic',

  columns: [
    {
      key: 'name',
      title: '姓名',
      dataIndex: 'name',
      valueType: 'text',
    },
    {
      key: 'email',
      title: '邮箱',
      dataIndex: 'email',
      valueType: 'text',
    },
    {
      key: 'status',
      title: '状态',
      dataIndex: 'status',
      valueType: 'select',
      valueEnum: {
        active: { text: '激活', status: 'success' },
        inactive: { text: '未激活', status: 'error' },
        pending: { text: '待审核', status: 'warning' },
      },
    },
  ],

  // 模拟异步请求
  request: async <TParams = unknown>(params: TParams) => {
    // 模拟网络延迟
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 模拟分页数据
    const paramsObj = params as Record<string, unknown>;
    const current = (paramsObj.current as number) || 1;
    const pageSize = (paramsObj.pageSize as number) || 10;
    const start = (current - 1) * pageSize;
    const end = start + pageSize;

    return {
      data: mockUsers.slice(start, end),
      total: mockUsers.length,
      success: true,
    };
  },
};

/**
 * 基础示例组件
 */
export const BasicExample: React.FC = () => {
  const tableRef = useRef<SchemaTableInstance>(null);

  const handleTableReady = (instance: SchemaTableInstance) => {
    // 表格就绪处理
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Schema表格使用示例</h2>

      <div style={{ marginBottom: 32 }}>
        <h3>方式1: 使用Schema Builder</h3>
        <SchemaTable
          ref={tableRef}
          schema={
            buildSchemaWithBuilder() as unknown as TableSchema<BaseRecord>
          }
          onReady={handleTableReady}
        />
      </div>

      <div style={{ marginBottom: 32 }}>
        <h3>方式2: 直接配置Schema</h3>
        <SchemaTable
          schema={directSchema as unknown as TableSchema<BaseRecord>}
        />
      </div>

      <div style={{ marginBottom: 32 }}>
        <h3>方式3: 异步数据请求</h3>
        <SchemaTable
          schema={requestSchema as unknown as TableSchema<BaseRecord>}
        />
      </div>
    </div>
  );
};

export default BasicExample;
