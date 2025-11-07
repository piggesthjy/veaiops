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

import type { FormInstance } from '@arco-design/web-react/es/Form';
import type { OperationType } from '@task-config/lib';
import type {
  IntelligentThresholdTask,
  IntelligentThresholdTaskVersion,
} from 'api-generate';
import type React from 'react';
import { TaskVersionTable } from '../../version';
import { TaskInfoDisplay, TaskVersionHistory } from '../displays';
import { TaskBasicForm } from '../forms';

interface TaskDrawerContentProps {
  operationType: OperationType;
  editingTask: IntelligentThresholdTask | null;
  form: FormInstance;
  loading: boolean;
  onSubmit: (values: any) => Promise<boolean>;
  versions: IntelligentThresholdTaskVersion[];
  versionsLoading: boolean;
  setDetailConfigData: (data: any) => void;
  setDetailConfigVisible: (visible: boolean) => void;
  onViewCleaningResult: (version: IntelligentThresholdTaskVersion) => void;
}

/**
 * 任务抽屉内容组件
 */
export const TaskDrawerContent: React.FC<TaskDrawerContentProps> = ({
  operationType,
  editingTask,
  form,
  loading,
  onSubmit,
  versions,
  versionsLoading,
  setDetailConfigData,
  setDetailConfigVisible,
  onViewCleaningResult,
}) => {
  // 渲染版本历史
  if (operationType === 'versions') {
    return <TaskVersionHistory versions={versions} loading={versionsLoading} />;
  }

  // 渲染任务详情
  if (operationType === 'detail') {
    return (
      <TaskVersionTable
        task={editingTask}
        setDetailConfigData={setDetailConfigData}
        setDetailConfigVisible={setDetailConfigVisible}
        onViewCleaningResult={onViewCleaningResult}
      />
    );
  }

  // 渲染重新执行
  if (operationType === 'rerun') {
    return (
      <TaskInfoDisplay
        task={editingTask}
        title="任务信息"
        description="重新执行将会使用当前任务配置重新运行智能阈值计算，这可能需要几分钟时间。执行过程中任务状态将变为运行中。"
      />
    );
  }

  // 渲染创建/编辑表单
  return (
    <TaskBasicForm
      form={form}
      loading={loading}
      onSubmit={onSubmit}
      operationType={operationType}
    />
  );
};

export default TaskDrawerContent;
