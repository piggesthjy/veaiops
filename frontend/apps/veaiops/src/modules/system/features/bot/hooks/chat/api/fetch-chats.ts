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
import { Message } from '@arco-design/web-react';
import type { ChatQueryParams } from '@bot/lib';
import { API_RESPONSE_CODE, PAGINATION } from '@veaiops/constants';
import { logger } from '@veaiops/utils';
import type { Chat } from 'api-generate';
import { useCallback } from 'react';

/**
 * 获取群列表Hook
 */
export const useFetchChats = ({
  setChats,
  setLoading,
}: {
  setChats: (chats: Chat[]) => void;
  setLoading: (loading: boolean) => void;
}) => {
  const fetchChats = useCallback(
    async (params: ChatQueryParams = {}) => {
      if (!params.bot_id) {
        setChats([]);
        return;
      }

      try {
        setLoading(true);
        // 调用真实API获取群聊列表
        const response = await apiClient.chats.getApisV1ConfigChats({
          uid: params.bot_id,
          skip: params.skip || PAGINATION.DEFAULT_SKIP,
          limit: params.limit || PAGINATION.DEFAULT_LIMIT,
          forceUpdate: params.force_refresh || false,
        });

        if (response.code === API_RESPONSE_CODE.SUCCESS && response.data) {
          const apiChatList = response.data || [];

          // ✅ 使用 logger 记录调试信息（logger 内部会处理开发环境判断）
          logger.debug({
            message: '获取群聊列表响应',
            data: {
              params,
              sample: Array.isArray(apiChatList)
                ? apiChatList.slice(0, 3)
                : apiChatList,
            },
            source: 'useBotChat',
            component: 'fetchChats',
          });

          // 直接使用API返回的Chat数据结构，显式保留 enable_func_* 字段
          const chatList: Chat[] = apiChatList.map((apiChat: Chat) => ({
            ...apiChat,
            // 确保必要字段存在
            _id: apiChat._id,
            chat_id: apiChat.chat_id,
            name: apiChat.name,
            chat_type: apiChat.chat_type,
            channel: apiChat.channel,
            bot_id: apiChat.bot_id || params.bot_id || '',
            // 保留并规范化功能开关字段。后端默认 true，若未提供则设为 true 以保证 UI 行为一致。
            enable_func_proactive_reply:
              apiChat.enable_func_proactive_reply ?? false,
            enable_func_interest: apiChat.enable_func_interest ?? false,
            created_at: apiChat.created_at,
            updated_at: apiChat.updated_at,
          }));
          setChats(chatList);
          if (chatList.length === 0) {
            Message.info('该机器人暂无关联的群聊');
          }
        } else {
          throw new Error(response.message || '获取群聊列表失败');
        }
      } catch (error) {
        // ✅ 正确：透出实际的错误信息
        const errorMessage =
          error instanceof Error ? error.message : '获取群列表失败，请重试';
        Message.error(errorMessage);
        setChats([]);
      } finally {
        setLoading(false);
      }
    },
    [setChats, setLoading],
  );

  return {
    fetchChats,
  };
};
