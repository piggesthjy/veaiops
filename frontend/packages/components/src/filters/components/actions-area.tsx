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

import { resetLogCollector } from '@/custom-table/utils/reset-log-collector';
import { Button } from '@arco-design/web-react';
import { ensureArray } from '@veaiops/utils';
import type { FC, ReactNode } from 'react';
import { commonClassName } from '../core/constants';
import { renderActions } from '../core/renderer';

interface ActionsAreaProps {
  /** 包装器类名 */
  wrapperClassName?: string;
  /** 是否显示重置按钮 */
  showReset?: boolean;
  /** 是否可以重置 */
  canReset?: boolean;
  /** 重置处理函数 */
  onReset?: () => void;
  /** 自定义操作按钮 */
  customActions?: ReactNode[] | ReactNode;
  /** 自定义操作按钮样式 */
  customActionsStyle?: React.CSSProperties;
}

/**
 * 操作区域组件
 * 负责渲染重置按钮和自定义操作按钮
 */
const ActionsArea: FC<ActionsAreaProps> = ({
  wrapperClassName = '',
  showReset,
  canReset,
  onReset,
  customActions,
  customActionsStyle = {},
}) => {
  // 处理重置按钮点击
  const handleResetClick = () => {
    resetLogCollector.log({
      component: 'ActionsArea',
      method: 'handleResetClick',
      action: 'start',
      data: {
        showReset,
        canReset,
        hasOnReset: Boolean(onReset),
        timestamp: new Date().toISOString(),
      },
    });

    try {
      if (onReset) {
        resetLogCollector.log({
          component: 'ActionsArea',
          method: 'handleResetClick',
          action: 'call',
          data: {
            method: 'onReset',
          },
        });
        onReset();
      }

      resetLogCollector.log({
        component: 'ActionsArea',
        method: 'handleResetClick',
        action: 'end',
        data: {
          success: true,
        },
      });
    } catch (error: any) {
      resetLogCollector.log({
        component: 'ActionsArea',
        method: 'handleResetClick',
        action: 'error',
        data: {
          error: error.message,
          stack: error.stack,
        },
      });
      throw error;
    }
  };

  // 如果没有任何操作，不渲染
  if (!showReset && !customActions) {
    return null;
  }

  return (
    <div className={`${commonClassName} ${wrapperClassName}`}>
      {/* 重置按钮 */}
      {showReset && canReset && onReset && (
        <Button type="outline" onClick={handleResetClick}>
          重置
        </Button>
      )}

      {/* 自定义操作按钮 */}
      {customActions && (
        <div className={commonClassName} style={customActionsStyle}>
          {renderActions(ensureArray(customActions))}
        </div>
      )}
    </div>
  );
};

export { ActionsArea };
export default ActionsArea;
