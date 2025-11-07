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
 * Bot管理库统一导出
 * 注意：类型定义已迁移到 types/ 目录，此处不再导出
 */

// 类型定义（从上级 types 目录导出，保持层层导出原则）
export type { Bot, BotCreateRequest, BotFormData, BotTableRef, BotUpdateRequest } from "../types";

// API服务
export * from "./api";

// 表格列配置（从 columns/index.ts 导出，避免循环导入）
export * from "./chat-columns";
export * from "./columns";

// 属性相关配置（已简化命名：移除 bot- 前缀）
export { getBotAttributesColumns } from "./attributes-columns";
export type { BotAttributesColumnsProps } from "./attributes-columns";
export * from "./attributes-filters";

// 工具函数
export * from "./utils";

// 配置
export * from "./config";

// 从 types 重新导出的常量（供 UI 组件使用）
// 注意：CHANNEL_TYPE_OPTIONS 已迁移到 @veaiops/constants，统一使用 CHANNEL_OPTIONS
export { NETWORK_TYPE_OPTIONS, TOS_REGION_OPTIONS } from "../types/bot";

// 其他
export * from "./chat-filters";
export * from "./chat-query-format";
export * from "./chat-types";
export * from "./filters";
export * from "./translations";

// 属性表格配置
export * from "./attributes-table-config";

// 注意：Bot 属性 API 已合并到 api.ts，不再单独导出
