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

import type { HistoryQueryParams } from './types';
import { AgentType, EventStatus, EventLevel } from "api-generate";
import apiClient from "@/utils/api-client";

/**
 * 历史事件服务
 *
 * 封装历史事件相关的API调用，提供统一的API接口
 *
 * @example
 * ```typescript
 * const historyService = new HistoryService();
 * const events = await historyService.getHistoryEvents({ skip: 0, limit: 10 });
 * ```
 */
export class HistoryService {
  /**
   * 获取历史事件列表
   */
  async getHistoryEvents(params?: HistoryQueryParams | {
    skip?: number;
    limit?: number;
    agentType?: string[] | AgentType | AgentType[];
    eventLevel?: string | EventLevel;
    status?: number[];
    region?: string[];
    projects?: string[];
    products?: string[];
    customers?: string[];
    startTime?: string;
    endTime?: string;
  }) {
    const response = await apiClient.event.getApisV1ManagerEventCenterEvent({
      skip: params?.skip || 0,
      limit: params?.limit || 10,
      // 类型转换：EventQueryParams 中的 agentType 可能是 AgentType | AgentType[] 或 string[]
      // API 期望 Array<'CHATOPS_INTEREST' | ...>，但 AgentType 枚举值是 'chatops_interest_agent' 等
      // 需要映射枚举值到 API 期望的字符串字面量
      // TODO: 检查后端实际接受的 agentType 格式，修复 OpenAPI 规范以匹配实际类型
      agentType: params?.agentType
        ? ((Array.isArray(params.agentType)
            ? params.agentType
            : [params.agentType]
          ).map((type) => {
            // 如果是 AgentType 枚举值，映射到 API 期望的格式
            if (typeof type === 'string' && type in AgentType) {
              const typeMap: Record<AgentType, string> = {
                [AgentType.CHATOPS_INTEREST_AGENT]: 'CHATOPS_INTEREST',
                [AgentType.CHATOPS_REACTIVE_REPLY_AGENT]:
                  'CHATOPS_REACTIVE_REPLY',
                [AgentType.CHATOPS_PROACTIVE_REPLY_AGENT]:
                  'CHATOPS_PROACTIVE_REPLY',
                [AgentType.INTELLIGENT_THRESHOLD_AGENT]: 'INTELLIGENT_THRESHOLD',
              };
              return typeMap[type as AgentType] || type;
            }
            // 如果已经是 API 期望的格式，直接返回
            return type;
          }) as unknown) as Array<
            | 'CHATOPS_INTEREST'
            | 'CHATOPS_REACTIVE_REPLY'
            | 'CHATOPS_PROACTIVE_REPLY'
            | 'INTELLIGENT_THRESHOLD'
            | 'ONCALL'
          > as unknown as AgentType[]
        : undefined,
      // ✅ 类型安全：从 Python 源码分析，eventLevel 应该是 EventLevel 枚举数组（P0, P1, P2）
      // Python: event_level: Optional[List[EventLevel]] = None (EventLevel 枚举: P0, P1, P2)
      // OpenAPI: Array<EventLevel> (P0, P1, P2)
      // 使用类型守卫验证值是否为有效的 EventLevel 数组
      eventLevel: (() => {
        if (!params?.eventLevel) {
          return undefined;
        }
        if (Array.isArray(params.eventLevel)) {
          // 过滤有效的 EventLevel 值
          const validLevels = params.eventLevel.filter(
            (level): level is EventLevel =>
              level === EventLevel.P0 ||
              level === EventLevel.P1 ||
              level === EventLevel.P2,
          );
          return validLevels.length > 0 ? validLevels : undefined;
        }
        // 单个值：转换为数组
        if (
          params.eventLevel === EventLevel.P0 ||
          params.eventLevel === EventLevel.P1 ||
          params.eventLevel === EventLevel.P2
        ) {
          return [params.eventLevel];
        }
        return undefined;
      })(),
      region: params?.region,
      projects: params?.projects,
      products: params?.products,
      customers: params?.customers,
      startTime: params?.startTime,
      endTime: params?.endTime,
      // 注意：API 不支持 status 参数，只支持 showStatus
      // showStatus 在后端会映射到 event_status，如果需要过滤 event_status，应该使用 showStatus
    });

    return response;
  }

  /**
   * 获取单个历史事件详情
   */
  async getHistoryEvent(eventId: string) {
    const response = await apiClient.event.getApisV1ManagerEventCenterEvent1({
      eventId,
    });

    return response;
  }
}

// 创建单例实例
export const historyService = new HistoryService();
