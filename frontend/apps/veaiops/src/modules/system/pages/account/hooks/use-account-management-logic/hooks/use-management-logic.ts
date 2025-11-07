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

import { Form, Message } from '@arco-design/web-react';
import { useManagementRefresh } from '@veaiops/hooks';
import { logger } from '@veaiops/utils';
import type { User } from 'api-generate';
import { useCallback, useState } from 'react';
import type { UserFormData } from '../../../types';
import { createUser, deleteUser, updateUser } from '../lib/api';

/**
 * 账号管理逻辑Hook
 * 提供账号管理页面的所有业务逻辑
 */
export const useAccountManagementLogic = (
  refreshTable?: () => Promise<boolean>,
) => {
  // 使用管理刷新 Hook
  const { afterCreate, afterUpdate, afterDelete } =
    useManagementRefresh(refreshTable);

  const [form] = Form.useForm();
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // 删除用户
  const handleDelete = useCallback(
    async (userId: string) => {
      try {
        logger.info({
          message: '[AccountManagementLogic] 🗑️ 开始删除用户',
          data: { userId, timestamp: Date.now() },
          source: 'AccountPage',
          component: 'handleDelete',
        });

        const success = await deleteUser({ userId });

        if (success) {
          logger.info({
            message: '[AccountManagementLogic] ✅ 用户删除成功',
            data: { userId, timestamp: Date.now() },
            source: 'AccountPage',
            component: 'handleDelete',
          });

          // 删除成功后刷新表格
          logger.debug({
            message:
              '[AccountManagementLogic] 🔄 准备调用 afterDelete 刷新表格',
            data: { timestamp: Date.now() },
            source: 'AccountPage',
            component: 'handleDelete',
          });

          const refreshResult = await afterDelete();

          if (!refreshResult.success && refreshResult.error) {
            logger.error({
              message: '[AccountManagementLogic] ❌ 删除后刷新失败',
              data: {
                error: refreshResult.error.message,
                stack: refreshResult.error.stack,
                errorObj: refreshResult.error,
                timestamp: Date.now(),
              },
              source: 'AccountPage',
              component: 'handleDelete',
            });
          } else {
            logger.info({
              message: '[AccountManagementLogic] ✅ 删除后刷新成功',
              data: { timestamp: Date.now() },
              source: 'AccountPage',
              component: 'handleDelete',
            });
          }
          return true;
        }
        return false;
      } catch (error: unknown) {
        // ✅ 正确：透出实际错误信息
        const errorObj =
          error instanceof Error ? error : new Error(String(error));
        const errorMessage = errorObj.message || '删除失败，请重试';
        logger.error({
          message: '[AccountManagementLogic] ❌ 用户删除失败',
          data: { error: errorMessage, timestamp: Date.now() },
          source: 'AccountPage',
          component: 'handleDelete',
        });
        Message.error(errorMessage);
        return false;
      }
    },
    [afterDelete],
  );

  // 创建用户
  const handleCreate = useCallback(
    async (values: UserFormData) => {
      try {
        logger.info({
          message: '[AccountManagementLogic] 🆕 开始创建用户',
          data: { username: values.username, timestamp: Date.now() },
          source: 'AccountPage',
          component: 'handleCreate',
        });

        const success = await createUser({ userData: values });
        if (success) {
          logger.info({
            message: '[AccountManagementLogic] ✅ 用户创建成功',
            data: { username: values.username, timestamp: Date.now() },
            source: 'AccountPage',
            component: 'handleCreate',
          });

          setModalVisible(false);
          form.resetFields();

          // 创建成功后刷新表格
          logger.debug({
            message:
              '[AccountManagementLogic] 🔄 准备调用 afterCreate 刷新表格',
            data: { timestamp: Date.now() },
            source: 'AccountPage',
            component: 'handleCreate',
          });

          const refreshResult = await afterCreate();

          if (!refreshResult.success && refreshResult.error) {
            logger.error({
              message: '[AccountManagementLogic] ❌ 创建后刷新失败',
              data: {
                error: refreshResult.error.message,
                stack: refreshResult.error.stack,
                errorObj: refreshResult.error,
                timestamp: Date.now(),
              },
              source: 'AccountPage',
              component: 'handleCreate',
            });
          } else {
            logger.info({
              message: '[AccountManagementLogic] ✅ 创建后刷新成功',
              data: { timestamp: Date.now() },
              source: 'AccountPage',
              component: 'handleCreate',
            });
          }
          return true;
        }
        return false;
      } catch (error: unknown) {
        // ✅ 正确：透出实际错误信息
        const errorObj =
          error instanceof Error ? error : new Error(String(error));
        const errorMessage = errorObj.message || '创建失败，请重试';
        logger.error({
          message: '[AccountManagementLogic] ❌ 用户创建失败',
          data: { error: errorMessage, timestamp: Date.now() },
          source: 'AccountPage',
          component: 'handleCreate',
        });
        Message.error(errorMessage);
        return false;
      }
    },
    [form, afterCreate],
  );

  // 更新用户
  const handleUpdate = useCallback(
    async (values: UserFormData) => {
      if (!editingUser || !editingUser._id) {
        Message.error('用户 ID 不能为空');
        return false;
      }

      try {
        logger.info({
          message: '[AccountManagementLogic] 📝 开始更新用户',
          data: {
            userId: editingUser._id,
            username: values.username,
            timestamp: Date.now(),
          },
          source: 'AccountPage',
          component: 'handleUpdate',
        });

        const success = await updateUser({
          userId: editingUser._id,
          updateData: values,
        });

        if (success) {
          logger.info({
            message: '[AccountManagementLogic] ✅ 用户更新成功',
            data: { userId: editingUser._id, timestamp: Date.now() },
            source: 'AccountPage',
            component: 'handleUpdate',
          });

          setModalVisible(false);
          setEditingUser(null);
          form.resetFields();

          // 更新成功后刷新表格
          logger.debug({
            message:
              '[AccountManagementLogic] 🔄 准备调用 afterUpdate 刷新表格',
            data: { timestamp: Date.now() },
            source: 'AccountPage',
            component: 'handleUpdate',
          });

          const refreshResult = await afterUpdate();

          if (!refreshResult.success && refreshResult.error) {
            logger.error({
              message: '[AccountManagementLogic] ❌ 更新后刷新失败',
              data: {
                error: refreshResult.error.message,
                stack: refreshResult.error.stack,
                errorObj: refreshResult.error,
                timestamp: Date.now(),
              },
              source: 'AccountPage',
              component: 'handleUpdate',
            });
          } else {
            logger.info({
              message: '[AccountManagementLogic] ✅ 更新后刷新成功',
              data: { timestamp: Date.now() },
              source: 'AccountPage',
              component: 'handleUpdate',
            });
          }
          return true;
        }
        return false;
      } catch (error: unknown) {
        // ✅ 正确：透出实际错误信息
        const errorObj =
          error instanceof Error ? error : new Error(String(error));
        const errorMessage = errorObj.message || '更新失败，请重试';
        logger.error({
          message: '[AccountManagementLogic] ❌ 用户更新失败',
          data: { error: errorMessage, timestamp: Date.now() },
          source: 'AccountPage',
          component: 'handleUpdate',
        });
        Message.error(errorMessage);
        return false;
      }
    },
    [editingUser, form, afterUpdate],
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
        role: user.role,
        status: user.status,
        is_system_admin: user.is_system_admin,
      });
      setModalVisible(true);
    },
    [form],
  );

  // 打开新增弹窗
  const handleAdd = useCallback(() => {
    setEditingUser(null);
    form.resetFields();
    // 设置默认值：新增账号默认为普通用户，状态为活跃
    form.setFieldsValue({
      role: 'user',
      status: 'active',
      is_system_admin: false,
    });
    setModalVisible(true);
  }, [form]);

  // 关闭弹窗
  const handleCancel = useCallback(() => {
    setModalVisible(false);
    setEditingUser(null);
    form.resetFields();
  }, [form]);

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
