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
  BaseRecord,
  BatchActionConfig,
  RowSelectionState,
} from '@/custom-table/types';
import { devLog } from '@/custom-table/utils';
import { Button, Modal, Space } from '@arco-design/web-react';
import { IconExclamationCircle } from '@arco-design/web-react/icon';
/**
 * 批量操作组件
 * 基于行选择状态显示批量操作按钮
 */
import type React from 'react';
import { useState } from 'react';
import styles from './batch-actions.module.less';

interface BatchActionsProps<RecordType extends BaseRecord = BaseRecord> {
  /** 批量操作配置 */
  actions: BatchActionConfig<RecordType>[];
  /** 选择状态 */
  selectionState: RowSelectionState<RecordType>;
  /** 执行批量操作 */
  onExecuteAction: (action: BatchActionConfig<RecordType>) => Promise<void>;
  /** 样式类名 */
  className?: string;
}

export const BatchActions = <RecordType extends BaseRecord = BaseRecord>({
  actions,
  selectionState,
  onExecuteAction,
  className,
}: BatchActionsProps<RecordType>): React.ReactElement | null => {
  const [loading, setLoading] = useState<string | null>(null);
  const { selectedRowKeys, selectedRows } = selectionState;

  // 没有选中行时不显示
  if (selectedRowKeys.length === 0) {
    return null;
  }

  // 处理操作执行
  const handleAction = async (action: BatchActionConfig<RecordType>) => {
    try {
      // 权限检查
      if (action.permission && !action.permission(selectedRows)) {
        devLog.warn({
          component: 'BatchActions',
          message: 'Permission denied for action',
          data: {
            action: action.key,
          },
        });
        return;
      }

      // 禁用状态检查
      if (
        typeof action.disabled === 'function' &&
        action.disabled(selectedRows)
      ) {
        devLog.warn({
          component: 'BatchActions',
          message: 'Action is disabled',
          data: {
            action: action.key,
          },
        });
        return;
      }

      if (typeof action.disabled === 'boolean' && action.disabled) {
        devLog.warn({
          component: 'BatchActions',
          message: 'Action is disabled',
          data: {
            action: action.key,
          },
        });
        return;
      }

      // 确认提示
      if (action.confirmText) {
        const confirmMessage =
          typeof action.confirmText === 'function'
            ? action.confirmText(selectedRows)
            : action.confirmText;

        Modal.confirm({
          title: '确认操作',
          icon: <IconExclamationCircle />,
          content: confirmMessage,
          okText: '确认',
          cancelText: '取消',
          onOk: async () => {
            await executeAction(action);
          },
        });
      } else {
        await executeAction(action);
      }
    } catch (error) {
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      devLog.error({
        component: 'BatchActions',
        message: 'Failed to handle action',
        data: {
          action: action.key,
          error: errorObj.message,
          errorObj,
        },
      });
    }
  };

  // 执行操作
  const executeAction = async (action: BatchActionConfig<RecordType>) => {
    setLoading(action.key);
    try {
      await onExecuteAction(action);
      devLog.log({
        component: 'BatchActions',
        message: 'Action executed successfully',
        data: {
          action: action.key,
          selectedCount: selectedRows.length,
        },
      });
    } catch (error) {
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      devLog.error({
        component: 'BatchActions',
        message: 'Action execution failed',
        data: {
          action: action.key,
          error: errorObj.message,
          errorObj,
        },
      });
      throw errorObj;
    } finally {
      setLoading(null);
    }
  };

  // 渲染操作按钮
  const renderActionButton = (action: BatchActionConfig<RecordType>) => {
    const isDisabled =
      typeof action.disabled === 'function'
        ? action.disabled(selectedRows)
        : action.disabled;

    const hasPermission = !action.permission || action.permission(selectedRows);

    return (
      <Button
        key={action.key}
        type={action.danger ? 'primary' : 'outline'}
        status={action.danger ? 'danger' : 'default'}
        icon={action.icon}
        loading={loading === action.key}
        disabled={isDisabled || !hasPermission}
        onClick={() => handleAction(action)}
        size="small"
      >
        {action.title}
      </Button>
    );
  };

  return (
    <div className={`${styles.batchActions} ${className || ''}`}>
      <Space size={8}>
        <span className={styles.selectedInfo}>
          已选择 {selectedRowKeys.length} 项
        </span>
        {actions.map(renderActionButton)}
      </Space>
    </div>
  );
};
