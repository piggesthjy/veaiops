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

import type React from 'react';
import { AccountManagement } from '../../features/account';

/**
 * 系统配置 - 账号管理页面
 * @description 支持系统管理员(密码变更登录)和非管理员成员(增删改查)权限管控
 */
const AccountManagement: React.FC = () => {
  const {
    users,
    loading,
    modalVisible,
    editingUser,
    pagination,
    fetchUsers,
    handleSubmit,
    setModalVisible,
    setEditingUser,
    deleteUser,
  } = useUserManagement();

  // 处理分页变化
  const handlePageChange = (page: number, pageSize: number) => {
    fetchUsers(page, pageSize);
  };

  // 处理编辑账号
  const handleEdit = (user: any) => {
    setEditingUser(user);
    setModalVisible(true);
  };

  // 处理创建账号
  const handleCreate = () => {
    setEditingUser(null);
    setModalVisible(true);
  };

  // 处理取消操作
  const handleCancel = () => {
    setModalVisible(false);
    setEditingUser(null);
  };

  return (
    <div className="pr-6 pb-6 pl-6">
      <UserTable
        users={users}
        loading={loading}
        pagination={pagination}
        onEdit={handleEdit}
        onDelete={deleteUser}
        onRefresh={() => fetchUsers()}
        onCreate={handleCreate}
        onPageChange={handlePageChange}
      />

      <UserModal
        visible={modalVisible}
        editingUser={editingUser}
        onCancel={handleCancel}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default AccountManagement;
