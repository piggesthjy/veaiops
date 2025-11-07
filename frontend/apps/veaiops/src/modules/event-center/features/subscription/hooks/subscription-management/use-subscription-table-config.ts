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
import { createTableRequestWrapper, logger } from '@veaiops/utils';
import type {
  PaginatedAPIResponseSubscribeRelationList,
  SubscribeRelationWithAttributes,
} from 'api-generate';
import React, { useMemo } from 'react';
import { transformSubscriptionToTableData } from './lib/utils';

/**
 * 订阅关系表格配置Hook
 * 提供数据源配置等（列配置已移至组件中处理）
 */
export const useSubscriptionTableConfig = ({
  handleEdit: _handleEdit,
  handleDelete: _handleDelete,
}: {
  handleEdit: (subscription: SubscribeRelationWithAttributes) => void;
  handleDelete: (subscriptionId: string) => Promise<boolean>;
}) => {
  // 🔍 Hook 执行计数（用于调试）
  const hookExecutionRef = React.useRef(0);
  hookExecutionRef.current++;

  logger.debug({
    message: '[useSubscriptionTableConfig] Hook 执行',
    data: {
      executionCount: hookExecutionRef.current,
      handleEditRef: _handleEdit,
      handleDeleteRef: _handleDelete,
    },
    source: 'useSubscriptionTableConfig',
    component: 'useSubscriptionTableConfig',
  });

  /**
   * CustomTable的request函数
   * 🔧 使用 useMemo 稳定化函数引用，避免触发不必要的表格刷新
   * 直接调用API获取数据
   */
  const request = useMemo(
    () => {
      logger.debug({
        message: '[useSubscriptionTableConfig] request 函数创建',
        data: {
          executionCount: hookExecutionRef.current,
        },
        source: 'useSubscriptionTableConfig',
        component: 'useMemo',
      });

      return createTableRequestWrapper({
        apiCall: async (
          params: Record<string, unknown>,
        ): Promise<{
          data: SubscribeRelationWithAttributes[];
          total: number;
        }> => {
          try {
            // ✅ 修复：传递所有查询参数（agents、event_levels 等）
            const response: PaginatedAPIResponseSubscribeRelationList =
              await apiClient.subscribe.getApisV1ManagerEventCenterSubscribe({
                skip: (params.skip as number) || 0,
                limit: (params.limit as number) || 10,
                ...params, // ✅ 传递其他查询参数，如 agents、event_levels、enable_webhook 等
              });

            if (response.code === API_RESPONSE_CODE.SUCCESS && response.data) {
              const tableData = response.data.map(
                transformSubscriptionToTableData,
              );
              return {
                data: tableData,
                // response 类型已明确为 PaginatedAPIResponseSubscribeRelationList，有 total 字段
                total: response.total ?? tableData.length,
              };
            } else {
              throw new Error(response.message || '获取订阅关系列表失败');
            }
          } catch (error) {
            Message.error('加载订阅关系列表失败，请重试');
            return {
              data: [],
              total: 0,
            };
          }
        },
        defaultLimit: 10,
      });
    },
    [], // request 函数不依赖任何外部变量，使用空依赖数组
  );

  // 🔧 使用 useMemo 稳定化 dataSource 对象引用，避免触发不必要的表格刷新
  const dataSource = useMemo(() => {
    logger.debug({
      message: '[useSubscriptionTableConfig] dataSource 对象创建',
      data: {
        executionCount: hookExecutionRef.current,
        requestRef: request,
      },
      source: 'useSubscriptionTableConfig',
      component: 'useMemo',
    });

    return {
      request,
      ready: true,
      isServerPagination: true,
    };
  }, [request]);

  // 🔧 使用 useMemo 稳定化 tableProps 对象引用
  const tableProps = useMemo(
    () => ({
      rowKey: '_id',
      scroll: { x: 2000 },
      pagination: {
        pageSize: 10,
        showTotal: (total: number) => `共 ${total} 条记录`,
        showJumper: true,
        sizeCanChange: true,
        sizeOptions: [10, 20, 50, 100],
      },
    }),
    [],
  );

  return {
    dataSource,
    tableProps,
  };
};
