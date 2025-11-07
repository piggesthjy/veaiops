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

import type { User, UserFormData } from '@account';
import type { FormInstance } from '@arco-design/web-react';
import type { CustomTableActionType } from '@veaiops/components';
import type { BaseQuery, BaseRecord } from '@veaiops/types';
import type React from 'react';
import { useCallback, useRef } from 'react';
// 从 pages 目录导入组件（pages 目录是页面入口，features 目录是功能模块）
import { AccountModal, AccountTable } from '../../../pages/account/ui';
// // 注意：useAccount Hook 已移除，使用本地逻辑
// import { useAccount } from '../hooks'; // 暂时移除，等待实现

/**
 * 账号管理页面
 * 提供账号的增删改查功能 - 使用 CustomTable 和 Zustand 状态管理
 */
export const Account: React.FC = () => {
  // CustomTable ref用于获取刷新函数
  const tableRef = useRef<CustomTableActionType<BaseRecord, BaseQuery>>(null);

  // 使用自定义Hook获取所有业务逻辑，传递刷新函数
  // 暂时使用空实现
  const modalVisible = false;
  const editingUser: User | null = null;
  const form: FormInstance | null = null;
  const handleEdit = () => {};
  const handleAdd = () => {};
  const handleCancel = () => {};
  const handleSubmit = async () => false;
  const handleDelete = async () => false;

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
        editingUser={editingUser}
        onCancel={handleCancel}
        onSubmit={handleSubmit}
        form={form}
      />
    </>
  );
};

export default Account;
