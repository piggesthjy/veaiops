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
import type { AgentCfgPayload } from './agent-cfg-payload';
import type { VolcCfgPayload } from './volc-cfg-payload';
export type Bot = {
  /**
   * MongoDB文档ID
   */
  _id?: string | null;
  /**
   * 创建用户
   */
  created_user?: string | null;
  /**
   * 创建时间
   */
  created_at?: string;
  /**
   * 更新用户
   */
  updated_user?: string | null;
  /**
   * 更新时间
   */
  updated_at?: string;
  /**
   * 是否激活
   */
  is_active?: boolean;
  /**
   * 企业协同工具
   */
  channel?: Bot.channel;
  /**
   * 机器人ID
   */
  bot_id?: string;
  /**
   * OpenID，从bot_id自动生成
   */
  open_id?: string | null;
  /**
   * 机器人名称
   */
  name?: string | null;
  /**
   * 机器人密钥
   */
  secret?: string;
  /**
   * Webhook URL列表
   */
  webhook_urls?: Array<string>;
  /**
   * 火山引擎配置
   */
  volc_cfg?: VolcCfgPayload;
  /**
   * Agent配置
   */
  agent_cfg?: AgentCfgPayload;
};
export namespace Bot {
  /**
   * 企业协同工具
   */
  export enum channel {
    LARK = 'Lark',
    DING_TALK = 'DingTalk',
    WE_CHAT = 'WeChat',
    WEBHOOK = 'Webhook',
  }
}
