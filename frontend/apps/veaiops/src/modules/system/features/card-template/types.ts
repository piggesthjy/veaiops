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

/**
 * 卡片模版管理相关类型定义

 */

// 导入生成的API类型
import type {
  AgentTemplateCreateRequest,
  AgentTemplateUpdateRequest,
  ChannelType,
} from 'api-generate';

/**
 * Agent模版查询参数
 */
export interface AgentTemplateQuery {
  /** Agent类型筛选 */
  agents?: string[];
  /** 通道类型筛选 */
  channels?: ChannelType[];
  /** 模版ID搜索 */
  templateId?: string;
  /** 模版名称搜索 */
  name?: string;
  /** 是否启用 */
  is_active?: boolean;
  /** 创建时间范围 */
  createTimeRanges?: number[];
  /** 分页参数 */
  skip?: number;
  /** 每页大小 */
  limit?: number;
  /** 索引签名以满足 BaseQuery 约束 */
  [key: string]: unknown;
}

/**
 * 创建Agent模版请求 - 使用生成的API类型
 */
export type CreateAgentTemplateRequest = AgentTemplateCreateRequest;

/**
 * 更新Agent模版请求 - 使用生成的API类型
 */
export type UpdateAgentTemplateRequest = AgentTemplateUpdateRequest;

/**
 * 通道类型选项已迁移到 @veaiops/constants
 * @see frontend/packages/constants/src/channel.ts
 *
 * 使用方式：
 * import { CHANNEL_OPTIONS } from '@veaiops/constants';
 */

/**
 * 引导步骤类型
 */
export interface GuideStep {
  /** 步骤标题 */
  title: string;
  /** 步骤描述 */
  description: string;
  /** 步骤图标 */
  icon?: React.ReactNode;
  /** 是否完成 */
  completed?: boolean;
  /** 操作按钮 */
  action?: {
    text: string;
    onClick: () => void;
  };
}
