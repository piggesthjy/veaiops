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

import { queryBooleanFormat } from '@veaiops/utils';

/**
 * 群管理查询参数格式化配置
 *
 * 🔧 优化说明：
 * - 只需定义**非字符串类型**的字段（数组、布尔值等）
 * - 字符串类型字段（如 name）会被CustomTable自动处理
 * - 这样可以避免遗漏字段导致的URL同步问题
 */
export const CHAT_TABLE_QUERY_FORMAT = {
  // 强制刷新 - 布尔值格式
  force_refresh: queryBooleanFormat,
  // 已入群状态 - 布尔值格式
  is_active: queryBooleanFormat,
  // 兴趣检测智能体状态 - 布尔值格式
  enable_func_interest: queryBooleanFormat,
  // 主动回复智能体状态 - 布尔值格式
  enable_func_proactive_reply: queryBooleanFormat,
};
