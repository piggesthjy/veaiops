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
 * 任务配置表格操作配置
 *
 * 将工具栏操作配置单独抽象出来，提高代码可维护性
 */

import { Button } from '@arco-design/web-react';
import { IconPlayCircle, IconPlus } from '@arco-design/web-react/icon';
import { useCallback } from 'react';

export interface TaskTableActionsConfig {
  /** 新建处理器 */
  onCreate?: () => void;
  /** 批量重跑处理器 */
  onBatchRerun?: (selectedTasks: string[]) => void;
  /** 选中的任务 */
  selectedTasks?: string[];
}

/**
 * 任务配置表格操作配置 Hook
 * 负责定义工具栏操作按钮
 */
export const useTaskTableActions = ({
  onCreate,
  onBatchRerun,
  selectedTasks,
}: TaskTableActionsConfig) => {
  return useCallback(
    (_props: Record<string, unknown>) =>
      [
        onBatchRerun && selectedTasks && selectedTasks.length > 0 && (
          <Button
            key="batch-rerun"
            type="primary"
            icon={<IconPlayCircle />}
            onClick={() => onBatchRerun(selectedTasks)}
          >
            批量重跑 ({selectedTasks.length})
          </Button>
        ),
        onCreate && (
          <Button
            key="create"
            type="primary"
            icon={<IconPlus />}
            onClick={onCreate}
          >
            新建任务
          </Button>
        ),
      ].filter(Boolean),
    [onCreate, onBatchRerun, selectedTasks],
  );
};
