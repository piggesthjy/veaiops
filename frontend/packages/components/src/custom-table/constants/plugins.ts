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

// import { ColumnWidthPersistencePlugin } from '@/custom-table/plugins/column-width-persistence';
/**
 * CustomTable 默认插件配置
 */
import { DataSourcePlugin } from '@/custom-table/plugins/data-source';
// import { QuerySyncPlugin } from '@/custom-table/plugins/query-sync';
import { TableAlertPlugin } from '@/custom-table/plugins/table-alert';
import { TableColumnsPlugin } from '@/custom-table/plugins/table-columns';
import { TableFilterPlugin } from '@/custom-table/plugins/table-filter';
import { TablePaginationPlugin } from '@/custom-table/plugins/table-pagination';
import { TableSortingPlugin } from '@/custom-table/plugins/table-sorting';
import { PluginPriorityEnum } from '@/custom-table/types/core/enums';

/**
 * 默认插件配置列表
 */
export const DEFAULT_PLUGINS = [
  // 数据源处理
  DataSourcePlugin({
    enabled: true,
    priority: PluginPriorityEnum.HIGH,
  }),

  // 列管理
  TableColumnsPlugin({
    enabled: true,
    priority: PluginPriorityEnum.HIGH,
  }),

  // 列宽持久化 - 高优先级，需要在列管理之后执行
  // ColumnWidthPersistencePlugin({
  //   enabled: true,
  //   priority: PluginPriorityEnum.HIGH,
  // }),

  // 查询参数同步
  // QuerySyncPlugin,

  // 表格过滤
  TableFilterPlugin({
    enabled: true,
    priority: PluginPriorityEnum.MEDIUM,
  }),

  // 排序功能
  TableSortingPlugin({
    enabled: true,
    priority: PluginPriorityEnum.MEDIUM,
  }),

  // 分页功能
  TablePaginationPlugin({
    enabled: true,
    priority: PluginPriorityEnum.MEDIUM,
  }),

  // 提示信息 - 🐛 重新启用，使用简化实现
  TableAlertPlugin({
    enabled: true,
    priority: PluginPriorityEnum.LOW,
  }),
];
