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
export type SystemStatistics = {
  /**
   * 活跃机器人数量
   */
  active_bots: number;
  /**
   * 活跃群数量
   */
  active_chats: number;
  /**
   * 活跃消息卡片通知策略数量
   */
  active_inform_strategies: number;
  /**
   * 活跃订阅数量
   */
  active_subscribes: number;
  /**
   * 活跃用户数量
   */
  active_users: number;
  /**
   * 活跃产品数量
   */
  active_products: number;
  /**
   * 活跃项目数量
   */
  active_projects: number;
  /**
   * 活跃客户数量
   */
  active_customers: number;
  /**
   * 活跃智能阈值任务数量
   */
  active_intelligent_threshold_tasks: number;
  /**
   * 活跃智能阈值自动更新任务数量
   */
  active_intelligent_threshold_autoupdate_tasks: number;
  /**
   * 最近1天智能阈值成功数量
   */
  latest_1d_intelligent_threshold_success_num: number;
  /**
   * 最近1天智能阈值失败数量
   */
  latest_1d_intelligent_threshold_failed_num: number;
  /**
   * 最近7天智能阈值成功数量
   */
  latest_7d_intelligent_threshold_success_num: number;
  /**
   * 最近7天智能阈值失败数量
   */
  latest_7d_intelligent_threshold_failed_num: number;
  /**
   * 最近30天智能阈值成功数量
   */
  latest_30d_intelligent_threshold_success_num: number;
  /**
   * 最近30天智能阈值失败数量
   */
  latest_30d_intelligent_threshold_failed_num: number;
  /**
   * 最近24小时事件数量
   */
  latest_24h_events: number;
  /**
   * 最近1天事件数量
   */
  last_1d_events: number;
  /**
   * 最近7天事件数量
   */
  last_7d_events: number;
  /**
   * 最近30天事件数量
   */
  last_30d_events: number;
  /**
   * 最近24小时消息数量
   */
  latest_24h_messages: number;
  /**
   * 最近1天消息数量
   */
  last_1d_messages: number;
  /**
   * 最近7天消息数量
   */
  last_7d_messages: number;
  /**
   * 最近30天消息数量
   */
  last_30d_messages: number;
};
