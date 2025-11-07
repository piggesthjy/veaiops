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
 * 策略管理类型定义
 *
 * 🎯 类型设计原则：
 * 1. 优先使用 api-generate 中的后端接口类型
 * 2. 优先使用 @veaiops/components 中的组件类型
 * 3. 仅在必要时定义最小化的扩展类型
 */

import type { GroupChatVO, InformStrategy } from 'api-generate';

// ✅ 类型安全：统一从 api-generate 导入 InformStrategy（符合单一数据源原则）
// 根据 Python 源码分析：API 返回 InformStrategyVO，对应 TypeScript 的 InformStrategy

/**
 * 策略编辑表单数据适配器
 *
 * 将 InformStrategy（API 返回格式）转换为编辑表单需要的格式
 *
 * 根据 Python 源码分析（veaiops/schema/models/event/event.py）：
 * - InformStrategyVO 包含: id, name, description, channel, bot: BotVO, group_chats: List[GroupChatVO]
 * - BotVO 包含: id, channel, bot_id, name, is_active
 * - GroupChatVO 包含: id, open_chat_id, chat_name, is_active
 *
 * 编辑表单需要扁平化的 bot_id 和 chat_ids 字段，因此从嵌套对象中提取这些值
 *
 * @param strategy - 消息卡片通知策略对象（InformStrategy 类型，来自 api-generate）
 * @returns 包含 bot_id 和 chat_ids 的策略对象（符合 EventStrategy 接口的扁平化要求）
 */
export function adaptStrategyForEdit(
  strategy: InformStrategy,
): InformStrategy & {
  bot_id: string;
  chat_ids: string[];
} {
  // ✅ 类型安全：从 BotVO 中提取 bot_id（Python 源码：BotVO.bot_id）
  // ✅ 类型安全：从 GroupChatVO[] 中提取 open_chat_id（Python 源码：GroupChatVO.open_chat_id）
  return {
    ...strategy,
    bot_id: strategy.bot?.bot_id || '', // BotVO 的 bot_id 字段（Python: bot_id: str = Field(...)）
    chat_ids: strategy.group_chats?.map(
      (item: GroupChatVO) => item.open_chat_id, // GroupChatVO 的 open_chat_id 字段（Python: open_chat_id: str = Field(...)）
    ) || [],
  };
}
