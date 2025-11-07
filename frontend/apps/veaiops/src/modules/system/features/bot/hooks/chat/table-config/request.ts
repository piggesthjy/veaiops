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
import { API_RESPONSE_CODE, PAGINATION } from '@veaiops/constants';
import {
  type StandardApiResponse,
  createServerPaginationDataSource,
  createTableRequestWithResponseHandler,
} from '@veaiops/utils';
import type { Chat } from 'api-generate';
import { useMemo } from 'react';

/**
 * API请求配置Hook
 *
 * ✅ 已使用工具函数：
 * - createTableRequestWithResponseHandler: 自动处理分页参数和响应
 * - createServerPaginationDataSource: 创建服务器端分页数据源
 */
export const useChatTableRequest = () => {
  /**
   * CustomTable的request函数
   * 使用工具函数自动处理分页参数、响应和错误
   */
  const request = useMemo(
    () =>
      createTableRequestWithResponseHandler({
        apiCall: async ({
          skip,
          limit,
          uid,
          force_refresh,
          is_active,
          name,
          enable_func_interest,
          enable_func_proactive_reply,
        }) => {
          // 如果没有 uid，返回空数据
          if (
            !uid ||
            (typeof uid === 'object' && Object.keys(uid || {}).length === 0)
          ) {
            return {
              code: API_RESPONSE_CODE.SUCCESS,
              data: [],
              total: 0,
              message: '',
            } as StandardApiResponse<Chat[]>;
          }

          const response = await apiClient.chats.getApisV1ConfigChats({
            uid: typeof uid === 'string' ? uid : String(uid || ''),
            skip: skip || PAGINATION.DEFAULT_SKIP,
            limit: limit || PAGINATION.DEFAULT_LIMIT,
            forceUpdate:
              typeof force_refresh === 'boolean'
                ? force_refresh
                : Boolean(force_refresh),
            isActive:
              typeof is_active === 'boolean'
                ? is_active
                : is_active !== undefined
                  ? Boolean(is_active)
                  : true, // ✅ 默认查询 is_active=true 的群聊（已经"删除"的不再默认展示）
            name:
              typeof name === 'string' && name.trim() ? name.trim() : undefined,
            enableFuncInterest:
              typeof enable_func_interest === 'boolean'
                ? enable_func_interest
                : enable_func_interest !== undefined
                  ? Boolean(enable_func_interest)
                  : undefined,
            enableFuncProactiveReply:
              typeof enable_func_proactive_reply === 'boolean'
                ? enable_func_proactive_reply
                : enable_func_proactive_reply !== undefined
                  ? Boolean(enable_func_proactive_reply)
                  : undefined,
          });
          // 类型转换：PaginatedAPIResponseChatList 与 StandardApiResponse<Chat[]> 结构兼容
          return response as unknown as StandardApiResponse<Chat[]>;
        },
        options: {
          errorMessagePrefix: '获取群列表失败',
          defaultLimit: 10,
        },
      }),
    [],
  );

  // ✅ 使用工具函数创建数据源
  const dataSource = useMemo(
    () => createServerPaginationDataSource({ request }),
    [request],
  );

  return {
    request,
    dataSource,
  };
};
