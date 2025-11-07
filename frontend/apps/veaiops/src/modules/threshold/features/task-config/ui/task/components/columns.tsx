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
 * 任务配置表格列配置
 *
 * 将列配置逻辑单独抽象出来，提高代码可维护性
 */

import { Button, Space } from '@arco-design/web-react';
import {
  IconCopy,
  IconEye,
  IconPlayCircle,
  IconPlus,
} from '@arco-design/web-react/icon';
import { CellRender } from '@veaiops/components';
import type { IntelligentThresholdTask } from 'api-generate';
import { useCallback } from 'react';

// 解构CellRender组件，避免重复调用
const { InfoWithCode, StampTime, CustomOutlineTag } = CellRender;

/**
 * 任务表格列配置参数
 */
export interface TaskTableColumnsConfig {
  /** 重跑处理器 */
  onRerun?: (task: IntelligentThresholdTask) => void;
  /** 查看版本处理器 */
  onViewVersions?: (task: IntelligentThresholdTask) => void;
  /** 创建告警处理器 */
  onCreateAlarm?: (task: IntelligentThresholdTask) => void;
  /** 复制处理器 */
  onCopy?: (task: IntelligentThresholdTask) => void;
  /** 详情处理器 */
  onTaskDetail?: (task: IntelligentThresholdTask) => void;
}

/**
 * 任务配置表格列配置 Hook
 *
 * @param config 列配置参数
 * @returns 列配置函数
 */
export const useTaskTableColumns = ({
  onRerun,
  onViewVersions,
  onCreateAlarm,
  onCopy,
  onTaskDetail,
}: TaskTableColumnsConfig) => {
  return useCallback(
    (_props: Record<string, unknown>) => [
      {
        title: '任务名称',
        dataIndex: 'name',
        key: 'name',
        width: 200,
        ellipsis: true,
        render: (name: string, record: IntelligentThresholdTask) => (
          <InfoWithCode name={name} code={record._id} isCodeShow={true} />
        ),
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 100,
        render: (status: string) => {
          const statusMap = {
            running: { label: '运行中', color: 'green' },
            stopped: { label: '已停止', color: 'red' },
            pending: { label: '待运行', color: 'orange' },
          };
          const config = statusMap[status as keyof typeof statusMap] || {
            label: status,
            color: 'gray',
          };
          return (
            <CustomOutlineTag colorTheme={config.color as any}>
              {config.label}
            </CustomOutlineTag>
          );
        },
      },
      {
        title: '最后执行时间',
        dataIndex: 'last_run_time',
        key: 'last_run_time',
        width: 180,
        render: (time: string) =>
          time ? <StampTime time={time} template="YYYY-MM-DD HH:mm:ss" /> : '-',
      },
      {
        title: '创建时间',
        dataIndex: 'created_at',
        key: 'created_at',
        width: 180,
        render: (time: string) => (
          <StampTime time={time} template="YYYY-MM-DD HH:mm:ss" />
        ),
      },
      {
        title: '操作',
        key: 'actions',
        width: 300,
        fixed: 'right',
        render: (_: any, record: IntelligentThresholdTask) => (
          <Space size="small">
            {onTaskDetail && (
              <Button
                type="text"
                size="small"
                icon={<IconEye />}
                onClick={() => onTaskDetail(record)}
              >
                详情
              </Button>
            )}
            {onRerun && (
              <Button
                type="text"
                size="small"
                icon={<IconPlayCircle />}
                onClick={() => onRerun(record)}
              >
                重跑
              </Button>
            )}
            {onViewVersions && (
              <Button
                type="text"
                size="small"
                onClick={() => onViewVersions(record)}
              >
                版本
              </Button>
            )}
            {onCreateAlarm && (
              <Button
                type="text"
                size="small"
                icon={<IconPlus />}
                onClick={() => onCreateAlarm(record)}
              >
                告警
              </Button>
            )}
            {onCopy && (
              <Button
                type="text"
                size="small"
                icon={<IconCopy />}
                onClick={() => onCopy(record)}
              >
                复制
              </Button>
            )}
          </Space>
        ),
      },
    ],
    [onRerun, onViewVersions, onCreateAlarm, onCopy, onTaskDetail],
  );
};
