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
import type { IntelligentThresholdTaskVersion } from './intelligent-threshold-task-version';
export type IntelligentThresholdTaskDetail = {
  /**
   * 任务ID
   */
  _id?: string;
  /**
   * 任务名称
   */
  task_name: string;
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
  datasource_type: IntelligentThresholdTaskDetail.datasource_type;
  /**
   * 自动更新开关
   */
  auto_update?: boolean;
  /**
   * 项目名称列表
   */
  projects?: Array<string>;
  /**
   * 产品名称列表
   */
  products?: Array<string>;
  /**
   * 客户名称列表
   */
  customers?: Array<string>;
  /**
   * 创建时间
   */
  created_at?: string;
  /**
   * 更新时间
   */
  updated_at?: string;
  latest_version?: IntelligentThresholdTaskVersion;
};
export namespace IntelligentThresholdTaskDetail {
  /**
   * 数据源类型
   */
  export enum datasource_type {
    ZABBIX = 'Zabbix',
    ALIYUN = 'Aliyun',
    VOLCENGINE = 'Volcengine',
  }
}
