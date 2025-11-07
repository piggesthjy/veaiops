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
import { API_RESPONSE_CODE } from '@veaiops/constants';
import { logger } from '@veaiops/utils';
import type {
  ChannelType,
  InformStrategyCreate,
  InformStrategyUpdate,
} from 'api-generate';
import { Message } from '@arco-design/web-react';

/**
 * 策略 API 统一接口
 *
 * ✅ 简化命名：合并 strategy-service.ts 的功能到 strategyApi
 *
 * 根据 Python 源码分析（veaiops/handler/routers/apis/v1/event_center/inform_strategy.py）：
 * - GET /inform-strategy/ → getStrategies
 * - POST /inform-strategy/ → createStrategy
 * - PUT /inform-strategy/{uid} → updateStrategy
 * - DELETE /inform-strategy/{uid} → deleteStrategy
 */
export const strategyApi = {
  /**
   * 创建策略
   *
   * @param strategyData - 策略创建数据（InformStrategyCreate，来自 api-generate）
   * @returns 创建成功返回 true，失败返回 false
   */
  async createStrategy(
    strategyData: InformStrategyCreate,
  ): Promise<{ success: boolean; error?: Error }> {
    try {
      const response =
        await apiClient.informStrategy.postApisV1ManagerEventCenterInformStrategy(
          {
            requestBody: strategyData,
          },
        );

      if (response.code === API_RESPONSE_CODE.SUCCESS) {
        Message.success('策略创建成功');
        return { success: true };
      }

      const errorMessage = response.message || '创建策略失败';
      const error = new Error(errorMessage);
      Message.error(errorMessage);
      logger.error({
        message: '创建策略失败',
        data: {
          error: errorMessage,
          errorObj: error,
        },
        source: 'strategyApi',
        component: 'createStrategy',
      });
      return { success: false, error };
    } catch (error: unknown) {
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      const errorMessage = errorObj.message || '创建策略失败';
      Message.error(errorMessage);
      logger.error({
        message: '创建策略失败',
        data: {
          error: errorMessage,
          stack: errorObj.stack,
          errorObj,
        },
        source: 'strategyApi',
        component: 'createStrategy',
      });
      return { success: false, error: errorObj };
    }
  },

  /**
   * 更新策略
   *
   * @param strategyId - 策略 ID
   * @param updateData - 策略更新数据（InformStrategyUpdate，来自 api-generate）
   * @returns 更新成功返回 true，失败返回 false
   */
  async updateStrategy(
    strategyId: string,
    updateData: InformStrategyUpdate,
  ): Promise<{ success: boolean; error?: Error }> {
    try {
      const response =
        await apiClient.informStrategy.putApisV1ManagerEventCenterInformStrategy(
          {
            uid: strategyId,
            requestBody: updateData,
          },
        );

      if (response.code === API_RESPONSE_CODE.SUCCESS) {
        Message.success('策略更新成功');
        return { success: true };
      }

      const errorMessage = response.message || '更新策略失败';
      const error = new Error(errorMessage);
      Message.error(errorMessage);
      logger.error({
        message: '更新策略失败',
        data: {
          error: errorMessage,
          errorObj: error,
        },
        source: 'strategyApi',
        component: 'updateStrategy',
      });
      return { success: false, error };
    } catch (error: unknown) {
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      const errorMessage = errorObj.message || '更新策略失败';
      Message.error(errorMessage);
      logger.error({
        message: '更新策略失败',
        data: {
          error: errorMessage,
          stack: errorObj.stack,
          errorObj,
        },
        source: 'strategyApi',
        component: 'updateStrategy',
      });
      return { success: false, error: errorObj };
    }
  },

  /**
   * 删除策略
   *
   * @param strategyId - 策略 ID
   * @returns 删除成功返回 true，失败返回 false
   */
  async deleteStrategy(
    strategyId: string,
  ): Promise<{ success: boolean; error?: Error }> {
    try {
      const response =
        await apiClient.informStrategy.deleteApisV1ManagerEventCenterInformStrategy(
          {
            uid: strategyId,
          },
        );

      if (response.code === API_RESPONSE_CODE.SUCCESS) {
        Message.success('策略删除成功');
        return { success: true };
      }

      const errorMessage = response.message || '删除策略失败';
      const error = new Error(errorMessage);
      Message.error(errorMessage);
      logger.error({
        message: '删除策略失败',
        data: {
          error: errorMessage,
          errorObj: error,
        },
        source: 'strategyApi',
        component: 'deleteStrategy',
      });
      return { success: false, error };
    } catch (error: unknown) {
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      const errorMessage = errorObj.message || '删除策略失败';
      Message.error(errorMessage);
      logger.error({
        message: '删除策略失败',
        data: {
          error: errorMessage,
          stack: errorObj.stack,
          errorObj,
        },
        source: 'strategyApi',
        component: 'deleteStrategy',
      });
      return { success: false, error: errorObj };
    }
  },

  /**
   * 获取策略列表
   *
   * @param params - 查询参数
   * @returns 策略列表响应
   */
  async getStrategies(params?: {
    skip?: number;
    limit?: number;
    name?: string;
    channel?: ChannelType | string;
    botId?: string;
    showAll?: boolean;
  }) {
    return await apiClient.informStrategy.getApisV1ManagerEventCenterInformStrategy({
      skip: params?.skip || 0,
      limit: params?.limit || 10,
      name: params?.name,
      channel: params?.channel,
      botId: params?.botId,
      showAll: params?.showAll,
    });
  },

  /**
   * 检查策略名称是否重复
   *
   * @param name - 策略名称
   * @param excludeId - 排除的策略 ID（用于更新时检查）
   * @returns 重复返回 true，不重复返回 false
   */
  async checkNameDuplicate(
    name: string,
    excludeId?: string,
  ): Promise<{ isDuplicate: boolean; error?: Error }> {
    try {
      const response =
        await apiClient.informStrategy.getApisV1ManagerEventCenterInformStrategy(
          { showAll: true },
        );

      if (response.code === API_RESPONSE_CODE.SUCCESS && response.data) {
        const isDuplicate = response.data.some(
          (strategy) =>
            strategy.name === name &&
            (!excludeId || strategy.id !== excludeId),
        );
        return { isDuplicate };
      }

      return { isDuplicate: false };
    } catch (error: unknown) {
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      logger.error({
        message: '检查策略名称重复性失败',
        data: {
          error: errorObj.message,
          stack: errorObj.stack,
          errorObj,
        },
        source: 'strategyApi',
        component: 'checkNameDuplicate',
      });
      return { isDuplicate: false, error: errorObj };
    }
  },
};
