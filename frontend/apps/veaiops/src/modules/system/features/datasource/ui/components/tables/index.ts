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
 * Tables - 统一导出入口
 * 职责：导出所有表格组件及其相关配置
 */

// 导出表格组件
export { DataSourceTable } from './data-source-table';
export { MonitorTable } from './monitor-table';
export type { MonitorTableRef } from './monitor-table';

// 导出列配置
export {
  getCommonColumns,
  getZabbixColumns,
  getAliyunColumns,
  getVolcengineColumns,
  getBaseColumns,
  getActionColumn,
} from './columns';

// 导出类型
export type { DeleteHandler, ViewHandler, EditHandler } from './columns';
