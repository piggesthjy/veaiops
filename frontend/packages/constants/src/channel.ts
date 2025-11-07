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
 * ⚠️ 注意：ChannelType 枚举定义在 @veaiops/api-client
 *
 * ✅ 单一数据源原则：
 * - ChannelType 枚举从 @veaiops/api-client 导入（不在此处重新导出，避免中转）
 * - CHANNEL_OPTIONS 等配置常量在此处定义（UI 展示配置）
 *
 * 对应后端枚举（veaiops/schema/types.py）：
 * - Lark = "Lark"
 * - DingTalk = "DingTalk"
 * - WeChat = "WeChat"
 * - Webhook = "Webhook"
 */

// ✅ 作为使用方，导入 ChannelType 用于类型定义和值比较
import { ChannelType } from '@veaiops/api-client';

/**
 * 通道类型选项配置（带中文标签和可用状态）
 *
 * 注意：
 * - value 值使用 ChannelType 枚举
 * - 当前只支持飞书（Lark），其他通道标记为 disabled
 */
export const CHANNEL_OPTIONS = [
  { label: '飞书', value: ChannelType.LARK, disabled: false },
  //   { label: '钉钉', value: ChannelType.DING_TALK, disabled: true },
  //   { label: '企业微信', value: ChannelType.WE_CHAT, disabled: true },
  //   { label: 'Webhook', value: ChannelType.WEBHOOK, disabled: true },
] as const;

/**
 * 通道类型映射表
 * 用于快速查找配置
 */
export const CHANNEL_MAP = CHANNEL_OPTIONS.reduce(
  (acc, cur) => {
    acc[cur.value] = cur;
    return acc;
  },
  {} as Record<ChannelType, (typeof CHANNEL_OPTIONS)[number]>,
);

/**
 * 获取通道类型的中文标签
 */
export const getChannelLabel = (value: ChannelType | string): string => {
  const option = CHANNEL_OPTIONS.find((opt) => opt.value === value);
  return option?.label || value;
};

/**
 * 可用的通道选项（仅返回未禁用的选项）
 */
export const AVAILABLE_CHANNEL_OPTIONS = CHANNEL_OPTIONS.filter(
  (opt) => !opt.disabled,
);
