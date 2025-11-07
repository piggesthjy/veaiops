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
import type {
  SubscribeRelationCreate,
  SubscribeRelationUpdate,
} from 'api-generate';
import { useCallback } from 'react';

/**
 * CRUD操作Hook
 * 提供订阅关系的创建、更新、删除操作
 */
export const useCrudOperations = () => {
  /**
   * 创建订阅关系
   */
  const createSubscription = useCallback(
    async (subscriptionData: SubscribeRelationCreate): Promise<boolean> => {
      try {
        const response =
          await apiClient.subscribe.postApisV1ManagerEventCenterSubscribe({
            requestBody: subscriptionData,
          });

        if (response.code === API_RESPONSE_CODE.SUCCESS && response.data) {
          Message.success('事件订阅创建成功');
          return true;
        } else {
          throw new Error(response.message || '创建订阅关系失败');
        }
      } catch (error: unknown) {
        // ✅ 正确：透出实际的错误信息
        const errorObj =
          error instanceof Error ? error : new Error(String(error));
        const errorMessage = errorObj.message || '创建订阅关系失败';
        Message.error(errorMessage);
        return false;
      }
    },
    [],
  );

  /**
   * 更新订阅关系参数接口
   */
  interface UpdateSubscriptionParams {
    subscriptionId: string;
    subscriptionData: SubscribeRelationUpdate;
  }

  /**
   * 更新订阅关系
   */
  const updateSubscription = useCallback(
    async ({
      subscriptionId,
      subscriptionData,
    }: UpdateSubscriptionParams): Promise<boolean> => {
      try {
        const response =
          await apiClient.subscribe.putApisV1ManagerEventCenterSubscribe({
            subscriptionId,
            requestBody: subscriptionData,
          });

        if (response.code === API_RESPONSE_CODE.SUCCESS) {
          Message.success('订阅关系更新成功');
          return true;
        } else {
          throw new Error(response.message || '更新订阅关系失败');
        }
      } catch (error: unknown) {
        // ✅ 正确：透出实际的错误信息
        const errorObj =
          error instanceof Error ? error : new Error(String(error));
        const errorMessage = errorObj.message || '更新订阅关系失败';
        Message.error(errorMessage);
        return false;
      }
    },
    [],
  );

  /**
   * 删除订阅关系
   */
  const deleteSubscription = useCallback(
    async (subscriptionId: string): Promise<boolean> => {
      try {
        const response =
          await apiClient.subscribe.deleteApisV1ManagerEventCenterSubscribe({
            subscriptionId,
          });

        if (response.code === API_RESPONSE_CODE.SUCCESS) {
          Message.success('订阅关系删除成功');
          return true;
        } else {
          throw new Error(response.message || '删除订阅关系失败');
        }
      } catch (error: unknown) {
        // ✅ 正确：透出实际的错误信息
        const errorObj =
          error instanceof Error ? error : new Error(String(error));
        const errorMessage = errorObj.message || '删除订阅关系失败';
        Message.error(errorMessage);
        return false;
      }
    },
    [],
  );

  return {
    createSubscription,
    updateSubscription,
    deleteSubscription,
  };
};
