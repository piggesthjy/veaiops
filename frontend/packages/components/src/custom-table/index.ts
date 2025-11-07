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
 * CustomTable 组件统一导出
 *
 * ✅ 层层导出原则：通过功能模块 index.ts 统一导出所有子目录内容
 * - 从功能模块 index.ts 导入，路径最短（如 `@/custom-table`）
 * - 每个子目录通过各自的 index.ts 统一导出
 */

// ==================== 主组件导出 ====================
export { CustomTable } from './custom-table';

// ==================== 组件导出 ====================
export {
  ResetLogControlPanel,
  ResetLogExportButton,
} from './components/reset-log-export-button';

// ==================== Hooks 导出 ====================
export {
  SubscriptionProvider,
  useBusinessTable,
  useSubscription,
  useTableRefreshHandlers,
  type OperationWrappers,
  type RefreshHandlers,
} from './hooks';

// ==================== 工具函数导出 ====================
export {
  buildRequestResult,
  devLog,
  extractResponseData,
  filterEmptyDataByKeys,
  filterTableData,
  formatTableData,
  handleRequestError,
  resetLogCollector,
} from './utils';

// ==================== 类型导出 ====================
// ⚠️ 重要：先显式导出运行时需要的枚举值和函数，确保构建工具能够正确识别
// 这些值必须在 export * from 之前导出，因为 Rollup DTS 插件无法正确追踪多层 export * from 链

// 1. 枚举值（enum）- 值导出，用于运行时
export {
  LifecyclePhaseEnum,
  PluginPriorityEnum,
  PluginStatusEnum,
} from './types/core/enums';

// 2. 工具函数 - 值导出，用于运行时
export { createPaginationStateManager } from './types/utils/state-managers';

// 3. 类型导出 - 统一从 types/index.ts 导出所有类型（避免重复导出冲突）
export * from './types';
// 显式导出常用类型，确保 DTS 生成时正确识别（路径别名解析问题）
// 注意：由于 rollup-plugin-dts 在处理路径别名时可能存在问题，从具体路径导入并导出
export type { CustomTableActionType } from './types/api/action-type';
export type { FilterConfigItem } from './types/components/props';
export type {
  BaseQuery,
  BaseRecord,
  FilterValue,
  HandleFilterProps,
  Key,
  QueryFormat,
  QueryValue,
} from './types/core/common';
export type { FilterItemConfig } from './types/plugins/table-filter';

// ==================== 常量导出 ====================
// 避免重复导出 FeatureFlags（已在 types/constants 中导出）
export {
  ColumnConstant,
  EMPTY_CONTENT,
  PluginMethods,
  PluginNames,
  RendererNames,
} from './constants';
export type { FeatureFlags } from './constants';

// ==================== 预设导出 ====================
export * from './presets';
