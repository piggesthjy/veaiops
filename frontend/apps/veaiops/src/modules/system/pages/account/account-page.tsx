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

import type { CustomTableActionType } from '@veaiops/components';
import type { BaseQuery, BaseRecord } from '@veaiops/types';
import { logger } from '@veaiops/utils';
import type React from 'react';
import { useRef } from 'react';
import { useAccountManagementLogic } from './hooks/use-account-management-logic';
import { AccountModal, AccountTable } from './ui';

/**
 * 系统配置 - 账号管理页面
 * 提供账号的增删改查功能 - 使用 CustomTable 和 Zustand 状态管理
 *
 * 架构特点：
 * - 使用自定义Hook封装业务逻辑
 * - 组件职责单一，易于维护
 * - 状态管理与UI渲染分离
 * - 支持配置化和扩展
 * - 使用CustomTable提供高级表格功能
 * - 支持系统管理员(密码变更登录)和非管理员成员(增删改查)权限管控
 */
const AccountManagement: React.FC = () => {
  // 表格引用，用于获取刷新函数
  const tableRef = useRef<CustomTableActionType<BaseRecord, BaseQuery>>(null);

  // ✅ 修复：获取表格刷新函数，返回 Promise<boolean>
  const getRefreshTable = async (): Promise<boolean> => {
    logger.debug({
      message: '[AccountPage] 🔄 准备刷新表格',
      data: {
        hasTableRef: Boolean(tableRef.current),
        hasRefresh: Boolean(tableRef.current?.refresh),
        timestamp: Date.now(),
      },
      source: 'AccountPage',
      component: 'getRefreshTable',
    });

    if (tableRef.current?.refresh) {
      try {
        await tableRef.current.refresh();
        logger.info({
          message: '[AccountPage] ✅ 表格刷新成功',
          data: { timestamp: Date.now() },
          source: 'AccountPage',
          component: 'getRefreshTable',
        });
        return true;
      } catch (error: unknown) {
        const errorObj =
          error instanceof Error ? error : new Error(String(error));
        logger.error({
          message: '[AccountPage] ❌ 表格刷新失败',
          data: {
            error: errorObj.message,
            stack: errorObj.stack,
            errorObj,
            timestamp: Date.now(),
          },
          source: 'AccountPage',
          component: 'getRefreshTable',
        });
        return false;
      }
    } else {
      logger.warn({
        message: '[AccountPage] ⚠️ 无法刷新表格：tableRef.current 不可用',
        data: { timestamp: Date.now() },
        source: 'AccountPage',
        component: 'getRefreshTable',
      });
      return false;
    }
  };

  // 使用自定义Hook获取所有业务逻辑，传入刷新函数
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
  } = useAccountManagementLogic(getRefreshTable);

  return (
    <>
      {/* 账号表格组件 - 使用CustomTable */}
      <AccountTable
        ref={tableRef}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAdd={handleAdd}
      />

      {/* 账号弹窗组件 */}
      <AccountModal
        visible={modalVisible}
        editingUser={editingUser}
        onCancel={handleCancel}
        onSubmit={handleSubmit}
        form={form}
      />
    </>
  );
};

export default AccountManagement;
