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
 * 监控数据源管理表格列配置 - 主入口文件
 */

import type { DeleteHandler, EditHandler } from '@datasource/types';
import type { ModernTableColumnProps } from '@veaiops/components';
import { type DataSource, DataSourceType } from 'api-generate';
import { getActionColumn } from './action-column';
import { getBaseColumns } from './base-columns';

/**
 * 获取通用表格列配置
 */
export const getCommonColumns = (
  dataSourceType: DataSourceType,
  onDelete: DeleteHandler,
  onEdit?: EditHandler,
  onToggled?: () => void,
): ModernTableColumnProps<DataSource>[] => {
  return [
    ...getBaseColumns(dataSourceType),
    getActionColumn(onDelete, onEdit, onToggled),
  ];
};

/**
 * 获取Zabbix专用列配置
 */
export const getZabbixColumns = (
  onDelete: DeleteHandler,
  onEdit?: EditHandler,
  onToggled?: () => void,
) => {
  return getCommonColumns(DataSourceType.ZABBIX, onDelete, onEdit, onToggled);
};

/**
 * 获取阿里云专用列配置
 */
export const getAliyunColumns = (
  onDelete: DeleteHandler,
  onEdit?: EditHandler,
  onToggled?: () => void,
) => {
  return getCommonColumns(DataSourceType.ALIYUN, onDelete, onEdit, onToggled);
};

/**
 * 获取火山引擎专用列配置
 */
export const getVolcengineColumns = (
  onDelete: DeleteHandler,
  onEdit?: EditHandler,
  onToggled?: () => void,
) => {
  return getCommonColumns(
    DataSourceType.VOLCENGINE,
    onDelete,
    onEdit,
    onToggled,
  );
};

// 重新导出类型
export type {
  DeleteHandler,
  ViewHandler,
  EditHandler,
} from '@datasource/types';

// 导出单独的列配置
export { getBaseColumns } from './base-columns';
export { getActionColumn } from './action-column';
