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

import type { EventShowStatus, EventStatus } from 'api-generate';

/**
 * API 请求参数类型
 * 基于生成的 EventService.getApisV1ManagerEventCenterEvent 方法
 * 使用驼峰命名，对应后端 API 接口
 */
export type EventApiParams = {
  agentType?: Array<
    | 'CHATOPS_INTEREST'
    | 'CHATOPS_REACTIVE_REPLY'
    | 'CHATOPS_PROACTIVE_REPLY'
    | 'INTELLIGENT_THRESHOLD'
    | 'ONCALL'
  >;
  eventLevel?: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  showStatus?: Array<EventShowStatus>;
  status?: Array<EventStatus>;
  startTime?: string;
  endTime?: string;
  sortOrder?: 'asc' | 'desc';
  skip?: number;
  limit?: number;
};

/**
 * 历史事件过滤器类型
 * 使用下划线命名，对应前端 UI 层
 * 与 filter.tsx 中定义的筛选器一一对应
 */
export interface HistoryFilters {
  /** 智能体类型 */
  agent_type?: string[];
  /** 事件级别 */
  event_level?: string;
  /** 状态（中文） */
  show_status?: EventShowStatus[];
  /** 事件状态（枚举值） */
  status?: number[];
  /** 开始时间 */
  start_time?: string;
  /** 结束时间 */
  end_time?: string;
}
