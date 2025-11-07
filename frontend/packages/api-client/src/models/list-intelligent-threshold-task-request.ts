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
export type ListIntelligentThresholdTaskRequest = {
  /**
   * 项目名称列表
   */
  projects?: Array<string>;
  /**
   * 任务名称过滤
   */
  task_name?: string;
  /**
   * 数据源类型
   */
  datasource_type?: ListIntelligentThresholdTaskRequest.datasource_type;
  /**
   * 自动更新开关
   */
  auto_update?: boolean;
  /**
   * 创建时间范围开始
   */
  created_at_start?: string;
  /**
   * 创建时间范围结束
   */
  created_at_end?: string;
  /**
   * 更新时间范围开始
   */
  updated_at_start?: string;
  /**
   * 更新时间范围结束
   */
  updated_at_end?: string;
  /**
   * 跳过的记录数
   */
  skip?: number;
  /**
   * 每页大小
   */
  limit?: number;
};
export namespace ListIntelligentThresholdTaskRequest {
  /**
   * 数据源类型
   */
  export enum datasource_type {
    ZABBIX = 'Zabbix',
    ALIYUN = 'Aliyun',
    VOLCENGINE = 'Volcengine',
  }
}
