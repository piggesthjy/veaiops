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
 * CustomTable 类型定义统一导出
 * 重构后的类型系统，按功能分类组织
 *
 * ⚠️ 重要导出顺序说明（遵循 Modern.js 最佳实践）：
 * 1. 先显式导出关键类型（确保构建工具优先识别）
 * 2. 然后使用 export * from 导出所有子模块（保持类型系统的完整性）
 *
 * 为什么需要显式导出：
 * - Modern.js/Rollup DTS 插件在处理多层 export * from 时无法正确追踪导出
 * - 路径别名 @/custom-table/types 解析时需要明确的导出声明
 * - Rollup DTS 插件无法展开所有嵌套的 export * from 语句
 * - bundle 模式下构建工具在解析时如果先看到 export * from，可能会认为模块没有导出
 */

// ==================== 关键类型显式导出（必须在 export * from 之前）====================
// ⚠️ 重要：这些类型必须显式导出，因为 Rollup DTS 插件无法正确追踪多层 export * from 链
//
// 导出策略说明：
// 1. 枚举值（enum）使用 export { } 导出（值导出，用于运行时）
// 2. 类型别名使用 export type { } 导出（类型导出，isolatedModules 要求）
// 3. 函数使用 export { } 导出（值导出，用于运行时）
// 4. 接口/类型使用 export type { } 导出（类型导出）

// 1. 枚举值（enum）- 值导出，用于运行时
export {
  AlertTypeEnum,
  ColumnFixedEnum,
  LifecyclePhaseEnum,
  PaginationPropertyEnum,
  PluginNameEnum,
  PluginPriorityEnum,
  PluginStatusEnum,
  SortDirectionEnum,
  TableActionEnum,
  TableFeatureEnum,
  TableSizeEnum,
} from './core/enums';

// 2. 类型别名 - 类型导出
export type {
  PluginPriority,
  PriorityMap,
} from './core/enums';

// 3. 基础类型 - 类型导出（从 core/common.ts）
export type {
  BaseQuery,
  BaseRecord,
  ServiceRequestType,
} from './core/common';

// 4. 组件类型 - 类型导出（从 components/props.ts）
export type { CustomTableProps } from './components/props';

// 5. 插件核心类型 - 类型导出（从 plugins/core/context.ts）
export type {
  CustomTablePluginProps,
  PluginContext,
} from './plugins/core/context';

// 6. 列类型 - 类型导出（从 plugins/table-columns.ts）
export type { ColumnItem } from './plugins/table-columns';

// 7. 工具函数 - 值导出，用于运行时
export { createPaginationStateManager } from './utils/state-managers';

// ==================== 核心类型（使用 export * from，保持类型系统完整性）====================
export * from './core';

// ==================== 组件类型 ====================
export * from './components';

// ==================== 插件类型 ====================
export * from './plugins';

// ==================== 工具类型 ====================
export * from './utils';

// ==================== 常量类型 ====================
export * from './constants';

// ==================== Hooks 类型 ====================
export * from './hooks';

// ==================== 表格 Ref 类型 ====================
export * from './table-ref';

// ==================== Schema Table 预设类型 ====================
// 注意：类型定义已在 schema-table/types.ts 中使用 Schema 前缀命名
// （如 SchemaFilterConfig、SchemaPaginationConfig 等），避免与 components 中的类型冲突
export * from './schema-table';

// ==================== API 类型 ====================
// 从 api 目录统一导出（避免跨层级导出，在顶层统一导出）
export * from './api';
