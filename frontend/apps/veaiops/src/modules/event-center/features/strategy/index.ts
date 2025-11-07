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
 * 策略管理功能统一导出
 *
 * ✅ 层层导出原则：通过功能模块 index.ts 统一导出所有子目录内容
 * - 从功能模块 index.ts 导入，路径最短（如 `@ec/strategy`）
 * - 每个子目录通过各自的 index.ts 统一导出
 */

// ==================== Constants 导出 ====================
export {
  channelInfoMap,
  channelTypeOptions,
  STRATEGY_MANAGEMENT_CONFIG,
} from './constants';

// ==================== Hooks 导出 ====================
export {
  useBotsList,
  useChatsList,
  useStrategyActionConfig,
  useStrategyManagementLogic,
  useStrategyTableConfig,
  type StrategyFilters,
  type StrategyQueryParams,
  type UseStrategyTableConfigOptions,
  type UseStrategyTableConfigReturn,
} from './hooks';

// ==================== Config 导出 ====================
export { getStrategyColumns, getStrategyFilters } from './config';

// ==================== Lib 导出 ====================
export { adaptStrategyForEdit, strategyApi, strategyService } from './lib';

// ==================== UI 组件导出 ====================
export {
  CardTemplateConfigMessage,
  StrategyDetailDrawer,
} from './ui';
export { default as StrategyModal } from './ui/modal';
export { StrategyTable, type StrategyTableRef } from './ui/table';
export { default as StrategyManagement } from './ui/main';

// ==================== 默认导出 ====================
export { default } from './ui/main';
