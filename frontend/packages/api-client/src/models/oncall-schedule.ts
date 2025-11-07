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
export type OncallSchedule = {
  /**
   * 值班计划ID
   */
  id?: string;
  /**
   * 关联的规则ID
   */
  rule_id: string;
  /**
   * 值班计划名称
   */
  name: string;
  /**
   * 值班计划描述
   */
  description?: string;
  /**
   * 值班计划类型
   */
  schedule_type: OncallSchedule.schedule_type;
  /**
   * 值班参与者列表
   */
  participants: Array<{
    /**
     * 用户ID
     */
    user_id: string;
    /**
     * 用户名
     */
    user_name: string;
    /**
     * 联系信息
     */
    contact_info?: {
      phone?: string;
      email?: string;
      chat_id?: string;
    };
    /**
     * 优先级
     */
    priority?: number;
  }>;
  /**
   * 值班计划配置
   */
  schedule_config: {
    /**
     * 轮换间隔（小时）
     */
    rotation_interval?: number;
    /**
     * 开始时间
     */
    start_time?: string;
    /**
     * 结束时间
     */
    end_time?: string;
    /**
     * 时区
     */
    timezone?: string;
    /**
     * 工作日（0=周日，6=周六）
     */
    weekdays?: Array<number>;
  };
  /**
   * 升级策略
   */
  escalation_policy?: {
    /**
     * 是否启用升级
     */
    enabled?: boolean;
    /**
     * 升级超时时间（分钟）
     */
    escalation_timeout?: number;
    /**
     * 升级级别配置
     */
    escalation_levels?: Array<{
      level?: number;
      participants?: Array<string>;
      timeout?: number;
    }>;
  };
  /**
   * 是否激活
   */
  is_active?: boolean;
  /**
   * 生效开始时间
   */
  effective_start?: string;
  /**
   * 生效结束时间
   */
  effective_end?: string;
  /**
   * 创建时间
   */
  created_at?: string;
  /**
   * 更新时间
   */
  updated_at?: string;
};
export namespace OncallSchedule {
  /**
   * 值班计划类型
   */
  export enum schedule_type {
    DAILY = 'daily',
    WEEKLY = 'weekly',
    MONTHLY = 'monthly',
    CUSTOM = 'custom',
  }
}
