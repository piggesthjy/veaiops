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

import type { BaseQuery, HandleFilterProps } from '@veaiops/components';
import { CustomTable } from '@veaiops/components';
import type { ModuleType } from '@veaiops/types';
import { queryArrayFormat } from '@veaiops/utils';
import type { Event as PushHistoryRecord } from 'api-generate';
import type React from 'react';
import { useCallback, useMemo } from 'react';
import { getPushHistoryFilters } from './filters';
import {
  usePushHistoryActionConfig,
  usePushHistoryTableConfig,
} from './hooks/use-push-history-management-logic';
import { useTableColumns } from './table-columns';

/**
 * 推送历史表格组件属性接口
 */
interface PushHistoryTableProps {
  moduleType: ModuleType;
  title?: string;
  showModuleTypeColumn?: boolean;
  customActions?: (record: PushHistoryRecord) => React.ReactNode;
  loading?: boolean;
  onViewDetail?: (record: PushHistoryRecord) => void;
}

const queryFormat = {
  agent_type: queryArrayFormat,
  event_level: queryArrayFormat,
  show_status: queryArrayFormat, // 状态数组
};

/**
 * 推送历史表格组件
 * 封装表格的渲染逻辑，提供清晰的接口
 */
export const PushHistoryTable: React.FC<PushHistoryTableProps> = ({
  moduleType,
  title = '历史事件',
  showModuleTypeColumn = true,
  customActions,
  loading = false,
  onViewDetail,
}) => {
  // 表格配置
  const { dataSource, tableProps } = usePushHistoryTableConfig({
    moduleType,
    showModuleTypeColumn,
  });

  // 操作按钮配置
  const { actionButtons } = usePushHistoryActionConfig({
    loading,
  });

  // 获取表格列配置
  const columns = useTableColumns({
    showModuleTypeColumn,
    customActions,
    moduleType,
    onViewDetail,
  });

  // 🔧 修复死循环：使用 useMemo 缓存 handleColumns 函数
  const handleColumns = useMemo(() => {
    return () => columns;
  }, [columns]);

  // 🔧 修复死循环：使用 useCallback 缓存 handleFilters 函数
  const handleFilters = useCallback(
    (params: HandleFilterProps<BaseQuery>) => {
      return getPushHistoryFilters({
        ...params,
        handleFiltersProps: { moduleType, ...params.handleFiltersProps },
      });
    },
    [moduleType],
  );

  // 🔧 修复死循环：使用 useMemo 缓存 handleFiltersProps
  const handleFiltersProps = useMemo(() => ({ moduleType }), [moduleType]);

  return (
    <div data-testid="oncall-history-table">
      <CustomTable
        // 表格标题
        title={title}
        // 数据源配置
        dataSource={dataSource}
        // 列配置处理函数
        handleColumns={handleColumns}
        // 过滤器处理函数
        handleFilters={handleFilters}
        handleFiltersProps={handleFiltersProps}
        // 使用Hook返回的表格属性配置
        tableProps={tableProps}
        // 操作按钮
        actions={actionButtons}
        // 表格样式
        tableClassName="push-history-table"
        queryFormat={queryFormat}
      />
    </div>
  );
};
