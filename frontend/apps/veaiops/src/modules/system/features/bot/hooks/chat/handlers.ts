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

import type { ChatConfigFormData, ChatQueryParams } from '@bot/lib';
import { logger } from '@veaiops/utils';
import type { Chat } from 'api-generate';
import { useCallback, useMemo } from 'react';

/**
 * Bot聊天管理事件处理Hook
 */
export const useBotChatHandlers = ({
  editingChat,
  setEditingChat,
  setConfigModalVisible,
  setChats,
  chats,
  selectedBotId,
  setSelectedBotId,
  fetchChats,
  updateChatConfig,
  afterUpdate,
}: {
  editingChat: Chat | null;
  setEditingChat: (chat: Chat | null) => void;
  setConfigModalVisible: (visible: boolean) => void;
  setChats: (chats: Chat[]) => void;
  chats: Chat[];
  selectedBotId: string;
  setSelectedBotId: (botId: string) => void;
  fetchChats: (params?: ChatQueryParams) => Promise<void>;
  updateChatConfig: (params: {
    uid: string;
    config: ChatConfigFormData;
  }) => Promise<boolean>;
  afterUpdate?: () => Promise<{ success: boolean; error?: Error }>;
}) => {
  // 处理配置编辑
  const handleConfigEdit = useCallback(
    (chat: Chat) => {
      setEditingChat(chat);
      setConfigModalVisible(true);
    },
    [setEditingChat, setConfigModalVisible],
  );

  // 处理配置提交
  const handleConfigSubmit = useCallback(
    async (config: ChatConfigFormData) => {
      if (!editingChat?._id) {
        return false;
      }

      const success = await updateChatConfig({
        uid: editingChat._id,
        config: {
          enable_func_proactive_reply: config.enable_func_proactive_reply,
          enable_func_interest: config.enable_func_interest,
        },
      });

      if (success) {
        setConfigModalVisible(false);
        // 配置更新成功后刷新表格
        if (afterUpdate) {
          const refreshResult = await afterUpdate();
          if (!refreshResult.success && refreshResult.error) {
            logger.warn({
              message: '更新后刷新表格失败',
              data: {
                error: refreshResult.error.message,
                stack: refreshResult.error.stack,
                errorObj: refreshResult.error,
              },
              source: 'BotChatManagement',
              component: 'handleConfigSave',
            });
          }
        }
      }
      return success;
    },
    [editingChat, updateChatConfig, afterUpdate, setConfigModalVisible],
  );

  // 处理配置取消
  const handleConfigCancel = useCallback(() => {
    setConfigModalVisible(false);
    setEditingChat(null);
  }, [setConfigModalVisible, setEditingChat]);

  // 处理机器人选择变化
  const handleBotChange = useCallback(
    (botId: string) => {
      setSelectedBotId(botId);
      if (botId) {
        fetchChats({ bot_id: botId });
      } else {
        setChats([]);
      }
    },
    [setSelectedBotId, fetchChats, setChats],
  );

  // 转换为表格数据
  const tableData = useMemo((): Chat[] => {
    return chats.map((chat) => ({
      ...chat,
      key: chat.chat_id || '',
    }));
  }, [chats]);

  return {
    handleConfigEdit,
    handleConfigSubmit,
    handleConfigCancel,
    handleBotChange,
    tableData,
  };
};
