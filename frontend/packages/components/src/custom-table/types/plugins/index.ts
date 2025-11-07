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
 * 插件类型统一导出
 */

// ==================== 行选择插件 ====================
export * from './row-selection';

// ==================== 拖拽排序插件 ====================
export * from './drag-sort';

// ==================== 列冻结插件 ====================
export * from './column-freeze';

// ==================== 表格展开插件 ====================
export * from './table-expand';

// ==================== 虚拟滚动插件 ====================
export * from './virtual-scroll';

// ==================== 表格工具栏插件 ====================
export * from './table-toolbar';

// ==================== 智能单元格插件 ====================
export * from './smart-cell';

// ==================== 表格列插件 ====================
export * from './table-columns';

// ==================== 行内编辑插件类型 ====================
export * from './inline-edit';

// ==================== 数据源插件 ====================
// 注意：DataSourceConfig 和 DataSourceState 需要重命名以避免与其他模块冲突
export type {
  DataSourceMethods,
  DataSourceConfig as PluginDataSourceConfig,
  DataSourceState as PluginDataSourceState,
} from './data-source';

// ==================== 表格警告插件 ====================
export * from './table-alert';

// ==================== 表格筛选插件 ====================
export * from './table-filter';

// ==================== 表格分页插件 ====================
export * from './table-pagination';

// ==================== 表格排序插件 ====================
export * from './table-sorting';

// ==================== 列宽持久化插件 ====================
export * from './column-width-persistence';

// ==================== 查询同步插件 ====================
export * from './query-sync';

// ==================== 自定义筛选设置插件 ====================
export type {
  CustomFilterSettingProps,
  CustomFilterSettingConfig,
  CustomFilterSettingState,
} from '../../plugins/custom-filter-setting';

// ==================== 核心插件系统类型 ====================
export * from './core';
