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
import type {
  SubscribeRelationCreate,
  SubscribeRelationUpdate,
  SubscribeRelationWithAttributes,
} from 'api-generate';
import { useCallback, useState } from 'react';
import {
  createSubscription,
  deleteSubscription,
  updateSubscription,
} from '../lib/api';

/**
 * 订阅管理逻辑Hook
 * 提供订阅管理页面的所有业务逻辑
 */
export const useSubscriptionManagementLogic = (
  refreshTable?: () => Promise<boolean>,
) => {
  // 使用管理刷新 Hook
  const { afterCreate, afterUpdate, afterDelete } =
    useManagementRefresh(refreshTable);
  const [form] = Form.useForm();
  const [editingSubscription, setEditingSubscription] =
    useState<SubscribeRelationWithAttributes | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // 删除订阅关系处理器
  const handleDelete = useCallback(
    async (subscriptionId: string) => {
      try {
        const success = await deleteSubscription({ subscriptionId });
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
              source: 'SubscriptionLogic',
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
    [afterDelete],
  );

  // 创建订阅关系处理器
  const handleCreate = useCallback(
    async (values: SubscribeRelationCreate) => {
      try {
        const success = await createSubscription({ subscriptionData: values });
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
              source: 'SubscriptionLogic',
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
    [form, afterCreate],
  );

  // 更新订阅关系处理器
  const handleUpdate = useCallback(
    async (values: SubscribeRelationUpdate) => {
      try {
        const success = await updateSubscription({
          subscriptionId: editingSubscription?._id || '',
          updateData: values,
        });
        if (success) {
          setModalVisible(false);
          setEditingSubscription(null);
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
              source: 'SubscriptionLogic',
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
    [editingSubscription, form, afterUpdate],
  );

  // 处理表单提交
  const handleSubmit = useCallback(
    async (
      values: SubscribeRelationCreate | SubscribeRelationUpdate,
    ): Promise<boolean> => {
      const success = editingSubscription
        ? await handleUpdate(values as SubscribeRelationUpdate)
        : await handleCreate(values as SubscribeRelationCreate);

      if (!success) {
        // 阻止弹窗在失败时自动关闭
        throw new Error('Operation failed but error message was displayed.');
      }
      return success;
    },
    [editingSubscription, handleUpdate, handleCreate],
  );

  // 打开编辑弹窗
  const handleEdit = useCallback(
    (subscription: SubscribeRelationWithAttributes) => {
      setEditingSubscription(subscription);
      form.setFieldsValue({
        ...subscription,
      });
      setModalVisible(true);
    },
    [form],
  );

  // 打开新增弹窗
  const handleAdd = useCallback(() => {
    setEditingSubscription(null);
    form.resetFields();
    setModalVisible(true);
  }, [form]);

  // 关闭弹窗
  const handleCancel = useCallback(() => {
    setModalVisible(false);
    setEditingSubscription(null);
    form.resetFields();
  }, [form]);

  return {
    // 状态
    modalVisible,
    editingSubscription,
    form,

    // 事件处理器
    handleEdit,
    handleAdd,
    handleCancel,
    handleSubmit,
    handleDelete,
  };
};
