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
import { Button, Message } from '@arco-design/web-react';
import { IconRefresh } from '@arco-design/web-react/icon';
import type { HistoryFilters } from '@ec/history';
import {
  type StandardApiResponse,
  createServerPaginationDataSource,
  createStandardTableProps,
  createTableRequestWithResponseHandler,
} from '@veaiops/utils';
import { type AgentType, type Event, EventLevel } from 'api-generate';
import { useMemo, useState } from 'react';

/**
 * 历史事件管理逻辑Hook
 * 提供历史事件的状态管理和业务逻辑
 */
export const useHistoryManagementLogic = () => {
  const [filters, setFilters] = useState<HistoryFilters>({});
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<Event | null>(null);

  const handleViewDetail = (record: Event) => {
    setSelectedRecord(record);
    setDrawerVisible(true);
  };

  const handleCloseDetail = () => {
    setDrawerVisible(false);
    setSelectedRecord(null);
  };

  const updateFilters = (newFilters: Partial<HistoryFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  return {
    filters,
    drawerVisible,
    selectedRecord,
    handleViewDetail,
    handleCloseDetail,
    updateFilters,
  };
};

/**
 * 历史事件表格配置Hook
 * 提供CustomTable所需的数据源配置
 */
export const useHistoryTableConfig = ({
  filters,
}: {
  filters: HistoryFilters;
}) => {
  const request = useMemo(
    () =>
      createTableRequestWithResponseHandler({
        apiCall: async ({ skip, limit }) => {
          // 构建API参数 - 使用生成的 API 类型，确保类型完全匹配
          type ApiParams = Parameters<
            typeof apiClient.event.getApisV1ManagerEventCenterEvent
          >[0];
          // 注意：API 参数类型不包含 status 字段（只有 showStatus），但 historyService 层会处理 status 到 event_status 的映射
          const apiParams: Partial<ApiParams> & {
            skip: number;
            limit: number;
            status?: number[];
          } = {
            skip: skip ?? 0,
            limit: limit ?? 10,
          };

          // 处理代理类型（API 支持数组）
          // ✅ 类型安全：使用类型断言，确保数组元素类型匹配
          if (
            filters.agent_type &&
            Array.isArray(filters.agent_type) &&
            filters.agent_type.length > 0
          ) {
            apiParams.agentType = filters.agent_type as AgentType[];
          }

          // 处理事件级别
          // ✅ 类型安全：根据 Python 源码分析（veaiops/handler/routers/apis/v1/event_center/event.py）
          // Python: event_level: Optional[List[EventLevel]] = None
          // Python EventLevel 枚举（veaiops/schema/types.py）: P0, P1, P2
          // OpenAPI 规范: Array<EventLevel>，其中 EventLevel 枚举为 ["P0", "P1", "P2"]
          // 生成的 TypeScript: EventLevel 枚举包含 P0, P1, P2
          // API 服务期望: Array<EventLevel>（与 Python 后端一致）
          if (filters.event_level) {
            if (Array.isArray(filters.event_level)) {
              // 数组类型：过滤有效的 EventLevel 枚举值
              const validLevels = filters.event_level.filter(
                (level): level is EventLevel =>
                  level === EventLevel.P0 ||
                  level === EventLevel.P1 ||
                  level === EventLevel.P2,
              );
              if (validLevels.length > 0) {
                // ✅ 类型匹配：validLevels 是 EventLevel[]，符合 API 期望的 Array<EventLevel>
                apiParams.eventLevel = validLevels;
              }
            } else if (
              typeof filters.event_level === 'string' &&
              (filters.event_level === EventLevel.P0 ||
                filters.event_level === EventLevel.P1 ||
                filters.event_level === EventLevel.P2)
            ) {
              // 单个值：转换为数组
              apiParams.eventLevel = [filters.event_level as EventLevel];
            }
          }

          // 处理状态（中文）
          if (filters.show_status && filters.show_status.length > 0) {
            apiParams.showStatus = filters.show_status;
          }

          // 处理事件状态（使用 status 参数，对应后端的 event_status）
          // 注意：HistoryFilters 类型包含 status 字段
          if (filters.status && filters.status.length > 0) {
            apiParams.status = filters.status;
          }

          // 处理时间范围
          if (filters.start_time) {
            apiParams.startTime = filters.start_time;
          }
          if (filters.end_time) {
            apiParams.endTime = filters.end_time;
          }

          const response =
            await apiClient.event.getApisV1ManagerEventCenterEvent(apiParams);
          // 类型转换：PaginatedAPIResponseEventList 与 StandardApiResponse<Event[]> 结构兼容
          return response as unknown as StandardApiResponse<Event[]>;
        },
        options: {
          errorMessagePrefix: '获取历史事件失败',
          defaultLimit: 10,
          onError: (error) => {
            const errorMessage =
              error instanceof Error
                ? error.message
                : '获取历史事件失败，请重试';
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
      }),
    [filters],
  );

  const dataSource = useMemo(
    () => createServerPaginationDataSource({ request }),
    [request],
  );

  const tableProps = useMemo(
    () =>
      createStandardTableProps({
        rowKey: '_id',
        pageSize: 10,
        scrollX: 1400,
      }),
    [],
  );

  return {
    dataSource,
    tableProps,
  };
};

/**
 * 历史事件操作按钮配置Hook
 */
export const useHistoryActionConfig = ({
  loading = false,
}: {
  loading?: boolean;
}) => {
  const actionButtons = [
    <Button key="refresh" icon={<IconRefresh />} loading={loading}>
      刷新
    </Button>,
  ];

  return {
    actionButtons,
  };
};
