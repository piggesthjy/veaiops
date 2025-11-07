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
import type { Bot } from '@bot/lib';
import {
  type StandardApiResponse,
  createServerPaginationDataSource,
  createStandardTableProps,
  createTableRequestWithResponseHandler,
} from '@veaiops/utils';
import type { ChannelType } from 'api-generate';
import { useMemo } from 'react';

/**
 * Bot表格配置Hook
 * 提供数据源配置等（列配置已移至组件中处理）
 *
 * ✅ 已使用工具函数：
 * - createTableRequestWithResponseHandler: 自动处理分页参数和响应
 * - createServerPaginationDataSource: 创建服务器端分页数据源
 * - createStandardTableProps: 创建标准表格属性
 */
export const useBotTableConfig = ({
  handleDelete: _handleDelete,
}: {
  handleDelete: (botId: string) => Promise<boolean>;
}) => {
  /**
   * CustomTable的request函数
   * 使用工具函数自动处理分页参数、响应和错误
   */
  const request = useMemo(
    () =>
      createTableRequestWithResponseHandler({
        apiCall: async ({ skip, limit, name, channel }) => {
          const response =
            await apiClient.bots.getApisV1ManagerSystemConfigBots({
              skip,
              limit,
              name: name as string | undefined,
              channel: channel as ChannelType | undefined,
            });
          // 类型转换：APIResponseBotList 与 StandardApiResponse<Bot[]> 结构兼容
          return response as unknown as StandardApiResponse<Bot[]>;
        },
        options: {
          errorMessagePrefix: '获取机器人列表失败',
          defaultLimit: 10,
          onError: (error) => {
            // ✅ 正确：通过 onError 回调处理 UI 错误提示
            const errorMessage =
              error instanceof Error
                ? error.message
                : '加载机器人列表失败，请重试';
            Message.error(errorMessage);
          },
        },
      }),
    [],
  );

  // ✅ 使用工具函数创建数据源 - 使用 useMemo 稳定化引用
  const dataSource = useMemo(
    () => createServerPaginationDataSource({ request }),
    [request],
  );

  // ✅ 使用工具函数创建表格属性 - 使用 useMemo 稳定化引用
  const tableProps = useMemo(
    () =>
      createStandardTableProps({
        rowKey: 'bot_id',
        pageSize: 10,
        scrollX: 1000,
      }),
    [],
  );

  return {
    dataSource,
    tableProps,
  };
};
