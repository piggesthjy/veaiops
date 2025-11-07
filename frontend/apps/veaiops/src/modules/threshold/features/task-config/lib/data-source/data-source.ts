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

import type { TaskQueryParams, TaskListResponse } from "./types";
import { realApiRequest } from "./api";
/**
 * 智能阈值任务数据源配置
 */
export const taskDataSource = {
  // 请求函数 - 类型明确的泛型函数
  request: realApiRequest as (query: TaskQueryParams) => Promise<TaskListResponse>,

  // 是否准备就绪
  ready: true,

  formatPayload: (payload: Record<string, unknown>) => {
    // 适配新的 API 结构，将分页参数转换为 skip/limit
    return {
      projects: payload.projects,
      task_name: payload.task_name,
      datasource_type: payload.datasource_type,
      auto_update: payload.auto_update,
      created_at_start: payload.created_at_start,
      created_at_end: payload.created_at_end,
      updated_at_start: payload.updated_at_start,
      updated_at_end: payload.updated_at_end,
      page_req: payload.page_req,
    };
  },

  // 是否为服务端分页
  isServerPagination: true,
};
