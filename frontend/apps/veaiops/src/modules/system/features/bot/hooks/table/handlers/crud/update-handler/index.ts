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

import type { FormInstance } from '@arco-design/web-react';
import type { UpdateBotParams } from '@bot/hooks';
import type { Bot, BotUpdateRequest } from '@bot/lib';
import { useManagementRefresh } from '@veaiops/hooks';
import { useCallback } from 'react';
import { handleUpdateError } from './error-handler';
import { useUpdateLogic } from './update-logic';
import { validateUpdateRequest } from './validation';

/**
 * 更新处理器参数
 */
interface UpdateHandlerParams {
  editingBot: Bot | null;
  updateBot: (params: UpdateBotParams) => Promise<boolean>;
  form: FormInstance;
  setModalVisible: (visible: boolean) => void;
  setEditingBot: (bot: Bot | null) => void;
  refreshTable: () => Promise<boolean>;
  setLoading: (loading: boolean) => void;
}

/**
 * 更新Bot处理器
 *
 * 拆分说明：
 * - validation.ts: 更新前验证（validateUpdateRequest）
 * - update-logic.ts: 更新逻辑（executeUpdate，包含API调用和刷新）
 * - error-handler.ts: 错误处理（handleUpdateError）
 * - index.ts: 统一导出，组合所有逻辑
 */
export const useUpdateHandler = ({
  editingBot,
  updateBot,
  form,
  setModalVisible,
  setEditingBot,
  refreshTable,
  setLoading,
}: UpdateHandlerParams) => {
  // 使用管理刷新 Hook
  const { afterUpdate } = useManagementRefresh(refreshTable);

  // 更新逻辑
  const { executeUpdate } = useUpdateLogic({
    editingBot,
    updateBot,
    form,
    setModalVisible,
    setEditingBot,
    afterUpdate,
    setLoading,
  });

  const handleUpdate = useCallback(
    async (values: BotUpdateRequest) => {
      // 验证
      if (!validateUpdateRequest({ editingBot })) {
        return false;
      }

      // 执行更新
      try {
        return await executeUpdate(values);
      } catch (error) {
        handleUpdateError({ error, botId: editingBot?._id });
        return false;
      }
    },
    [editingBot, executeUpdate],
  );

  return { handleUpdate };
};
