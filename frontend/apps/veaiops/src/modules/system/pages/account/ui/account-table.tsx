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

import {
  type ButtonConfiguration,
  ButtonGroupRender,
  CellRender,
  CustomTable,
  useBusinessTable,
} from '@veaiops/components';

import { authConfig } from '@/config/auth';
import { Message } from '@arco-design/web-react';
import { IconDelete } from '@arco-design/web-react/icon';
import type { User } from 'api-generate';
import { forwardRef, useCallback } from 'react';
import {
  useAccountActionConfig,
  useAccountTableConfig,
} from '../hooks/use-account-management-logic';

// ✅ 使用 api-generate 中的 User 类型（单一数据源原则）
type UserTableData = User;

// 列配置函数 - 使用包装后的处理器
const getUserColumns = (
  props: any,
  wrappedHandlers?: { delete?: (id: string) => Promise<boolean> },
) => [
  {
    title: '用户名',
    dataIndex: 'username',
    key: 'username',
    width: 150,
  },
  {
    title: '邮箱',
    dataIndex: 'email',
    key: 'email',
    width: 200,
  },
  // {
  //   title: '是否激活',
  //   dataIndex: 'is_active',
  //   key: 'is_active',
  //   width: 100,
  //   render: (isActive: boolean) => <CellRender.Boolean data={isActive} />,
  // },
  {
    title: '管理员',
    dataIndex: 'is_supervisor',
    key: 'is_supervisor',
    width: 100,
    render: (isSupervisor: boolean) => (
      <CellRender.Boolean data={isSupervisor} />
    ),
  },
  {
    title: '创建时间',
    dataIndex: 'created_at',
    key: 'created_at',
    width: 150,
    render: (time: string) => <CellRender.StampTime time={time} />,
  },
  {
    title: '操作',
    key: 'actions',
    width: 100,
    render: (_: any, record: User) => {
      const buttonConfigurations: ButtonConfiguration[] = [
        // {
        //   text: '修改密码',
        //   disabled: !props?.isSupervisor,
        //   buttonProps: {
        //     icon: <IconEdit />,
        //   },
        //   onClick: () => {
        //     props.onEdit?.(record);
        //   },
        // },
        {
          text: '删除',
          disabled: !props?.isSupervisor,
          supportPopConfirm: true,
          popConfirmContent: '确认删除此账号？',
          buttonProps: {
            icon: <IconDelete />,
            status: 'danger',
            // 注意：使用 as any 是因为 Arco Design Button 的 BaseButtonProps 类型定义不包含 data-testid
            // 但 data-testid 是 HTML 标准属性，在运行时会被正确传递
            // TODO: 检查 Arco Design 源码，确认是否需要扩展类型定义
            'data-testid': 'delete-account-btn',
          } as any,
          onClick: async () => {
            // ✅ 使用 useBusinessTable 自动包装的删除操作
            // 删除操作会自动刷新表格
            if (!record._id) {
              Message.error('用户 ID 不存在');
              return;
            }
            if (wrappedHandlers?.delete) {
              await wrappedHandlers.delete(record._id);
            } else if (props.onDelete) {
              // 兼容：如果没有包装的处理器，使用原始处理器
              await props.onDelete(record._id);
            }
          },
        },
      ];

      return (
        <ButtonGroupRender
          buttonConfigurations={buttonConfigurations}
          className="flex-nowrap"
          style={{ gap: '8px' }}
        />
      );
    },
  },
];

// 临时的配置对象
const ACCOUNT_MANAGEMENT_CONFIG = {
  title: '账号管理',
};

/**
 * 账号表格组件属性接口
 */
interface AccountTableProps {
  onEdit: (user: User) => void;
  onDelete: (userId: string) => Promise<boolean>;
  onAdd: () => void;
}

/**
 * 账号表格组件
 * 封装表格的渲染逻辑，提供清晰的接口
 */
export const AccountTable = forwardRef<any, AccountTableProps>(
  ({ onEdit, onDelete, onAdd }, ref) => {
    // 鉴权
    const isSupervisor =
      localStorage.getItem(authConfig.storageKeys.isSupervisor) === 'true';

    // 表格配置
    const { dataSource, tableProps } = useAccountTableConfig({
      handleEdit: onEdit,
      handleDelete: onDelete,
    });

    // 🎯 使用 useBusinessTable 自动处理刷新逻辑
    const { customTableProps, wrappedHandlers } = useBusinessTable({
      dataSource,
      tableProps,
      handlers: onDelete
        ? {
            delete: async (userId: string) => {
              return await onDelete(userId);
            },
          }
        : undefined,
      refreshConfig: {
        enableRefreshFeedback: true,
        successMessage: '操作成功',
        errorMessage: '操作失败，请重试',
      },
      ref,
    });

    // 操作按钮配置
    const { actions } = useAccountActionConfig(onAdd, isSupervisor);

    // 创建 handleColumns 函数，传递操作回调给列配置
    const handleColumns = useCallback(
      (props: Record<string, unknown>) => {
        return getUserColumns(
          {
            ...props,
            onEdit,
            onDelete,
            isSupervisor,
          },
          wrappedHandlers,
        );
      },
      [onEdit, onDelete, isSupervisor, wrappedHandlers],
    );

    return (
      <CustomTable<UserTableData>
        ref={ref}
        {...customTableProps}
        title={ACCOUNT_MANAGEMENT_CONFIG.title}
        actions={actions}
        handleColumns={handleColumns}
        handleColumnsProps={{ isSupervisor }}
        syncQueryOnSearchParams
        useActiveKeyHook
      />
    );
  },
);

// 设置 displayName 用于调试
AccountTable.displayName = 'AccountTable';

export default AccountTable;
