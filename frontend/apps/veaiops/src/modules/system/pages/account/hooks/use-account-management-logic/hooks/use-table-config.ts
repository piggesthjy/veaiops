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
import { API_RESPONSE_CODE } from '@veaiops/constants';
import {
  createServerPaginationDataSource,
  createStandardTableProps,
  createTableRequestWithResponseHandler,
  logger,
} from '@veaiops/utils';
import type { User } from 'api-generate';
import { useMemo } from 'react';

/**
 * 账号表格配置Hook
 * 提供数据源配置等（列配置已移至组件中处理）
 *
 * ✅ 已使用工具函数：
 * - createTableRequestWithResponseHandler: 自动处理分页参数和响应
 * - createServerPaginationDataSource: 创建服务器端分页数据源
 * - createStandardTableProps: 创建标准表格属性
 */
export const useAccountTableConfig = ({
  handleEdit: _handleEdit,
  handleDelete: _handleDelete,
}: {
  handleEdit: (user: User) => void;
  handleDelete: (userId: string) => Promise<boolean>;
}) => {
  /**
   * CustomTable的request函数
   * 使用工具函数自动处理分页参数、响应和错误，包含数据转换
   */
  // ✅ 关键修复：使用 useMemo 稳定化 request 函数引用
  const request = useMemo(
    () =>
      createTableRequestWithResponseHandler<User[]>({
        apiCall: async ({ skip, limit, username }) => {
          logger.debug({
            message: '[AccountTableConfig] 🔵 API 请求开始',
            data: { skip, limit, username, timestamp: Date.now() },
            source: 'AccountTableConfig',
            component: 'request',
          });

          const response = await apiClient.users.getApisV1ManagerUsers({
            skip,
            limit,
            username: username as string | undefined,
          });

          logger.debug({
            message: '[AccountTableConfig] ✅ API 请求成功',
            data: {
              dataLength: response.data?.length,
              total: response.total,
              timestamp: Date.now(),
            },
            source: 'AccountTableConfig',
            component: 'request',
          });

          // ✅ 强制类型兼容：PaginatedAPIResponseUserList -> StandardApiResponse<User[]>
          // 确保 code 为 number，满足 StandardApiResponse 要求
          return {
            code: response.code ?? API_RESPONSE_CODE.SUCCESS,
            data: response.data ?? [],
            total:
              response.total ??
              (Array.isArray(response.data) ? response.data.length : 0),
            message: response.message ?? '',
          };
        },
        options: {
          errorMessagePrefix: '获取用户列表失败',
          defaultLimit: 10,
          onError: (error) => {
            logger.error({
              message: '[AccountTableConfig] ❌ API 请求失败',
              data: {
                error: error instanceof Error ? error.message : String(error),
                timestamp: Date.now(),
              },
              source: 'AccountTableConfig',
              component: 'request',
            });
            const errorMessage =
              error instanceof Error
                ? error.message
                : '加载用户列表失败，请重试';
            Message.error(errorMessage);
          },
        },
      }),
    [], // ✅ 空依赖数组，request 函数保持稳定
  );

  // 添加渲染日志
  logger.debug({
    message: '[AccountTableConfig] 🔄 组件渲染',
    data: { hasRequest: Boolean(request), timestamp: Date.now() },
    source: 'AccountTableConfig',
    component: 'useAccountTableConfig',
  });

  // ✅ 使用工具函数创建数据源
  const dataSource = useMemo(() => {
    logger.debug({
      message: '[AccountTableConfig] 🔧 创建 dataSource',
      data: { timestamp: Date.now() },
      source: 'AccountTableConfig',
      component: 'dataSource',
    });
    return createServerPaginationDataSource({ request });
  }, [request]);

  // ✅ 使用工具函数创建表格属性
  const tableProps = useMemo(
    () =>
      createStandardTableProps({
        rowKey: '_id',
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
