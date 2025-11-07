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
 * 操作列配置
 */

import apiClient from '@/utils/api-client';
import {
  Button,
  Message,
  Popconfirm,
  Space,
  Tooltip,
} from '@arco-design/web-react';
import {
  IconDelete,
  IconEdit,
  IconPlayArrow,
  IconPoweroff,
} from '@arco-design/web-react/icon';
import type { DeleteHandler, EditHandler } from '@datasource/types';
import type { ModernTableColumnProps } from '@veaiops/components';
import { API_RESPONSE_CODE } from '@veaiops/constants';
import type { DataSource } from 'api-generate';

/**
 * 获取操作列配置
 */
export const getActionColumn = (
  onDelete: DeleteHandler,
  onEdit?: EditHandler,
  onToggled?: () => void,
): ModernTableColumnProps<DataSource> => ({
  title: '操作',
  key: 'actions',
  width: 200,
  fixed: 'right' as const,
  render: (_: unknown, record: DataSource) => {
    // 激活/停用处理函数
    const handleToggleActive = async () => {
      const id = record._id;
      if (!id) {
        Message.error('缺少数据源ID，无法执行激活/停用');
        return;
      }
      try {
        const nextActive = !record.is_active;
        const response = await apiClient.dataSources.putApisV1DatasourceActive({
          datasourceId: id,
          requestBody: { is_active: nextActive },
        });
        if (response.code === API_RESPONSE_CODE.SUCCESS) {
          Message.success(nextActive ? '激活成功' : '停用成功');
          // refresh table after toggle
          onToggled?.();
        } else {
          Message.error(response.message || '操作失败');
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : '操作失败，请重试';
        Message.error(errorMessage);
      }
    };

    return (
      <Space>
        <Popconfirm
          title={record?.is_active ? '确认停用' : '确认激活'}
          content={
            record?.is_active
              ? `确定要停用数据源 "${record.name}" 吗？停用后将无法继续监控。`
              : `确定要激活数据源 "${record.name}" 吗？`
          }
          onOk={handleToggleActive}
          okText="确认"
          cancelText="取消"
        >
          <Tooltip content={record?.is_active ? '停用数据源' : '激活数据源'}>
            <Button
              type="text"
              size="small"
              data-testid="toggle-datasource-btn"
              status={record?.is_active ? 'warning' : 'success'}
              icon={record?.is_active ? <IconPoweroff /> : <IconPlayArrow />}
            />
          </Tooltip>
        </Popconfirm>

        {onEdit && (
          <Tooltip content="编辑">
            <Button
              type="text"
              size="small"
              data-testid="edit-datasource-btn"
              icon={<IconEdit />}
              onClick={() => onEdit(record)}
            />
          </Tooltip>
        )}

        <Popconfirm
          title="确认删除"
          content={`确定要删除数据源 "${record.name}" 吗？此操作不可恢复。`}
          onOk={async () => {
            const result = await onDelete(record._id || '');
            // ✅ 如果返回结果对象，根据结果判断是否显示错误
            if (
              result &&
              typeof result === 'object' &&
              'success' in result &&
              !result.success &&
              result.error
            ) {
              // 错误已在函数内部处理（通过 logger），这里不需要额外处理
              // 如果需要显示用户提示，可以在这里添加 Message.error
            }
            // 如果返回 void 或 undefined，表示操作已完成（成功或失败已在函数内部处理）
          }}
          okText="确认"
          cancelText="取消"
        >
          <Tooltip content="删除">
            <Button
              type="text"
              size="small"
              status="danger"
              data-testid="delete-datasource-btn"
              icon={<IconDelete />}
            />
          </Tooltip>
        </Popconfirm>
      </Space>
    );
  },
});
