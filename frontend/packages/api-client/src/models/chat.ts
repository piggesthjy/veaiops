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

/* generated using openapi-typescript-codegen -- do not edit */
import type { ChannelType } from './channel-type';
export type Chat = {
  /**
   * 群ID
   */
  _id?: string;
  /**
   * 群标识
   */
  chat_id: string;
  /**
   * 群名称
   */
  name: string;
  /**
   * 群类型
   */
  chat_type: Chat.chat_type;
  /**
   * 企业协同工具
   */
  channel: ChannelType;
  /**
   * 关联的机器人ID
   */
  bot_id?: string;
  /**
   * 群描述
   */
  description?: string;
  /**
   * 是否激活
   */
  is_active?: boolean;
  /**
   * 是否启用主动回复功能
   */
  enable_func_proactive_reply?: boolean;
  /**
   * 是否启用兴趣检测功能
   */
  enable_func_interest?: boolean;
  /**
   * 创建时间
   */
  created_at?: string;
  /**
   * 更新时间
   */
  updated_at?: string;
};
export namespace Chat {
  /**
   * 群类型
   */
  export enum chat_type {
    GROUP = 'group',
    PRIVATE = 'private',
  }
}
