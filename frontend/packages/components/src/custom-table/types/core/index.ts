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
 * CustomTable 核心类型统一导出
 */

// ==================== 基础类型 ====================
// 从 common 中导出所有类型（PluginPriority、PluginStatus、LifecyclePhase 已从 enums 导出，common 中不再重复定义）
export * from './common';

// ==================== 数据源类型 ====================
// 注意：DataSourceConfig 需要重命名为 CoreDataSourceConfig 以避免与 plugins/data-source.ts 中的 DataSourceConfig 冲突
export type {
  TableDataSource,
  DataSourceState,
  DataSourceActions,
  DataSourceHookResult,
  DataSourceConfig as CoreDataSourceConfig,
  DataProcessor,
} from './data-source';

// ==================== 请求管理类型 ====================
export * from './request-manager';

// ==================== 表格助手类型 ====================
export * from './table-helpers';

// ==================== 类型守卫和安全转换 ====================
export * from './type-guards';

// ==================== 枚举类型 ====================
// ⚠️ 注意：枚举类型通过 export * 导出，但构建工具可能无法正确追踪多层导出链
// 因此在顶层 types/index.ts 中也需要显式导出枚举（见 types/index.ts 第 60-72 行）
// 这样可以确保：
// 1. 通过 export * from './core' 的路径可以访问枚举（用于类型检查）
// 2. 通过显式导出路径可以访问枚举（用于运行时构建）
export * from './enums';
