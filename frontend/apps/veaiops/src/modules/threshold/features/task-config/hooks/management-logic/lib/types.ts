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

import type {
  IntelligentThresholdTask,
  MetricThresholdResult,
} from 'api-generate';
import type { TaskTableActions } from '@task-config/lib';

/**
 * 表格列配置函数的参数类型
 */
export type TableColumnProps = Record<string, unknown>;

/**
 * 筛选器配置函数的参数类型
 */
export type FilterProps = Record<string, unknown>;

/**
 * 操作按钮配置函数的参数类型
 */
export type ActionProps = Record<string, unknown>;

/**
 * 任务配置表格配置选项
 */
export interface UseTaskTableConfigOptions {
  onCreate?: () => Promise<boolean>;
  onEdit?: (record: IntelligentThresholdTask) => Promise<boolean>;
  onDelete?: (id: string) => Promise<boolean>;
  onViewDetail?: (record: IntelligentThresholdTask) => void;
  onRerun?: (record: IntelligentThresholdTask) => void;
  onBatchRerun?: () => void;
  onViewVersions?: (record: IntelligentThresholdTask) => void;
  onCreateAlarm?: (record: IntelligentThresholdTask) => void;
  onCopy?: (record: IntelligentThresholdTask) => void;
  selectedTasks?: string[];
  onSelectedTasksChange?: (selectedTasks: string[]) => void;
  handleTaskDetail?: (record: IntelligentThresholdTask) => void;
  onViewTimeSeries?: (
    record: MetricThresholdResult,
    task?: IntelligentThresholdTask,
  ) => void;
}

/**
 * 任务配置表格配置返回值
 */
export interface UseTaskTableConfigReturn {
  dataSource: Record<string, unknown>;
  tableProps: Record<string, unknown>;
  tableEventHandlers: {
    onEdit: (task: IntelligentThresholdTask) => void;
    onRerun: (task: IntelligentThresholdTask) => void;
    onViewVersions: (task: IntelligentThresholdTask) => void;
    onCreateAlarm: (task: IntelligentThresholdTask) => void;
    onCopy: (task: IntelligentThresholdTask) => void;
    onAdd: () => void;
    onBatchRerun: () => void;
  };
  tableActions: TaskTableActions;
}
