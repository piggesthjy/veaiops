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

import type { ModuleType } from '@/types/module';
import apiClient from '@/utils/api-client';
import { Message } from '@arco-design/web-react';
import type {
  SubscribeRelationCreate,
  SubscribeRelationUpdate,
  SubscribeRelationWithAttributes,
} from 'api-generate';
import { useCallback, useEffect, useState } from 'react';

/**
 * 订阅关系管理Hook
 */
export function useSubscribeRelation(_moduleType: ModuleType) {
  const [subscribeRelations, setSubscribeRelations] = useState<
    SubscribeRelationWithAttributes[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 获取订阅关系列表
   */
  const fetchSubscribeRelations = useCallback(
    async ({
      skip = 0,
      limit = 10,
      name,
    }: { skip?: number; limit?: number; name?: string } = {}) => {
      try {
        setLoading(true);
        setError(null);

        const response =
          await apiClient.subscribe.getApisV1ManagerEventCenterSubscribe({
            skip,
            limit,
            name,
            agents: ['intelligent_threshold_agent'],
          });

        if (response.data) {
          setSubscribeRelations(response.data);
        }
      } catch (error) {
        // ✅ 正确：透出实际的错误信息
        const errorMessage =
          error instanceof Error ? error.message : '获取订阅关系列表失败';
        setError(errorMessage);

        Message.error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /**
   * 创建订阅关系
   */
  const createSubscribeRelation = useCallback(
    async (data: SubscribeRelationCreate): Promise<boolean> => {
      try {
        const response =
          await apiClient.subscribe.postApisV1ManagerEventCenterSubscribe({
            requestBody: data,
          });

        if (response.data) {
          setSubscribeRelations((prev) => [...prev, response.data!]);
          Message.success('事件订阅创建成功');
          return true;
        }
        return false;
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
   * 更新订阅关系
   */
  const updateSubscribeRelation = useCallback(
    async ({
      id,
      data,
    }: { id: string; data: SubscribeRelationUpdate }): Promise<boolean> => {
      try {
        const response =
          await apiClient.subscribe.putApisV1ManagerEventCenterSubscribe({
            uid: id,
            requestBody: data,
          });

        if (response.data) {
          setSubscribeRelations((prev) =>
            prev.map((item) =>
              item._id === id ? { ...item, ...response.data } : item,
            ),
          );
          Message.success('订阅关系更新成功');
          return true;
        }
        return false;
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
  const deleteSubscribeRelation = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await apiClient.subscribe.deleteApisV1ManagerEventCenterSubscribe({
          uid: id,
        });

        setSubscribeRelations((prev) => prev.filter((item) => item._id !== id));
        Message.success('订阅关系删除成功');
        return true;
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

  /**
   * 获取单个订阅关系详情
   */
  const getSubscribeRelationById = useCallback(
    async (id: string): Promise<SubscribeRelationWithAttributes | null> => {
      try {
        const response =
          await apiClient.subscribe.getApisV1ManagerEventCenterSubscribe1({
            uid: id,
          });

        if (response.data) {
          return response.data;
        }
        return null;
      } catch (error) {
        // ✅ 正确：透出实际的错误信息
        const errorMessage =
          error instanceof Error ? error.message : '获取订阅关系详情失败';

        Message.error(errorMessage);
        return null;
      }
    },
    [],
  );

  // 组件挂载时自动获取数据
  useEffect(() => {
    fetchSubscribeRelations();
  }, [fetchSubscribeRelations]);

  return {
    subscribeRelations,
    loading,
    error,
    fetchSubscribeRelations,
    createSubscribeRelation,
    updateSubscribeRelation,
    deleteSubscribeRelation,
    getSubscribeRelationById,
  };
}
