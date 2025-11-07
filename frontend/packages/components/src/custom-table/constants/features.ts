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
 * CustomTable 功能开关常量定义
 */
import { PluginNames } from './enum';

/**
 * 功能开关默认值
 * 基于实际业务需求优化，列宽持久化默认启用
 */
export const DEFAULT_FEATURES = {
  enableFilter: true,
  // 🐛 重新启用，使用简化实现
  enableAlert: true,
  enablePagination: true,
  enableSorting: true,
  enableDataSource: true,
  enableColumns: true,
  enableCustomLoading: false,
  enableToolbar: false,
  enableSearch: false,
  enableRowSelection: false,
  enableColumnWidthPersistence: true, // 🎯 默认启用列宽持久化
} as const;

// 功能开关类型已移动到 types 目录统一管理
// 避免循环导入，直接从 types/constants/features 导入
export type { FeatureFlags } from '@/custom-table/types/constants/features';

/**
 * 功能插件映射表
 */
export const FEATURE_PLUGIN_MAP = {
  enableFilter: [PluginNames.TABLE_FILTER],
  enableAlert: [PluginNames.TABLE_ALERT],
  enablePagination: [PluginNames.TABLE_PAGINATION],
  enableSorting: [PluginNames.TABLE_SORTING],
  enableDataSource: [PluginNames.DATA_SOURCE],
  enableColumns: [PluginNames.TABLE_COLUMNS],
  enableCustomLoading: [PluginNames.CUSTOM_LOADING],
  enableToolbar: [PluginNames.TABLE_TOOLBAR],
  enableSearch: [PluginNames.TABLE_SEARCH],
  enableRowSelection: [PluginNames.ROW_SELECTION],
  enableColumnWidthPersistence: [PluginNames.COLUMN_WIDTH_PERSISTENCE],
} as const;
