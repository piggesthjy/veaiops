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
import type { FormInstance } from '@arco-design/web-react/es/Form';
import { useManagementRefresh } from '@veaiops/hooks';
import type { User } from 'api-generate';
import { useCallback } from 'react';
import type { UpdateUserParams, UserFormData } from '../types';

interface UseFormHandlersParams {
  form: FormInstance;
  editingUser: User | null;
  setEditingUser: (user: User | null) => void;
  setModalVisible: (visible: boolean) => void;
  createUser: (data: UserFormData) => Promise<boolean>;
  updateUser: (params: UpdateUserParams) => Promise<boolean>;
  deleteUser: (id: string) => Promise<boolean>;
  refreshTable?: () => Promise<boolean>;
}

/**
 * 表单处理器 Hook
 */
export const useFormHandlers = ({
  form,
  editingUser,
  setEditingUser,
  setModalVisible,
  createUser,
  updateUser,
  deleteUser,
  refreshTable,
}: UseFormHandlersParams) => {
  // 使用管理刷新 Hook
  const { afterCreate, afterUpdate, afterDelete } =
    useManagementRefresh(refreshTable);

  // 删除用户
  const handleDelete = useCallback(
    async (userId: string) => {
      try {
        const success = await deleteUser(userId);
        if (success) {
          // 删除成功后刷新表格
          const refreshResult = await afterDelete();
          if (!refreshResult.success && refreshResult.error) {
            logger.warn({
              message: '删除后刷新表格失败',
              data: {
                error: refreshResult.error.message,
                stack: refreshResult.error.stack,
                errorObj: refreshResult.error,
              },
              source: 'AccountManagement',
              component: 'handleDelete',
            });
          }
          return true;
        }
        return false;
      } catch (error: unknown) {
        // ✅ 正确：透出实际的错误信息
        const errorObj =
          error instanceof Error ? error : new Error(String(error));
        const errorMessage = errorObj.message || '删除失败，请重试';
        Message.error(errorMessage);
        return false;
      }
    },
    [deleteUser, afterDelete],
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
            logger.warn({
              message: '创建后刷新表格失败',
              data: {
                error: refreshResult.error.message,
                stack: refreshResult.error.stack,
                errorObj: refreshResult.error,
              },
              source: 'AccountManagement',
              component: 'handleCreate',
            });
          }
          return true;
        }
        return false;
      } catch (error: unknown) {
        // ✅ 正确：透出实际的错误信息
        const errorObj =
          error instanceof Error ? error : new Error(String(error));
        const errorMessage = errorObj.message || '创建失败，请重试';
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
            logger.warn({
              message: '更新后刷新表格失败',
              data: {
                error: refreshResult.error.message,
                stack: refreshResult.error.stack,
                errorObj: refreshResult.error,
              },
              source: 'AccountManagement',
              component: 'handleUpdate',
            });
          }
          return true;
        }
        return false;
      } catch (error: unknown) {
        // ✅ 正确：透出实际的错误信息
        const errorObj =
          error instanceof Error ? error : new Error(String(error));
        const errorMessage = errorObj.message || '更新失败，请重试';
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

  return {
    handleDelete,
    handleCreate,
    handleUpdate,
    handleSubmit,
  };
};
