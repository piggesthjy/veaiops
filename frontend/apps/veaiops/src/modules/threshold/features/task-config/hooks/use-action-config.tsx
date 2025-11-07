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

import { Button } from '@arco-design/web-react';
import { IconPlus, IconRefresh } from '@arco-design/web-react/icon';
import { useMemo } from 'react';

export const useTaskActionConfig = (
  onAdd: () => void,
  onBatchRerun: () => void,
  selectedTasks: string[] = [],
) => {
  const actions = useMemo(
    () => [
      <Button
        key="add"
        type="primary"
        icon={<IconPlus />}
        onClick={onAdd}
        data-testid="new-task-btn"
      >
        创建任务
      </Button>,
      <Button
        key="batchRerun"
        icon={<IconRefresh />}
        onClick={onBatchRerun}
        disabled={selectedTasks.length === 0}
        data-testid="batch-auto-update-btn"
      >
        批量自动更新 {selectedTasks.length > 0 && `(${selectedTasks.length})`}
      </Button>,
    ],
    [onAdd, onBatchRerun, selectedTasks],
  );

  return { actions };
};
