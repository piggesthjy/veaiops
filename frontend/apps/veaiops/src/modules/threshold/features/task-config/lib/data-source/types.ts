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

import type { ListIntelligentThresholdTaskRequest } from "api-generate";

/**
 * 前端分页请求类型 - 与 API 的 skip/limit 对应
 */
export interface PageRequest {
  skip: number;
  limit: number;
}

/**
 * 查询参数类型定义 - 前端内部使用
 */
export interface TaskQueryParams {
  datasource_type?: ListIntelligentThresholdTaskRequest["datasource_type"];
  page_req: PageRequest;
  projects?: string[];
  auto_update?: boolean;
  task_name?: string;
  created_at_start?: string;
  created_at_end?: string;
  updated_at_start?: string;
  updated_at_end?: string;
}

/**
 * 数据源配置载荷类型 - 前端内部使用
 */
export interface DataSourcePayload {
  projects?: string[];
  products?: string[];
  customers?: string[];
  task_ids?: string[];
  statuses?: string[];
  datasource_type?: ListIntelligentThresholdTaskRequest["datasource_type"];
  auto_update?: boolean;
  page_req?: PageRequest;
}
