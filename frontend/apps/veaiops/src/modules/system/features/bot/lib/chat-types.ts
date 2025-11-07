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

import { Bot, ChannelType, Chat } from "api-generate";

// 基础类型定义
/**
 * 聊天相关企业协同工具类型
 *
 * ✅ 单一数据源原则：使用 ChannelType 枚举
 * 对应后端 ChannelType 枚举（veaiops/schema/types.py）
 * 对应 API 生成的 ChannelType 枚举（@veaiops/api-client/models/channel-type.ts）
 *
 * @deprecated 建议直接使用 ChannelType 枚举
 */
export type ChatChannelType = ChannelType;

/**
 * Channel类型选项（仅聊天相关）
 *
 * ✅ 单一数据源原则：统一使用后端枚举值
 * 枚举值映射：
 * - ChannelType.LARK ↔ Python ChannelType.Lark = "Lark"
 * - ChannelType.DING_TALK ↔ Python ChannelType.DingTalk = "DingTalk"
 * - ChannelType.WE_CHAT ↔ Python ChannelType.WeChat = "WeChat"
 */
export const CHAT_CHANNEL_TYPE_OPTIONS = [
  { label: "Lark", value: ChannelType.LARK },
  // { label: "DingTalk", value: ChannelType.DING_TALK },
  // { label: "WeChat", value: ChannelType.WE_CHAT },
];

/**
 * 群类型选项
 */
export const CHAT_TYPE_OPTIONS = [
  { label: "群聊", value: "group" },
  { label: "私聊", value: "private" },
];

/**
 * 群配置更新请求
 */
export interface ChatConfigUpdateRequest {
  enable_func_proactive_reply: boolean;
  enable_func_interest: boolean;
}

/**
 * 分页响应
 */
export interface PaginatedAPIResponseChatList {
  code: number;
  message: string;
  data: {
    items: Chat[];
    total: number;
    skip: number;
    limit: number;
  };
}

/**
 * 群管理查询参数
 */
export interface ChatQueryParams {
  skip?: number;
  limit?: number;
  chat_type?: "group" | "private";
  channel?: ChannelType;
  bot_id?: string;
  force_refresh?: boolean;
  is_active?: boolean;
  name?: string;
  enable_func_interest?: boolean;
  enable_func_proactive_reply?: boolean;
}

/**
 * 群表格数据类型
 */
/**
 * 群聊表格数据类型
 * 直接使用 api-generate 的 Chat 类型
 * @deprecated 建议直接使用 Chat 类型，CustomTable 会自动处理 rowKey
 */
export type ChatTableData = Chat;

/**
 * 群管理抽屉属性
 */
export interface ChatManagementDrawerProps {
  visible: boolean;
  onClose: () => void;
  selectedBot?: Bot;
}

/**
 * 群配置编辑表单数据
 */
export interface ChatConfigFormData {
  enable_func_proactive_reply: boolean;
  enable_func_interest: boolean;
}

/**
 * 群管理操作回调
 */
export interface ChatTableActions {
  onConfigEdit: (chat: Chat) => void;
  onRefresh: () => void;
}

/**
 * 类型守卫：检查是否为群表格数据
 */
export function isChatTableData(
  record: Record<string, unknown>
): record is ChatTableData {
  return (
    typeof record === "object" &&
    record !== null &&
    typeof record.key === "string" &&
    typeof record.chat_id === "string"
  );
}
