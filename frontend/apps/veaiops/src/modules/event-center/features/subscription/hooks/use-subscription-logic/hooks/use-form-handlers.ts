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
import type {
  SubscribeRelationCreate,
  SubscribeRelationUpdate,
  SubscribeRelationWithAttributes,
} from 'api-generate';
import { useCallback } from 'react';

interface UseFormHandlersParams {
  form: FormInstance;
  editingSubscription: SubscribeRelationWithAttributes | null;
  setEditingSubscription: (
    subscription: SubscribeRelationWithAttributes | null,
  ) => void;
  setModalVisible: (visible: boolean) => void;
  createSubscription: (data: SubscribeRelationCreate) => Promise<boolean>;
  updateSubscription: (
    id: string,
    data: SubscribeRelationUpdate,
  ) => Promise<boolean>;
  deleteSubscription: (id: string) => Promise<boolean>;
  refreshTable?: () => Promise<boolean>;
}

/**
 * 表单处理器 Hook
 */
export const useFormHandlers = ({
  form,
  editingSubscription,
  setEditingSubscription,
  setModalVisible,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  refreshTable,
}: UseFormHandlersParams) => {
  // 使用管理刷新 Hook
  const { afterCreate, afterUpdate, afterDelete } =
    useManagementRefresh(refreshTable);

  // 删除订阅关系处理器
  const handleDelete = useCallback(
    async (subscriptionId: string) => {
      try {
        const success = await deleteSubscription(subscriptionId);
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
              source: 'SubscriptionManagement',
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
    [deleteSubscription, afterDelete],
  );

  // 创建订阅关系处理器
  const handleCreate = useCallback(
    async (values: SubscribeRelationCreate) => {
      try {
        const success = await createSubscription(values);
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
              source: 'SubscriptionManagement',
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
    [createSubscription, form, afterCreate, setModalVisible],
  );

  // 更新订阅关系处理器
  const handleUpdate = useCallback(
    async (values: SubscribeRelationUpdate) => {
      try {
        const success = await updateSubscription(
          editingSubscription?._id || '',
          values,
        );
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
              source: 'SubscriptionManagement',
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
      editingSubscription,
      updateSubscription,
      form,
      afterUpdate,
      setModalVisible,
      setEditingSubscription,
    ],
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

  return {
    handleDelete,
    handleCreate,
    handleUpdate,
    handleSubmit,
  };
};
