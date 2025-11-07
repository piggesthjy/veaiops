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

import { useBotChatApi } from './api';
import { useBotChatHandlers } from './handlers';
import { useBotChatState } from './state';

/**
 * Bot聊天管理业务逻辑Hook
 *
 * 拆分说明：
 * - state.ts: 状态管理（selectedBotId、chats、loading、configModalVisible等）
 * - api.ts: API调用（fetchBotOptions、fetchChats、updateChatConfig）
 * - handlers.ts: 事件处理（handleConfigEdit、handleConfigSubmit、handleConfigCancel、handleBotChange）
 * - index.ts: 主入口，组合所有逻辑
 */
export const useBotChat = (
  afterUpdate?: () => Promise<{ success: boolean; error?: Error }>,
) => {
  // 状态管理
  const state = useBotChatState();

  // API调用
  const api = useBotChatApi({
    setChats: state.setChats,
    setLoading: state.setLoading,
    setBotOptions: state.setBotOptions,
  });

  // 事件处理
  const handlers = useBotChatHandlers({
    editingChat: state.editingChat,
    setEditingChat: state.setEditingChat,
    setConfigModalVisible: state.setConfigModalVisible,
    setChats: state.setChats,
    chats: state.chats,
    selectedBotId: state.selectedBotId,
    setSelectedBotId: state.setSelectedBotId,
    fetchChats: api.fetchChats,
    updateChatConfig: api.updateChatConfig,
    afterUpdate,
  });

  return {
    // 状态
    selectedBotId: state.selectedBotId,
    chats: handlers.tableData,
    loading: state.loading,
    configModalVisible: state.configModalVisible,
    editingChat: state.editingChat,
    botOptions: state.botOptions,

    // 方法
    fetchBotOptions: api.fetchBotOptions,
    fetchChats: api.fetchChats,
    handleConfigEdit: handlers.handleConfigEdit,
    handleConfigSubmit: handlers.handleConfigSubmit,
    handleConfigCancel: handlers.handleConfigCancel,
    handleBotChange: handlers.handleBotChange,
  };
};

// 导出表格配置Hook
export { useChatTableConfig } from './table-config';

// 导出群管理逻辑Hook
export { useChatManagementLogic } from './management';
