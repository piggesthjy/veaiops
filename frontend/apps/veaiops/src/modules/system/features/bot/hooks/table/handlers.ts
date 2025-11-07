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
import type { UpdateBotParams } from './crud';
import {
  useCrudHandlers,
  useDrawerHandlers,
  useModalHandlers,
} from './handlers/index';
import type { UseBotStateReturn } from './state';

/**
 * 事件处理器Hook的参数
 */
interface UseBotHandlersParams {
  state: UseBotStateReturn;
  createBot: (data: BotCreateRequest) => Promise<boolean>;
  updateBot: (params: UpdateBotParams) => Promise<boolean>;
  deleteBot: (botId: string) => Promise<boolean>;
  refreshTable: () => Promise<boolean>;
}

/**
 * Bot管理的事件处理器Hook
 *
 * 拆分说明：
 * - handlers/crud-handlers.ts: CRUD操作处理器（create, update, delete, submit）
 * - handlers/modal-handlers.ts: 弹窗操作处理器（edit, add, cancel）
 * - handlers/drawer-handlers.ts: 抽屉操作处理器（viewAttributes, chatManagement等）
 * - handlers.ts: 主入口，负责组装和导出
 */
export const useBotHandlers = ({
  state,
  createBot,
  updateBot,
  deleteBot,
  refreshTable,
}: UseBotHandlersParams) => {
  const {
    form,
    editingBot,
    setEditingBot,
    modalVisible,
    setModalVisible,
    selectedBot,
    setSelectedBot,
    attributesDrawerVisible,
    setAttributesDrawerVisible,
    chatManagementDrawerVisible,
    setChatManagementDrawerVisible,
    selectedBotForChat,
    setSelectedBotForChat,
  } = state;

  // CRUD操作处理器
  const { handleDelete, handleCreate, handleUpdate, handleSubmit } =
    useCrudHandlers({
      state,
      createBot,
      updateBot,
      deleteBot,
      refreshTable,
    });

  // 弹窗操作处理器
  const { handleEdit, handleAdd, handleCancel } = useModalHandlers({
    form,
    editingBot,
    setEditingBot,
    modalVisible,
    setModalVisible,
  });

  // 抽屉操作处理器
  const {
    handleViewAttributes,
    handleCloseAttributesDrawer,
    handleChatManagement,
    handleCloseChatManagementDrawer,
  } = useDrawerHandlers({
    selectedBot,
    setSelectedBot,
    attributesDrawerVisible,
    setAttributesDrawerVisible,
    selectedBotForChat,
    setSelectedBotForChat,
    chatManagementDrawerVisible,
    setChatManagementDrawerVisible,
  });

  return {
    handleEdit,
    handleAdd,
    handleCancel,
    handleSubmit,
    handleDelete,
    handleViewAttributes,
    handleCloseAttributesDrawer,
    handleChatManagement,
    handleCloseChatManagementDrawer,
  };
};
