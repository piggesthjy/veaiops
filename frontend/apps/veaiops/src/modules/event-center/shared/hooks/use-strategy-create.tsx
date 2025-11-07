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

import apiClient from '@/utils/api-client';
import { Form, Message } from '@arco-design/web-react';
import { API_RESPONSE_CODE } from '@veaiops/constants';
import type { InformStrategyCreate, InformStrategyUpdate } from 'api-generate';
import { useState } from 'react';
import { StrategyModal } from '../../features/strategy/ui';
import type {
  UseStrategyCreateConfig,
  UseStrategyCreateReturn,
} from './types/drawer-management';

/**
 * 策略创建Hook
 * 提供策略创建的完整功能，包括状态管理、API调用和UI渲染
 */
export const useStrategyCreate = (
  config: UseStrategyCreateConfig = {},
): UseStrategyCreateReturn => {
  const { onSuccess, width = 800 } = config;

  // 状态管理
  const [visible, setVisible] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [form] = Form.useForm();

  /**
   * 打开策略创建抽屉
   */
  const open = () => {
    setVisible(true);
  };

  /**
   * 关闭策略创建抽屉
   */
  const close = () => {
    setVisible(false);
    form.resetFields();
  };

  /**
   * 处理策略创建
   */
  const handleCreate = async (
    values: InformStrategyCreate | InformStrategyUpdate,
  ): Promise<boolean> => {
    try {
      // 使用策略创建API
      // 确保传入的是InformStrategyCreate类型
      const createData: InformStrategyCreate = {
        name: values.name!,
        description: values.description,
        channel: values.channel!,
        bot_id: values.bot_id!,
        chat_ids: values.chat_ids!,
      };

      const response =
        await apiClient.informStrategy.postApisV1ManagerEventCenterInformStrategy(
          {
            requestBody: createData,
          },
        );

      const success = response.code === API_RESPONSE_CODE.SUCCESS;

      if (!success) {
        Message.error(response.message || '策略创建失败');
      }

      if (success) {
        Message.success('策略创建成功');
        setVisible(false);
        form.resetFields();
        // 触发策略列表刷新
        setRefreshTrigger((prev) => prev + 1);
        // 执行成功回调
        onSuccess?.();
      } else {
        Message.error('策略创建失败，请重试');
      }

      return success;
    } catch (error: unknown) {
      // ✅ 正确：透出实际的错误信息
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      const errorMessage = errorObj.message || '策略创建失败，请重试';
      Message.error(errorMessage);
      return false;
    }
  };

  /**
   * 渲染策略创建抽屉
   */
  const renderDrawer = () => {
    return (
      <StrategyModal
        visible={visible}
        editingStrategy={null}
        onCancel={close}
        onSubmit={handleCreate}
        form={form}
        width={width}
      />
    );
  };

  return {
    visible,
    refreshTrigger,
    open,
    close,
    handleCreate,
    renderDrawer,
  };
};
