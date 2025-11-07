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
 * ✅ 单一数据源原则：统一使用后端枚举值
 *
 * 对应后端 ChannelType 枚举（veaiops/schema/types.py）
 * 对应 API 生成的 ChannelType 枚举（@veaiops/api-client/models/channel-type.ts）
 *
 * 枚举值映射：
 * - ChannelType.LARK ↔ Python ChannelType.Lark = "Lark"
 * - ChannelType.DING_TALK ↔ Python ChannelType.DingTalk = "DingTalk"
 * - ChannelType.WE_CHAT ↔ Python ChannelType.WeChat = "WeChat"
 */
import { ChannelType } from '@veaiops/api-client';

export const channelTypeOptions = [
  { label: '飞书', value: ChannelType.LARK },
  { label: '钉钉', value: ChannelType.DING_TALK, disabled: true },
  { label: '企业微信', value: ChannelType.WE_CHAT, disabled: true },
];

export const channelInfoMap = channelTypeOptions.reduce(
  (prev, cur) => {
    const colorMap: Record<string, string> = {
      [ChannelType.LARK]: 'blue',
      [ChannelType.DING_TALK]: 'orange',
      [ChannelType.WE_CHAT]: 'green',
    };
    prev[cur.value] = {
      label: cur.label,
      color: colorMap[cur.value],
      disabled: Boolean(cur.disabled),
    };
    return prev;
  },
  {} as Record<
    ChannelType,
    { label: string; color: string; disabled: boolean }
  >,
);
