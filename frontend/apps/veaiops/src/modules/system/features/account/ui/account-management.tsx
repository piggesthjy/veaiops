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

import { useAccountManagementLogic } from '@account';
import type { CustomTableActionType } from '@veaiops/components';
import type { BaseQuery, BaseRecord } from '@veaiops/types';
import { logger } from '@veaiops/utils';
import type { User as ApiUser } from 'api-generate';
import type React from 'react';
import { useCallback, useRef } from 'react';
// 从 pages 目录导入组件（pages 目录是页面入口，features 目录是功能模块）
import { AccountModal, AccountTable } from '../../../pages/account/ui';

// 扩展 API User 类型以匹配 AccountModal 的期望
interface ExtendedUser
  extends Omit<ApiUser, 'id' | 'created_at' | 'updated_at'> {
  id: string; // 覆盖 ApiUser 的可选 id，使其成为必需的
  created_at: string; // 覆盖 ApiUser 的可选 created_at，使其成为必需的
  updated_at: string; // 覆盖 ApiUser 的可选 updated_at，使其成为必需的
  role: 'admin' | 'user' | 'viewer';
  status: 'active';
  is_system_admin: boolean;
  last_login?: string;
}

// 转换函数：将 API User 转换为 ExtendedUser
export const transformApiUserToExtendedUser = (
  apiUser: ApiUser,
): ExtendedUser => {
  const now = new Date().toISOString();
  return {
    _id: apiUser._id,
    username: apiUser.username,
    email: apiUser.email,
    is_active: apiUser.is_active,
    is_supervisor: apiUser.is_supervisor,
    id: apiUser._id || `temp-${Date.now()}`, // 确保 id 不为 undefined
    created_at: apiUser.created_at || now,
    updated_at: apiUser.updated_at || now,
    role: apiUser.is_supervisor ? 'admin' : 'user',
    status: 'active' as const,
    is_system_admin: apiUser.is_supervisor || false,
    last_login: undefined, // API 中暂无此字段
  };
};

/**
 * 账号管理页面
 * 提供账号的增删改查功能 - 使用 CustomTable 和 Zustand 状态管理
 */
export const AccountManagement: React.FC = () => {
  // CustomTable ref用于获取刷新函数
  const tableRef = useRef<CustomTableActionType<BaseRecord, BaseQuery>>(null);

  // 获取表格刷新函数
  const getRefreshTable = useCallback(async (): Promise<boolean> => {
    if (tableRef.current?.refresh) {
      const result = await tableRef.current.refresh();
      if (!result.success && result.error) {
        logger.warn({
          message: '账户表格刷新失败',
          data: {
            error: result.error.message,
            stack: result.error.stack,
            errorObj: result.error,
          },
          source: 'AccountManagement',
          component: 'getRefreshTable',
        });
        return false;
      }
      return true;
    }
    return false;
  }, []);

  // 使用自定义Hook获取所有业务逻辑，传递刷新函数
  const {
    // 状态
    modalVisible,
    editingUser,
    form,

    // 事件处理器
    handleEdit,
    handleAdd,
    handleCancel,
    handleSubmit,
    handleDelete,
  } = useAccountManagementLogic(getRefreshTable());

  return (
    <>
      {/* 账号表格 */}
      <AccountTable
        ref={tableRef}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAdd={handleAdd}
      />

      {/* 账号弹窗 */}
      <AccountModal
        visible={modalVisible}
        editingUser={
          editingUser ? transformApiUserToExtendedUser(editingUser) : null
        }
        onCancel={handleCancel}
        onSubmit={handleSubmit}
        form={form}
      />
    </>
  );
};

export default AccountManagement;
