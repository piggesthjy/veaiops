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
import { adaptStrategyForEdit, strategyApi } from '@ec/strategy';
import { useManagementRefresh } from '@veaiops/hooks';
import { logger } from '@veaiops/utils';
import type {
  InformStrategy,
  InformStrategyCreate,
  InformStrategyUpdate,
} from 'api-generate';
import { useCallback, useState } from 'react';

/**
 * 策略表单管理 Hook 参数
 */
export interface UseStrategyFormParams {
  refreshTable?: () => Promise<boolean>;
}

/**
 * 策略表单管理 Hook 返回值
 */
export interface UseStrategyFormResult {
  // 状态
  modalVisible: boolean;
  editingStrategy: InformStrategy | null;
  form: ReturnType<typeof Form.useForm>[0];

  // 事件处理器
  handleEdit: (strategy: InformStrategy) => void;
  handleAdd: () => void;
  handleCancel: () => void;
  handleSubmit: (
    values: InformStrategyCreate | InformStrategyUpdate,
  ) => Promise<boolean>;
  handleDelete: (strategyId: string) => Promise<boolean>;
}

/**
 * 策略表单管理 Hook
 *
 * 提供策略表单的状态管理和业务逻辑：
 * - 表单状态管理（modalVisible, editingStrategy, form）
 * - 表单操作处理器（handleEdit, handleAdd, handleCancel, handleSubmit, handleDelete）
 * - 自动刷新表格（使用 useManagementRefresh）
 *
 * 根据 Python 源码分析：
 * - InformStrategyVO 包含 bot: BotVO 和 group_chats: List[GroupChatVO]
 * - 表单需要扁平化的 bot_id 和 chat_ids，使用 adaptStrategyForEdit 适配器转换
 */
export const useStrategyForm = ({
  refreshTable,
}: UseStrategyFormParams): UseStrategyFormResult => {
  // 使用管理刷新 Hook
  const { afterCreate, afterUpdate, afterDelete } =
    useManagementRefresh(refreshTable);

  const [form] = Form.useForm();
  // ✅ 修复：根据 Python 源码分析，API 返回 InformStrategyVO（对应 InformStrategy）
  // 统一使用 InformStrategy（来自 api-generate），符合单一数据源原则
  const [editingStrategy, setEditingStrategy] = useState<InformStrategy | null>(
    null,
  );
  const [modalVisible, setModalVisible] = useState(false);

  // 删除策略处理器
  const handleDelete = useCallback(
    async (strategyId: string) => {
      try {
        const result = await strategyApi.deleteStrategy(strategyId);
        if (result.success) {
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
              source: 'StrategyForm',
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

  // 创建策略处理器
  const handleCreate = useCallback(
    async (values: InformStrategyCreate) => {
      try {
        const result = await strategyApi.createStrategy(values);
        if (result.success) {
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
              source: 'StrategyForm',
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

  // 更新策略处理器
  const handleUpdate = useCallback(
    async (values: InformStrategyUpdate) => {
      if (!editingStrategy || !editingStrategy.id) {
        Message.error('策略 ID 不能为空');
        return false;
      }

      try {
        const result = await strategyApi.updateStrategy(
          editingStrategy.id,
          values,
        );
        if (result.success) {
          setModalVisible(false);
          setEditingStrategy(null);
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
              source: 'StrategyForm',
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
    [editingStrategy, form, afterUpdate],
  );

  // 处理表单提交
  const handleSubmit = useCallback(
    async (values: InformStrategyCreate | InformStrategyUpdate) => {
      // 检查名称重复
      if (values.name) {
        const checkResult = await strategyApi.checkNameDuplicate(
          values.name,
          editingStrategy?.id,
        );
        if (checkResult.isDuplicate) {
          Message.error('策略名称不能重复');
          return false;
        }
      }

      if (editingStrategy) {
        return await handleUpdate(values as InformStrategyUpdate);
      } else {
        return await handleCreate(values as InformStrategyCreate);
      }
    },
    [editingStrategy, handleUpdate, handleCreate],
  );

  // 打开编辑弹窗
  // ✅ 修复：使用 InformStrategy 类型，通过适配器提取表单字段
  // 根据 Python 源码：InformStrategyVO 包含 bot: BotVO 和 group_chats: List[GroupChatVO]
  // 表单需要扁平化的 bot_id 和 chat_ids，使用 adaptStrategyForEdit 适配器转换
  const handleEdit = useCallback(
    (strategy: InformStrategy) => {
      setEditingStrategy(strategy);
      // ✅ 使用类型适配器函数（符合 .cursorrules 规范）
      // adaptStrategyForEdit 会从 InformStrategy.bot.bot_id 和 InformStrategy.group_chats[].open_chat_id 提取值
      const adaptedStrategy = adaptStrategyForEdit(strategy);
      form.setFieldsValue({
        name: strategy.name,
        description: strategy.description,
        channel: strategy.channel || 'Lark',
        // ✅ 类型安全：使用适配器提取的 bot_id 和 chat_ids
        bot_id: adaptedStrategy.bot_id || '',
        chat_ids: adaptedStrategy.chat_ids || [],
      });
      setModalVisible(true);
    },
    [form],
  );

  // 打开新增弹窗
  const handleAdd = useCallback(() => {
    setEditingStrategy(null);
    form.resetFields();
    setModalVisible(true);
  }, [form]);

  // 关闭弹窗
  const handleCancel = useCallback(() => {
    setModalVisible(false);
    setEditingStrategy(null);
    form.resetFields();
  }, [form]);

  return {
    // 状态
    modalVisible,
    editingStrategy,
    form,

    // 事件处理器
    handleEdit,
    handleAdd,
    handleCancel,
    handleSubmit,
    handleDelete,
  };
};
