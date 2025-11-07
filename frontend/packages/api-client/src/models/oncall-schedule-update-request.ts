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
export type OncallScheduleUpdateRequest = {
  /**
   * 值班计划名称
   */
  name?: string;
  /**
   * 值班计划描述
   */
  description?: string;
  /**
   * 值班参与者列表
   */
  participants?: Array<Record<string, any>>;
  /**
   * 值班计划配置
   */
  schedule_config?: Record<string, any>;
  /**
   * 升级策略
   */
  escalation_policy?: Record<string, any>;
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
};
