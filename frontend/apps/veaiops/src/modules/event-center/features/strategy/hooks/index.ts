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
 * 策略管理 Hooks 统一导出
 *
 * 根据 .cursorrules 规范：
 * - 统一导出：每个目录都**必须**有 `index.ts` 文件进行统一导出
 * - 优先使用统一导出，而不是直接导入具体文件
 */

// ✅ 优化：统一导出，文件名已简化
export { useStrategyActionConfig } from './use-actions';
export { useStrategyForm as useStrategyManagementLogic } from './use-form';
// ✅ 简化文件名：use-strategy-table-config.tsx → use-table.tsx
export { useStrategyTableConfig } from './use-table';

// ✅ 优化：统一导出类型（从 use-table.tsx）
export type {
  StrategyFilters,
  StrategyQueryParams,
  UseStrategyTableConfigOptions,
  UseStrategyTableConfigReturn,
} from './use-table';

// 数据获取 Hooks
export { default as useBotsList } from './use-bots';
export { default as useChartsList, default as useChatsList } from './use-chats';

// ✅ 根据 .cursorrules 规范：直接使用 InformStrategy（api-generate），不导出 StrategyTableData
// InformStrategy 已满足 BaseRecord 约束（有索引签名），可直接用于 CustomTable
