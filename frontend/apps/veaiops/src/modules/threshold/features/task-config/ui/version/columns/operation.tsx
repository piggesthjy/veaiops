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

import type { ColumnProps } from '@arco-design/web-react/es/Table';
import { IconInfoCircle } from '@arco-design/web-react/icon';
import {
  type ButtonConfiguration,
  ButtonGroupRender,
} from '@veaiops/components';
import { IntelligentThresholdTaskVersion } from 'api-generate';
import type { FlattenedVersion } from './types';
import { getTooltipByStatusAndAction } from './utils';

/**
 * 操作列配置
 */
export const getOperationColumn = ({
  onCreateAlarm,
  onViewCleaningResult,
  onRerunOpen,
}: {
  onCreateAlarm: (data: FlattenedVersion) => void;
  onViewCleaningResult?: (data: FlattenedVersion) => void;
  onRerunOpen: (data: FlattenedVersion) => void;
}): ColumnProps<FlattenedVersion> => ({
  title: '操作',
  dataIndex: 'operation',
  fixed: 'right',
  width: 250,
  render: (_: unknown, record: FlattenedVersion) => {
    const buttonConfigurations: ButtonConfiguration[] = [
      {
        text: '重新执行',
        dataTestId: 're-execute-task-btn',
        onClick: () => {
          onRerunOpen(record);
        },
      },
      {
        text: '查看任务结果',
        disabled:
          record?.status !== IntelligentThresholdTaskVersion.status.SUCCESS,
        tooltip:
          record?.status !== IntelligentThresholdTaskVersion.status.SUCCESS
            ? getTooltipByStatusAndAction(
                record?.status,
                'view',
                record?.error_message,
              )
            : undefined,
        // 为错误信息的 tooltip 设置更高的 zIndex，确保不被遮挡
        tooltipProps:
          record?.status !== IntelligentThresholdTaskVersion.status.SUCCESS &&
          record?.error_message
            ? {
                position: 'left',
              }
            : undefined,
        // 在失败状态下，为按钮添加图标提示，告知用户可以 hover 查看错误信息
        buttonProps:
          record?.status !== IntelligentThresholdTaskVersion.status.SUCCESS &&
          record?.error_message
            ? {
                icon: (
                  <IconInfoCircle
                    style={{
                      color: 'var(--color-warning-6, #ff7d00)',
                      fontSize: '14px',
                      marginRight: '4px',
                    }}
                  />
                ),
              }
            : undefined,
        dataTestId: 'view-task-result-btn',
        onClick: () => {
          // 即使按钮禁用，如果任务失败，也应该允许用户查看失败原因
          // 但这里保持原有逻辑，只允许成功状态查看结果
          if (
            record?.status === IntelligentThresholdTaskVersion.status.SUCCESS
          ) {
            onViewCleaningResult?.(record);
          }
        },
      },
      {
        text: '创建告警规则',
        disabled:
          record?.status !== IntelligentThresholdTaskVersion.status.SUCCESS,
        tooltip:
          record?.status !== IntelligentThresholdTaskVersion.status.SUCCESS
            ? getTooltipByStatusAndAction(
                record?.status,
                'create',
                record?.error_message,
              )
            : undefined,
        dataTestId: 'create-alert-rule-btn',
        onClick: () => {
          if (onCreateAlarm) {
            onCreateAlarm(record);
          }
        },
      },
    ];

    return (
      <ButtonGroupRender
        buttonConfigurations={buttonConfigurations}
        className="flex-nowrap"
      />
    );
  },
});
