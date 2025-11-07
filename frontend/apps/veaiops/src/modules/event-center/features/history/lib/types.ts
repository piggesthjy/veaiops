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

/**
 * 历史事件模块类型定义
 *
 * 注意：公共类型已迁移到 @veaiops/types
 * 此文件仅保留模块特定类型
 */

// 从 packages 导入公共类型
import type {
  EventQueryParams,
  EventTableData,
  TableQueryParams,
  TableDataResponse,
} from "@veaiops/types";

// 重新导出公共类型（向后兼容）
export type {
  EventQueryParams as HistoryQueryParams,
  EventTableData as HistoryTableData,
  TableQueryParams,
  TableDataResponse,
};

// 从 api-generate 导出原始类型
export type { Event, AgentType, EventLevel } from "api-generate";

// ✅ 直接从 @veaiops/api-client 导出 EventStatus（不通过 constants 中转）
export { EventStatus } from "@veaiops/api-client";

// 导出新增的类型定义（从 origin/feat/web-v2 迁移）
// 使用 origin/feat/web-v2 的字段定义方式
export type { EventApiParams, HistoryFilters } from "../types/event-api-params";
