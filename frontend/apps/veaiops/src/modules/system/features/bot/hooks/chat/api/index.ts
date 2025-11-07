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

import type { Chat } from 'api-generate';
import { useFetchChats } from './fetch-chats';
import { useFetchBotOptions } from './fetch-options';
import { useUpdateChatConfig } from './update-chat-config';

/**
 * Bot聊天管理API调用Hook
 *
 * 拆分说明：
 * - fetch-bot-options.ts: 获取机器人选项
 * - fetch-chats.ts: 获取群列表
 * - update-chat-config.ts: 更新群配置
 * - index.ts: 统一导出，组合所有API调用
 */
export const useBotChatApi = ({
  setChats,
  setLoading,
  setBotOptions,
}: {
  setChats: (chats: Chat[]) => void;
  setLoading: (loading: boolean) => void;
  setBotOptions: (options: Array<{ label: string; value: string }>) => void;
}) => {
  const { fetchBotOptions } = useFetchBotOptions({ setBotOptions });
  const { fetchChats } = useFetchChats({ setChats, setLoading });
  const { updateChatConfig } = useUpdateChatConfig();

  return {
    fetchBotOptions,
    fetchChats,
    updateChatConfig,
  };
};
