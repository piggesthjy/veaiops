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

import { Message } from '@arco-design/web-react';
import { useManagementRefresh } from '@veaiops/hooks';
import { logger } from '@veaiops/utils';
import type { User } from 'api-generate';
import { useCallback } from 'react';
import type { UpdateUserParams } from './crud';
import { useCreateUser, useDeleteUser, useUpdateUser } from './crud';
import type { UseAccountStateReturn } from './state';
import type { UserFormData } from './types';

/**
 * 事件处理器Hook的参数
 */
interface UseAccountHandlersParams {
  state: UseAccountStateReturn;
  createUser: (data: UserFormData) => Promise<boolean>;
  updateUser: (params: UpdateUserParams) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<boolean>;
  refreshTable?: () => Promise<boolean>;
}

/**
 * 账号管理的事件处理器Hook
 */
export const useAccountHandlers = ({
  state,
  createUser,
  updateUser,
  deleteUser,
  refreshTable,
}: UseAccountHandlersParams) => {
  const { form, editingUser, setEditingUser, modalVisible, setModalVisible } =
    state;

  // 使用管理刷新 Hook
  // ✅ 注意：删除操作的刷新已由 useBusinessTable 自动处理，无需 afterDelete
  // 仅保留 afterCreate 和 afterUpdate 用于表单提交后的刷新
  const { afterCreate, afterUpdate } = useManagementRefresh(refreshTable);

  // 删除用户
  // ✅ 注意：删除后的刷新已由 useBusinessTable 自动处理，无需手动调用 afterDelete
  const handleDelete = useCallback(
    async (userId: string) => {
      try {
        const success = await deleteUser(userId);
        // ✅ 刷新已由 useBusinessTable 自动处理，无需手动刷新
        return success;
      } catch (error) {
        // ✅ 正确：透出实际错误信息
        const errorMessage =
          error instanceof Error ? error.message : '删除失败，请重试';
        Message.error(errorMessage);
        return false;
      }
    },
    [deleteUser],
  );

  // 创建用户
  const handleCreate = useCallback(
    async (values: UserFormData) => {
      try {
        const success = await createUser(values);
        if (success) {
          setModalVisible(false);
          form.resetFields();
          // 创建成功后刷新表格
          const refreshResult = await afterCreate();
          if (!refreshResult.success && refreshResult.error) {
            // 刷新失败，但不影响创建操作本身
            // ✅ 正确：使用 logger 记录警告，传递完整的错误信息
            const errorObj = refreshResult.error;
            logger.warn({
              message: '创建后刷新表格失败',
              data: {
                error: errorObj.message,
                stack: errorObj.stack,
                errorObj,
                userValues: values,
              },
              source: 'AccountManagement',
              component: 'handleCreate',
            });
          }
          return true;
        }
        return false;
      } catch (error) {
        // ✅ 正确：透出实际错误信息
        const errorMessage =
          error instanceof Error ? error.message : '创建失败，请重试';
        Message.error(errorMessage);
        return false;
      }
    },
    [createUser, form, afterCreate, setModalVisible],
  );

  // 更新用户
  const handleUpdate = useCallback(
    async (values: UserFormData) => {
      if (!editingUser || !editingUser._id) {
        Message.error('用户 ID 不能为空');
        return false;
      }

      try {
        const success = await updateUser({
          userId: editingUser._id,
          updateData: values,
        });
        if (success) {
          setModalVisible(false);
          setEditingUser(null);
          form.resetFields();
          // 更新成功后刷新表格
          const refreshResult = await afterUpdate();
          if (!refreshResult.success && refreshResult.error) {
            // 刷新失败，但不影响更新操作本身
            // ✅ 正确：使用 logger 记录警告，传递完整的错误信息
            const errorObj = refreshResult.error;
            logger.warn({
              message: '更新后刷新表格失败',
              data: {
                error: errorObj.message,
                stack: errorObj.stack,
                errorObj,
                userId: editingUser._id,
                userValues: values,
              },
              source: 'AccountManagement',
              component: 'handleUpdate',
            });
          }
          return true;
        }
        return false;
      } catch (error) {
        // ✅ 正确：透出实际错误信息
        const errorMessage =
          error instanceof Error ? error.message : '更新失败，请重试';
        Message.error(errorMessage);
        return false;
      }
    },
    [
      editingUser,
      updateUser,
      form,
      afterUpdate,
      setModalVisible,
      setEditingUser,
    ],
  );

  // 处理表单提交
  const handleSubmit = useCallback(
    async (values: UserFormData) => {
      if (editingUser) {
        return await handleUpdate(values);
      } else {
        return await handleCreate(values);
      }
    },
    [editingUser, handleUpdate, handleCreate],
  );

  // 打开编辑弹窗
  const handleEdit = useCallback(
    (user: User) => {
      setEditingUser(user);
      form.setFieldsValue({
        username: user.username,
        email: user.email,
        is_active: user.is_active,
        is_supervisor: user.is_supervisor,
      });
      setModalVisible(true);
    },
    [form, setEditingUser, setModalVisible],
  );

  // 打开新增弹窗
  const handleAdd = useCallback(() => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  }, [form, setEditingUser, setModalVisible]);

  // 关闭弹窗
  const handleCancel = useCallback(() => {
    setModalVisible(false);
    setEditingUser(null);
    form.resetFields();
  }, [form, setModalVisible, setEditingUser]);

  return {
    handleEdit,
    handleAdd,
    handleCancel,
    handleSubmit,
    handleDelete,
  };
};
