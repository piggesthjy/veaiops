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

import type { AgentType } from 'api-generate';
import type { ModuleType } from './module';

/**
 * 推送状态枚举
 */
export enum PushStatus {
  /** 成功 */
  SUCCESS = 'success',
  /** 失败 */
  FAILED = 'failed',
  /** 处理中 */
  PENDING = 'pending',
  /** 重试中 */
  RETRYING = 'retrying',
}

/**
 * 推送类型枚举
 */
export enum PushType {
  /** 告警推送 */
  ALERT = 'alert',
  /** 恢复推送 */
  RECOVERY = 'recovery',
  /** 通知推送 */
  NOTIFICATION = 'notification',
  /** 测试推送 */
  TEST = 'test',
}

/**
 * 历史事件记录
 */
export interface PushHistoryRecord {
  /** 记录ID */
  id: string;
  /** 模块类型 */
  module_type: ModuleType;
  /** 推送类型 */
  push_type: PushType;
  /** 推送状态 */
  status: PushStatus;
  /** 目标接收者 */
  receiver: string;
  /** 推送内容 */
  content: string;
  /** 推送时间 */
  push_time: string;
  /** 响应时间（毫秒） */
  response_time?: number;
  /** 错误信息 */
  error_message?: string;
  /** 重试次数 */
  retry_count?: number;
  /** 创建时间 */
  created_at: string;
  /** 更新时间 */
  updated_at?: string;
}

/**
 * 历史事件查询参数
 */
export interface PushHistoryQuery {
  /** 模块类型 */
  agentType?: AgentType;
  /** 推送类型 */
  push_type?: PushType;
  /** 推送状态 */
  status?: PushStatus;
  /** 接收者 */
  receiver?: string;
  /** 开始时间 */
  start_time?: string;
  /** 结束时间 */
  end_time?: string;
  /** 页码 */
  page?: number;
  /** 每页大小 */
  page_size?: number;
}

/**
 * 历史事件响应
 */
export interface PushHistoryResponse {
  /** 历史记录列表 */
  records: PushHistoryRecord[];
  /** 总数 */
  total: number;
  /** 当前页 */
  page: number;
  /** 每页大小 */
  page_size: number;
}

/**
 * 推送统计信息
 */
export interface PushStatistics {
  /** 总推送数 */
  total_count: number;
  /** 成功数 */
  success_count: number;
  /** 失败数 */
  failed_count: number;
  /** 成功率 */
  success_rate: number;
  /** 平均响应时间 */
  avg_response_time: number;
}
