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

// Copyright 2025 Beijing Volcano Technology Co., Ltd. and/or its affiliates
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

import { IntelligentThresholdTaskVersion } from 'api-generate';
import type React from 'react';
import { ErrorTooltipContent } from '../../components/table-columns';

/**
 * 根据状态值获取对应的颜色
 */
export const getStatusColor = (statusValue: string): string | undefined => {
  switch (statusValue) {
    case IntelligentThresholdTaskVersion.status.SUCCESS:
      return 'green'; // 成功 - 绿色
    case IntelligentThresholdTaskVersion.status.FAILED:
      return 'red'; // 失败 - 红色
    case IntelligentThresholdTaskVersion.status.RUNNING:
      return 'blue'; // 运行中 - 蓝色
    case IntelligentThresholdTaskVersion.status.LAUNCHING:
      return 'arcoblue'; // 启动中 - 浅蓝色
    case IntelligentThresholdTaskVersion.status.STOPPED:
      return 'gray'; // 已停止 - 灰色
    default:
      return undefined; // 未知状态使用默认样式
  }
};

/**
 * 根据任务状态和按钮类型生成相应的 Tooltip 提示
 */
export const getTooltipByStatusAndAction = (
  status: string,
  action: 'view' | 'create',
  errorMessage?: string,
): React.ReactNode | string => {
  switch (status) {
    case IntelligentThresholdTaskVersion.status.FAILED:
      // 如果是查看任务结果操作，且存在错误信息，显示详细的失败原因
      if (action === 'view' && errorMessage) {
        // 返回错误信息的 Tooltip 内容（ReactNode）
        return <ErrorTooltipContent errorMessage={errorMessage} />;
      }
      // 如果没有错误信息，返回提示用户可以查看失败原因
      if (action === 'view') {
        return '任务执行失败，无法查看任务结果。请将鼠标悬停在此按钮上查看失败原因';
      }
      // 创建告警规则操作
      return '任务执行失败，无法创建告警规则';
    case IntelligentThresholdTaskVersion.status.RUNNING:
      return action === 'view'
        ? '任务正在运行中，请等待执行完成后查看结果'
        : '任务正在运行中，请等待执行完成后创建告警规则';
    case IntelligentThresholdTaskVersion.status.LAUNCHING:
      return action === 'view'
        ? '任务正在启动中，请等待执行完成后查看结果'
        : '任务正在启动中，请等待执行完成后创建告警规则';
    case IntelligentThresholdTaskVersion.status.STOPPED:
      return action === 'view'
        ? '任务已停止，无法查看任务结果'
        : '任务已停止，无法创建告警规则';
    default:
      return '';
  }
};
