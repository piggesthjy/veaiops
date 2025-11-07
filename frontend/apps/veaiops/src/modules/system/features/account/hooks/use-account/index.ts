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
  useAccountActionConfig,
  useAccountTableConfig,
  useCrudOperations,
  useFormHandlers,
  useModalState,
} from './hooks';

/**
 * 账号管理逻辑Hook
 * 提供账号管理页面的所有业务逻辑
 */
export const useAccount = (refreshTable?: () => Promise<boolean>) => {
  const { createUser, updateUser, deleteUser } = useCrudOperations();
  const {
    form,
    editingUser,
    modalVisible,
    setModalVisible,
    setEditingUser,
    handleEdit,
    handleAdd,
    handleCancel,
  } = useModalState();

  const { handleDelete, handleSubmit } = useFormHandlers({
    form,
    editingUser,
    setEditingUser,
    setModalVisible,
    createUser,
    updateUser,
    deleteUser,
    refreshTable,
  });

  return {
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
  };
};

/**
 * 账号表格配置Hook
 * 提供数据源配置等（列配置已移至组件中处理）
 */
export { useAccountTableConfig } from './hooks';

/**
 * 账号操作按钮配置Hook
 * 提供表格工具栏操作按钮配置
 */
export { useAccountActionConfig } from './hooks';

export type {
  UserFormData,
  UserTableData,
  UpdateUserParams,
} from './types';
export { transformUserToTableData } from './utils';
