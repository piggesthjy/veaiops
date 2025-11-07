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

import { queryArrayFormat, queryBooleanFormat } from '@veaiops/utils';

/**
 * 查询参数格式化配置
 *
 * 🔧 优化说明：
 * - 只需定义**非字符串类型**的字段（数组、布尔值等）
 * - 字符串类型字段（如datasource_type、task_name等）会被CustomTable自动处理
 * - 这样可以避免遗漏字段导致的URL同步问题
 */
export const TASK_TABLE_QUERY_FORMAT = {
  // 项目名称列表 - 数组格式
  projects: queryArrayFormat,
  // 产品名称列表 - 数组格式
  products: queryArrayFormat,
  // 客户名称列表 - 数组格式
  customers: queryArrayFormat,
  // 任务ID列表 - 数组格式
  task_ids: queryArrayFormat,
  // 任务状态列表 - 数组格式
  statuses: queryArrayFormat,
  // 自动更新 - 布尔值格式
  auto_update: queryBooleanFormat,
};
