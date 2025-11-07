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
import type { Event } from '@veaiops/api-client';
import {
  type HistoryModuleType,
  getAllowedAgentTypes,
} from '@veaiops/components';
import { API_RESPONSE_CODE } from '@veaiops/constants';
import {
  type StandardApiResponse,
  createTableRequestWithResponseHandler,
  logger,
} from '@veaiops/utils';
import { useMemo } from 'react';

/**
 * 创建历史事件表格的请求函数
 * 根据模块类型自动过滤智能体选项
 */
export const useEventHistoryRequest = ({
  moduleType,
}: {
  moduleType: HistoryModuleType;
}) => {
  const request = useMemo(() => {
    return createTableRequestWithResponseHandler<Event>({
      apiCall: async ({
        skip,
        limit,
        agent_type,
        event_level,
        show_status,
        start_time,
        end_time,
        sort_columns,
      }) => {
        const allowedAgentTypes = getAllowedAgentTypes(moduleType);

        // 构建 API 参数
        const apiParams: Parameters<
          typeof apiClient.event.getApisV1ManagerEventCenterEvent
        >[0] = {
          skip: skip ?? 0,
          limit: limit ?? 10,
        };

        // 智能体类型筛选（根据模块类型过滤）
        if (agent_type && (agent_type as string[]).length > 0) {
          const selectedTypes = agent_type as string[];
          const filteredTypes = selectedTypes.filter((type) =>
            allowedAgentTypes.includes(type as any),
          );
          if (filteredTypes.length > 0) {
            apiParams.agentType = filteredTypes as any;
          }
        } else {
          // 如果没有选择，默认使用模块允许的类型
          apiParams.agentType = allowedAgentTypes as any;
        }

        // 事件级别
        if (event_level && event_level !== '') {
          apiParams.eventLevel = event_level as any;
        }

        // 状态
        if (show_status && (show_status as string[]).length > 0) {
          apiParams.showStatus = show_status as string[];
        }

        // 时间范围
        if (start_time) {
          apiParams.startTime = start_time as string;
        }
        if (end_time) {
          apiParams.endTime = end_time as string;
        }

        // 排序参数处理
        // 后端只支持 sort_order 参数（"asc" 或 "desc"），固定按 created_at 排序
        // CustomTable 传递的是 sort_columns 格式，需要转换为 sort_order
        if (
          sort_columns &&
          Array.isArray(sort_columns) &&
          sort_columns.length > 0
        ) {
          const sortColumn = sort_columns[0];
          // 后端固定按 created_at 排序，只需要传递 sort_order
          apiParams.sortOrder = sortColumn.desc ? 'desc' : 'asc';

          // 添加日志：排序参数转换
          logger.info({
            message: '事件历史表格排序参数转换',
            data: {
              receivedSortColumns: sort_columns,
              convertedSortOrder: apiParams.sortOrder,
              sortColumnField: sortColumn.column,
              sortColumnDesc: sortColumn.desc,
            },
            source: 'useEventHistoryRequest',
            component: 'apiCall',
          });
        }

        // 添加日志：完整的 API 请求参数
        logger.info({
          message: '事件历史表格 API 请求参数',
          data: {
            apiParams,
            moduleType,
            hasAgentType: Boolean(apiParams.agentType),
            hasSortOrder: Boolean(apiParams.sortOrder),
          },
          source: 'useEventHistoryRequest',
          component: 'apiCall',
        });

        const response =
          await apiClient.event.getApisV1ManagerEventCenterEvent(apiParams);

        // 添加日志：API 响应结果
        logger.info({
          message: '事件历史表格 API 响应',
          data: {
            responseCode: response.code,
            dataLength: Array.isArray(response.data) ? response.data.length : 0,
            total: response.total,
          },
          source: 'useEventHistoryRequest',
          component: 'apiCall',
        });

        return response as unknown as StandardApiResponse<Event[]>;
      },
      options: {
        errorMessagePrefix: '获取历史事件失败',
        defaultLimit: 10,
        onError: (error) => {
          const errorMessage =
            error instanceof Error ? error.message : '获取历史事件失败，请重试';
          Message.error(errorMessage);
        },
        transformData: <T = Event>(data: unknown): T[] => {
          if (Array.isArray(data)) {
            return data.map((item: Event) => ({
              ...item,
              key: item._id || Math.random().toString(),
            })) as T[];
          }
          return [];
        },
      },
    });
  }, [moduleType]);

  return request;
};
