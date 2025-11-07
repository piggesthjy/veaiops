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

import { Tag, Tooltip } from '@arco-design/web-react';
import type { ColumnProps } from '@arco-design/web-react/es/Table';
import type { MetricThresholdResult } from 'api-generate';
import { ErrorTooltipContent } from './error-tooltip-content';

/**
 * 获取状态列配置
 *
 * 状态判断逻辑：
 * - 有 error_message 则为失败状态
 * - 没有 error_message 则为成功状态
 *
 * 注意：虽然 Python 后端定义了 status 字段，但实际数据中可能不包含该字段，
 * 因此根据 error_message 的存在与否来判断状态
 */
export const getStatusColumn = (): ColumnProps<MetricThresholdResult> => ({
  title: '状态',
  dataIndex: 'status',
  key: 'status',
  width: 120,
  align: 'center' as const,
  render: (_: unknown, record: MetricThresholdResult) => {
    const errorMessage = record?.error_message;

    // 根据 error_message 判断状态：有 error_message 为失败，没有为成功
    const isFailed = Boolean(errorMessage);

    // 如果没有错误信息，显示成功状态
    if (!isFailed) {
      return <Tag color="green">成功</Tag>;
    }

    // 如果有错误信息，显示失败状态和错误详情 Tooltip
    return (
      <Tooltip
        content={<ErrorTooltipContent errorMessage={errorMessage || ''} />}
        triggerProps={{
          popupStyle: {
            zIndex: 2000,
          },
        }}
      >
        <Tag color="red">失败</Tag>
      </Tooltip>
    );
  },
});
