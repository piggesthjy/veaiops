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

import type { BotCreateRequest, BotUpdateRequest } from '@bot/lib';
import { useCallback } from 'react';
import type { UpdateBotParams } from '../crud';
import type { UseBotStateReturn } from '../state';
import { useCreateHandler, useDeleteHandler, useUpdateHandler } from './crud';

/**
 * CRUD操作处理器参数
 */
interface CrudHandlersParams {
  state: UseBotStateReturn;
  createBot: (data: BotCreateRequest) => Promise<boolean>;
  updateBot: (params: UpdateBotParams) => Promise<boolean>;
  deleteBot: (botId: string) => Promise<boolean>;
  refreshTable: () => Promise<boolean>;
}

/**
 * CRUD操作处理器
 *
 * 拆分说明：
 * - crud/create-handler.ts: 创建Bot处理器
 * - crud/update-handler.ts: 更新Bot处理器
 * - crud/delete-handler.ts: 删除Bot处理器
 * - crud-handlers.ts: 主入口，负责组装和导出
 */
export const useCrudHandlers = ({
  state,
  createBot,
  updateBot,
  deleteBot,
  refreshTable,
}: CrudHandlersParams) => {
  const { form, editingBot, setEditingBot, setModalVisible, setLoading } =
    state;

  // 创建处理器
  const { handleCreate } = useCreateHandler({
    createBot,
    form,
    setModalVisible,
    refreshTable,
    setLoading,
  });

  // 更新处理器
  const { handleUpdate } = useUpdateHandler({
    editingBot,
    updateBot,
    form,
    setModalVisible,
    setEditingBot,
    refreshTable,
    setLoading,
  });

  // 删除处理器
  const { handleDelete } = useDeleteHandler({
    deleteBot,
  });

  // 处理表单提交
  const handleSubmit = useCallback(
    async (values: BotCreateRequest | BotUpdateRequest): Promise<boolean> => {
      // 表单校验成功后，开始 loading
      setLoading(true);
      try {
        if (editingBot) {
          return await handleUpdate(values as BotUpdateRequest);
        } else {
          return await handleCreate(values as BotCreateRequest);
        }
      } finally {
        // 请求完成后停止 loading
        setLoading(false);
      }
    },
    [editingBot, handleUpdate, handleCreate, setLoading],
  );

  return {
    handleDelete,
    handleCreate,
    handleUpdate,
    handleSubmit,
  };
};
