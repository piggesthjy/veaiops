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
 * Bot属性相关类型定义
 */

import type { AttributeKey, ChannelType } from 'api-generate';

// BotAttribute 类型现在从 API 生成

export interface BotAttributeFormData {
  name: AttributeKey;
  value: string | string[]; // 支持单选和多选
  bot_id?: string;
  channel?: string;
}

export type ModalType = 'create' | 'edit' | 'detail';

export interface BotAttributesTableProps {
  botId?: string;
  channel?: string;
  onRefresh?: () => void;
}

/**
 * Bot特别关注管理 Hook 参数接口
 */
export interface UseBotAttributesParams {
  botId: string;
  channel: ChannelType;
}

/**
 * 更新特别关注参数接口
 */
export interface UpdateAttributeParams {
  id: string;
  value: string;
}

/**
 * 创建特别关注参数接口
 */
export interface CreateAttributeParams {
  name: AttributeKey;
  values: string[];
}

/**
 * 保存的请求参数接口
 */
export interface LastRequestParams {
  names?: string[];
  value?: string;
}

/**
 * Bot属性类目选项
 * 目前仅支持项目，客户和产品功能待开发
 */
export const ATTRIBUTE_OPTIONS = [
  { label: '项目', value: 'project' as AttributeKey },
  // { label: '客户', value: 'customer' as AttributeKey },
  // { label: '产品', value: 'product' as AttributeKey },
];

/**
 * 类目映射表
 * 将英文类目名称映射为中文显示名称
 * 对应 origin/feat/web-v2 分支的实现，确保显示一致
 */
export const ATTRIBUTE_NAME_MAP: Record<AttributeKey, string> = {
  project: '项目',
  customer: '客户',
  product: '产品',
};
