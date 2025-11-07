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
/**
 * 创建机器人请求。支持分阶段创建：阶段1只需填写channel、bot_id和secret即可快速创建；阶段2可在编辑时补充volc_cfg和agent_cfg等ChatOps高级配置
 */
export type BotCreateRequest = {
  /**
   * 企业协同工具（必填）
   */
  channel: BotCreateRequest.channel;
  /**
   * 机器人App ID（必填）
   */
  bot_id: string;
  /**
   * 机器人App Secret（必填）
   */
  secret: string;
  /**
   * Webhook URL列表（可选）
   */
  webhook_urls?: Array<string>;
  volc_cfg?: VolcCfgPayload;
  agent_cfg?: AgentCfgPayload;
};
export namespace BotCreateRequest {
  /**
   * 企业协同工具（必填）
   */
  export enum channel {
    LARK = 'Lark',
    DING_TALK = 'DingTalk',
    WE_CHAT = 'WeChat',
    WEBHOOK = 'Webhook',
  }
}
