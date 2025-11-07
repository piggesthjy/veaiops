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
 * 监控配置表格列配置
 *
 * 将列配置逻辑单独抽象出来，提高代码可维护性
 * 业务方可以通过修改这个文件来定制列配置
 */

import type { DataSource, DataSourceType } from 'api-generate';
import { useCallback } from 'react';
import { getCommonColumns } from './columns/index';

/**
 * 监控表格列配置参数
 */
export interface MonitorTableColumnsConfig {
  /** 数据源类型 */
  dataSourceType: DataSourceType;
  /** 编辑处理器 */
  onEdit?: (monitor: DataSource) => void;
  /** 删除处理器（返回 void，用于操作列） */
  handleDelete?: (id: string) => Promise<boolean>;
  /** 切换激活状态处理器 */
  handleToggle?: () => Promise<boolean>;
}

/**
 * 监控表格列配置 Hook
 *
 * @param config 列配置参数
 * @returns 列配置函数
 */
export const useMonitorTableColumns = ({
  dataSourceType,
  onEdit,
  handleDelete,
  handleToggle,
}: MonitorTableColumnsConfig) => {
  return useCallback(
    (_props: Record<string, unknown>) => {
      return getCommonColumns(
        dataSourceType,
        handleDelete || (() => Promise.resolve()), // 提供默认的删除处理器
        onEdit, // ✅ 类型安全
        handleToggle, // ✅ 自动刷新
      );
    },
    [dataSourceType, handleDelete, handleToggle, onEdit],
  );
};
