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

import type { BotTableRef } from '@bot/lib';
import type { RefObject } from 'react';
import { useCreateBot, useDeleteBot, useUpdateBot } from './crud';
import { useBotHandlers } from './handlers';
import { useRefreshBotTable } from './refresh';
import { useBotState } from './state';

/**
 * Bot管理相关Hooks统一导出
 */
export { useBotTableConfig } from './config';
export { useBotActionConfig } from './action-config';

// CRUD 相关类型导出
export type { UpdateBotParams } from './crud';

/**
 * Bot管理逻辑Hook
 * 提供Bot管理页面的所有业务逻辑
 *
 * @param tableRef - BotTable 的 ref，用于刷新表格
 */
export const useBot = (tableRef?: RefObject<BotTableRef>) => {
  // 刷新表格函数
  const refreshTable = useRefreshBotTable(tableRef);

  // 状态管理
  const state = useBotState();

  // CRUD操作
  const createBotFn = useCreateBot();
  const updateBotFn = useUpdateBot();
  const deleteBotFn = useDeleteBot();

  // 事件处理器
  const handlers = useBotHandlers({
    state,
    createBot: createBotFn,
    updateBot: updateBotFn,
    deleteBot: deleteBotFn,
    refreshTable,
  });

  return {
    // 状态
    modalVisible: state.modalVisible,
    editingBot: state.editingBot,
    form: state.form,
    loading: state.loading,

    // 属性管理状态
    selectedBot: state.selectedBot,
    attributesDrawerVisible: state.attributesDrawerVisible,

    // 群管理状态
    chatManagementDrawerVisible: state.chatManagementDrawerVisible,
    selectedBotForChat: state.selectedBotForChat,

    // 事件处理器
    ...handlers,
  };
};
