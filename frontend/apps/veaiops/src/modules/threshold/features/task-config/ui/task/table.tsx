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

import { TASK_CONFIG_MANAGEMENT_CONFIG } from '@task-config/lib';
import type { TaskFiltersQuery } from '@task-config/lib/filters';
import {
  type BaseQuery,
  CustomTable,
  type CustomTableActionType,
} from '@veaiops/components';
import type { IntelligentThresholdTask } from 'api-generate';
import { forwardRef, useMemo, useRef } from 'react';
import { TASK_TABLE_QUERY_FORMAT } from './config';
import { useTableConfig, useTableOperations, useTableRef } from './hooks';
import type { TaskTableProps, TaskTableRef } from './types';

/**
 * Intelligent threshold task table component
 * Encapsulates table rendering logic and provides a clear interface
 */
export const TaskTable = forwardRef<TaskTableRef, TaskTableProps>(
  (props, ref) => {
    // Create internal ref to pass to CustomTable
    const customTableRef =
      useRef<
        CustomTableActionType<
          IntelligentThresholdTask,
          TaskFiltersQuery & BaseQuery
        >
      >(null);

    // Use cohesive table configuration Hook
    const {
      customTableProps,
      handleColumns,
      handleFilters,
      renderActions,
      operations,
    } = useTableConfig(props, customTableRef);

    // Manage auto-refresh operations
    const autoRefreshOperations = useTableOperations({
      refreshFn: operations.refresh,
    });

    // Expose refresh function and auto-refresh operations to parent component
    useTableRef(ref, customTableRef, {
      operations: autoRefreshOperations,
    });

    // Extract base table props with type safety
    const baseTableProps = useMemo(() => {
      if (
        customTableProps.tableProps &&
        typeof customTableProps.tableProps === 'object' &&
        !Array.isArray(customTableProps.tableProps)
      ) {
        return customTableProps.tableProps as Record<string, unknown>;
      }
      return {};
    }, [customTableProps.tableProps]);

    // Configure row selection
    const rowSelection = useMemo(
      () => ({
        selectedRowKeys: props.selectedTasks,
        type: 'checkbox' as const,
        onChange: (selectedRowKeys: (string | number)[]) => {
          props.onSelectedTasksChange(selectedRowKeys as string[]);
        },
      }),
      [props.selectedTasks, props.onSelectedTasksChange],
    );

    // Merge table props
    const mergedTableProps = useMemo(
      () => ({
        ...baseTableProps,
        rowSelection,
      }),
      [baseTableProps, rowSelection],
    );

    return (
      <CustomTable<IntelligentThresholdTask>
        ref={customTableRef}
        title={TASK_CONFIG_MANAGEMENT_CONFIG.title}
        {...customTableProps}
        actions={renderActions()}
        handleColumns={handleColumns}
        handleFilters={handleFilters}
        tableProps={mergedTableProps}
        queryFormat={TASK_TABLE_QUERY_FORMAT}
        syncQueryOnSearchParams
        useActiveKeyHook
      />
    );
  },
);

TaskTable.displayName = 'TaskTable';

export default TaskTable;
