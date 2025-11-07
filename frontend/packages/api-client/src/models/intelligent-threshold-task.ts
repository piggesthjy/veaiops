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
export type IntelligentThresholdTask = {
  /**
   * 任务ID
   */
  _id?: string;
  /**
   * 任务名称
   */
  task_name: string;
  /**
   * 任务描述
   */
  description?: string;
  /**
   * 关联的模板ID
   */
  template_id: string;
  /**
   * 数据源ID
   */
  datasource_id: string;
  /**
   * 数据源类型
   */
  datasource_type?: IntelligentThresholdTask.datasource_type;
  /**
   * 项目列表
   */
  projects?: Array<string>;
  /**
   * 是否自动更新
   */
  auto_update?: boolean;
  /**
   * 任务状态
   */
  status?: IntelligentThresholdTask.status;
  /**
   * 任务配置
   */
  config?: {
    /**
     * 调度表达式 (cron)
     */
    schedule?: string;
    /**
     * 超时时间（秒）
     */
    timeout?: number;
    /**
     * 重试次数
     */
    retry_count?: number;
  };
  /**
   * 最后执行时间
   */
  last_execution_time?: string;
  /**
   * 下次执行时间
   */
  next_execution_time?: string;
  /**
   * 创建时间
   */
  created_at?: string;
  /**
   * 更新时间
   */
  updated_at?: string;
};
export namespace IntelligentThresholdTask {
  /**
   * 数据源类型
   */
  export enum datasource_type {
    ZABBIX = 'Zabbix',
    ALIYUN = 'Aliyun',
    VOLCENGINE = 'Volcengine',
  }
  /**
   * 任务状态
   */
  export enum status {
    PENDING = 'pending',
    RUNNING = 'running',
    COMPLETED = 'completed',
    FAILED = 'failed',
    CANCELLED = 'cancelled',
  }
}
