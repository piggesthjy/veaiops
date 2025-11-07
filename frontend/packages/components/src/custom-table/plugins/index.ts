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
 * CustomTable 插件导出
 */

// 基础类型和系统
export * from './plugin-system';

// 数据源插件
export * from './data-source';

// 过滤器插件
export * from './table-filter';

// 列管理插件
export * from './table-columns';

// 分页插件
export * from './table-pagination';

// 排序插件
export * from './table-sorting';

// 查询参数同步插件
export * from './query-sync';

// 列宽持久化插件
export * from './column-width-persistence';

// 自定义字段插件
export * from './custom-fields';

// 自定义过滤器设置插件
export * from './custom-filter-setting';

// 行选择插件
export * from './row-selection';

// 行内编辑插件
export * from './inline-edit';

// 智能单元格插件
export * from './smart-cell';

// 核心插件系统类型导出 (已合并到core.ts)
export * from '@/custom-table/types/plugins/core';

// 具体插件类型导出
export * from '@/custom-table/types/plugins/data-source';
export * from '@/custom-table/types/plugins/table-alert';
export * from '@/custom-table/types/plugins/table-columns';
// table-filter 类型已通过 ./table-filter 导出，避免重复导出
// export * from '@/custom-table/types/plugins/table-filter';
export * from '@/custom-table/types/plugins/table-pagination';
export * from '@/custom-table/types/plugins/table-sorting';
// inline-edit 和 smart-cell 类型已通过对应插件导出，避免重复导出
// export * from '@/custom-table/types/plugins/inline-edit';
// export * from '@/custom-table/types/plugins/smart-cell';
