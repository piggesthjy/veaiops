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

import type {
  SubscribeRelationCreate,
  SubscribeRelationUpdate,
} from "api-generate";
import { API_RESPONSE_CODE } from "@veaiops/constants";
import apiClient from "@/utils/api-client";

/**
 * 订阅关系服务
 *
 * 封装订阅关系相关的API调用，提供统一的API接口
 *
 * @example
 * ```typescript
 * const subscriptionService = new SubscriptionService();
 * const subscriptions = await subscriptionService.getSubscriptions({ skip: 0, limit: 10 });
 * ```
 */
export class SubscriptionService {
  /**
   * 获取订阅关系列表
   */
  async getSubscriptions(params?: {
    skip?: number;
    limit?: number;
    name?: string;
    agent_type?: string;
    event_level?: string;
    [key: string]: any;
  }) {
    const response =
      await apiClient.subscribe.getApisV1ManagerEventCenterSubscribe({
        skip: params?.skip || 0,
        limit: params?.limit || 10,
        ...params,
      });

    return response;
  }

  /**
   * 创建订阅关系
   */
  async createSubscription(subscriptionData: SubscribeRelationCreate) {
    const response =
      await apiClient.subscribe.postApisV1ManagerEventCenterSubscribe({
        requestBody: subscriptionData,
      });

    return response;
  }

  /**
   * 更新订阅关系
   */
  async updateSubscription(
    subscriptionId: string,
    updateData: SubscribeRelationUpdate
  ) {
    const response =
      await apiClient.subscribe.putApisV1ManagerEventCenterSubscribe({
        uid: subscriptionId,
        requestBody: updateData,
      });

    return response;
  }

  /**
   * 删除订阅关系
   */
  async deleteSubscription(subscriptionId: string) {
    const response =
      await apiClient.subscribe.deleteApisV1ManagerEventCenterSubscribe({
        uid: subscriptionId,
      });

    return response;
  }

  /**
   * 检查订阅关系名称是否重复
   */
  async checkSubscriptionNameDuplicate(name: string, excludeId?: string) {
    const response =
      await apiClient.subscribe.getApisV1ManagerEventCenterSubscribe({
        skip: 0,
        limit: 1000, // 获取所有数据进行检查
      });

    if (response.code === API_RESPONSE_CODE.SUCCESS && response.data) {
      const isDuplicate = response.data.some(
        (subscription: any) =>
          subscription.name === name &&
          (!excludeId || subscription._id !== excludeId)
      );
      return isDuplicate;
    }

    return false;
  }
}

// 创建单例实例
export const subscriptionService = new SubscriptionService();
