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

import type { IntelligentThresholdTask } from 'api-generate';

/**
 * Task table component props interface
 */
export interface TaskTableProps {
  onEdit: (task: IntelligentThresholdTask) => void;
  onRerun: (task: IntelligentThresholdTask) => void;
  onViewVersions: (task: IntelligentThresholdTask) => void;
  onCreateAlarm: (task: IntelligentThresholdTask) => void;
  onCopy: (task: IntelligentThresholdTask) => void;
  onAdd: () => void;
  onBatchRerun: () => void;
  onDelete?: (taskId: string) => Promise<boolean>;
  selectedTasks: string[];
  onSelectedTasksChange: (selectedTasks: string[]) => void;
  handleTaskDetail: (task: IntelligentThresholdTask) => void;
  onViewDatasource?: (task: IntelligentThresholdTask) => void;
}

/**
 * Task table component ref interface
 * Provides refresh functionality and auto-refresh CRUD operations
 */
export interface TaskTableRef {
  refresh: () => Promise<{ success: boolean; error?: Error }>;
  operations: {
    delete: (id: string) => Promise<boolean>;
    update: () => Promise<{ success: boolean; error?: Error }>;
    create?: (data: unknown) => Promise<{ success: boolean; error?: Error }>;
  };
}
