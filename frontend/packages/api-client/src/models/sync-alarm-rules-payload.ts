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
export type SyncAlarmRulesPayload = {
  /**
   * 智能阈值任务ID
   */
  task_id: string;
  /**
   * 智能阈值任务版本ID
   */
  task_version_id: string;
  /**
   * 联系组ID列表（Volcengine和Aliyun需要）
   */
  contact_group_ids?: Array<string>;
  /**
   * 告警通知方式（仅Volcengine有效）
   */
  alert_methods?: Array<'Email' | 'Phone' | 'SMS'>;
  /**
   * 媒介类型ID列表（仅Zabbix需要，对应Zabbix的告警通知方式）
   */
  mediatype_ids?: Array<string>;
  /**
   * 用户组ID列表（仅Zabbix需要，对应Zabbix的告警组）
   */
  usergroup_ids?: Array<string>;
  /**
   * Webhook URL（可选）
   */
  webhook?: string;
  /**
   * 告警级别（对所有告警源都有效）
   */
  alarm_level: SyncAlarmRulesPayload.alarm_level;
  /**
   * 最大并发工作线程数
   */
  max_workers?: number;
  /**
   * 速率限制周期（秒）
   */
  rate_limit_period?: number;
  /**
   * 每个周期最大请求数
   */
  rate_limit_count?: number;
};
export namespace SyncAlarmRulesPayload {
  /**
   * 告警级别（对所有告警源都有效）
   */
  export enum alarm_level {
    P0 = 'P0',
    P1 = 'P1',
    P2 = 'P2',
  }
}
