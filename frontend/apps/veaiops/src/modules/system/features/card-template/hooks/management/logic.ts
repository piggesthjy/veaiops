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

import { Form, type FormInstance, Message } from '@arco-design/web-react';
import { useManagementRefresh } from '@veaiops/hooks';
import { logger } from '@veaiops/utils';
import type {
  AgentTemplate,
  AgentTemplateCreateRequest,
  AgentTemplateUpdateRequest,
} from 'api-generate';
import { useCallback, useState } from 'react';
import {
  createTemplate,
  deleteTemplate,
  updateTemplate,
} from '../card-template';

/**
 * 卡片模板管理逻辑Hook参数接口
 */
export interface UseCardTemplateManagementLogicParams {
  refreshTable?: () => Promise<boolean>;
}

/**
 * 卡片模板管理逻辑Hook返回值接口
 */
export interface UseCardTemplateManagementLogicReturn {
  // 状态
  modalVisible: boolean;
  editingTemplate: AgentTemplate | null;
  form: FormInstance;

  // 事件处理器
  handleEdit: (template: AgentTemplate) => void;
  handleAdd: () => void;
  handleCancel: () => void;
  handleSubmit: (
    values: AgentTemplateCreateRequest | AgentTemplateUpdateRequest,
  ) => Promise<boolean>;
  handleDelete: (templateId: string) => Promise<boolean>;
}

/**
 * 卡片模板管理逻辑Hook
 * 提供卡片模板管理页面的所有业务逻辑
 */
export const useCardTemplateManagementLogic = (
  refreshTable?: () => Promise<boolean>,
): UseCardTemplateManagementLogicReturn => {
  // 使用管理刷新 Hook
  const { afterCreate, afterUpdate, afterDelete } =
    useManagementRefresh(refreshTable);

  const [form] = Form.useForm();
  const [editingTemplate, setEditingTemplate] = useState<AgentTemplate | null>(
    null,
  );
  const [modalVisible, setModalVisible] = useState(false);

  // 删除模板处理器
  const handleDelete = useCallback(
    async (templateId: string) => {
      try {
        const success = await deleteTemplate(templateId);
        if (success) {
          // 删除成功后刷新表格
          const refreshResult = await afterDelete();
          if (!refreshResult.success && refreshResult.error) {
            // ✅ 正确：使用 logger 记录警告，传递完整的错误信息
            const errorObj = refreshResult.error;
            logger.warn({
              message: '删除后刷新表格失败',
              data: {
                error: errorObj.message,
                stack: errorObj.stack,
                errorObj,
              },
              source: 'CardTemplate',
              component: 'handleDelete',
            });
          }
          return true;
        }
        return false;
      } catch (error) {
        // ✅ 正确：透出实际的错误信息
        const errorMessage =
          error instanceof Error ? error.message : '删除失败，请重试';
        Message.error(errorMessage);
        return false;
      }
    },
    [afterDelete],
  );

  // 创建模板处理器
  const handleCreate = useCallback(
    async (values: AgentTemplateCreateRequest) => {
      try {
        const success = await createTemplate(values);
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
              source: 'CardTemplateManagement',
              component: 'handleCreate',
            });
          }
          return true;
        }
        return false;
      } catch (error) {
        // ✅ 正确：透出实际的错误信息
        const errorMessage =
          error instanceof Error ? error.message : '创建失败，请重试';
        Message.error(errorMessage);
        return false;
      }
    },
    [form, afterCreate],
  );

  // 更新模板处理器
  const handleUpdate = useCallback(
    async (values: AgentTemplateUpdateRequest) => {
      if (!editingTemplate) {
        return false;
      }

      const targetId = editingTemplate._id ?? editingTemplate._id;

      if (!targetId) {
        Message.error('更新失败，缺少模板标识');
        return false;
      }

      // ✅ 使用 logger 记录调试信息（对象解构参数）
      logger.debug({
        message: '更新模板',
        data: {
          targetId,
          values,
        },
        source: 'useCardTemplate',
        component: 'handleUpdate',
      });

      try {
        const success = await updateTemplate({
          templateId: targetId,
          updateData: values,
        });
        if (success) {
          setModalVisible(false);
          setEditingTemplate(null);
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
              source: 'CardTemplateManagement',
              component: 'handleUpdate',
            });
          }
          return true;
        }
        return false;
      } catch (error) {
        // ✅ 正确：透出实际的错误信息
        const errorMessage =
          error instanceof Error ? error.message : '更新失败，请重试';
        Message.error(errorMessage);
        return false;
      }
    },
    [editingTemplate, form, afterUpdate],
  );

  // 处理表单提交
  const handleSubmit = useCallback(
    async (values: AgentTemplateCreateRequest | AgentTemplateUpdateRequest) => {
      if (editingTemplate) {
        return handleUpdate(values as AgentTemplateUpdateRequest);
      }
      return handleCreate(values as AgentTemplateCreateRequest);
    },
    [editingTemplate, handleUpdate, handleCreate],
  );

  // 打开编辑弹窗
  const handleEdit = useCallback(
    (template: any) => {
      setEditingTemplate(template);
      form.setFieldsValue({
        ...template,
        agents: template?.agent_type ? [template?.agent_type] : undefined,
      });
      setModalVisible(true);
    },
    [form],
  );

  // 打开新增弹窗
  const handleAdd = useCallback(() => {
    setEditingTemplate(null);
    form.resetFields();
    setModalVisible(true);
  }, [form]);

  // 关闭弹窗
  const handleCancel = useCallback(() => {
    setModalVisible(false);
    setEditingTemplate(null);
    form.resetFields();
  }, [form]);

  return {
    // 状态
    modalVisible,
    editingTemplate,
    form,

    // 事件处理器
    handleEdit,
    handleAdd,
    handleCancel,
    handleSubmit,
    handleDelete,
  };
};
