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

import { useChatManagementLogicApi } from './api';
import { useChatManagementLogicHandlers } from './handlers';
import { useChatManagementLogicState } from './state';

/**
 * 群管理业务逻辑Hook
 *
 * 对应 origin/feat/web-v2 分支的实现，确保功能一致性
 *
 * 拆分说明：
 * - state.ts: 状态管理（configModalVisible、editingChat）
 * - api.ts: API调用（updateChatConfig）
 * - handlers.ts: 事件处理（handleConfigEdit、handleConfigSubmit、handleConfigCancel）
 * - index.ts: 主入口，负责逻辑组装
 */
export const useChatManagementLogic = (
  afterUpdate?: () =>
    | Promise<boolean>
    | Promise<{ success: boolean; error?: Error }>,
) => {
  // 状态管理
  const state = useChatManagementLogicState();

  // API调用
  const api = useChatManagementLogicApi();

  // 事件处理
  const handlers = useChatManagementLogicHandlers({
    editingChat: state.editingChat,
    setEditingChat: state.setEditingChat,
    setConfigModalVisible: state.setConfigModalVisible,
    updateChatConfig: api.updateChatConfig,
    afterUpdate,
  });

  return {
    configModalVisible: state.configModalVisible,
    editingChat: state.editingChat,
    handleConfigEdit: handlers.handleConfigEdit,
    handleConfigSubmit: handlers.handleConfigSubmit,
    handleConfigCancel: handlers.handleConfigCancel,
  };
};
