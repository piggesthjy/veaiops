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
 * 确认弹窗事件处理 Hook
 * @description 处理确认和取消事件的逻辑
 */

import { Message } from '@arco-design/web-react';
import { logger } from '@veaiops/utils';
import { useCallback } from 'react';
import type {
  DataSourceType,
  StepConfig,
  WizardActions,
  WizardState,
} from '../../../types';
import { handleStepDataFetch } from '../../../utils/wizard-logic';

export interface UseModalHandlersProps {
  selectedType: DataSourceType;
  currentStepConfig: StepConfig;
  state: WizardState;
  actions: WizardActions;
  onClose: () => void;
  onConfirm: (dataSource?: unknown) => void;
  editingDataSource?: any;
}

/**
 * 确认弹窗事件处理 Hook
 */
export const useModalHandlers = ({
  selectedType,
  currentStepConfig,
  state,
  actions,
  onClose,
  onConfirm,
  editingDataSource,
}: UseModalHandlersProps) => {
  const handleOk = useCallback(async () => {
    try {
      logger.info({
        message: '[CreationConfirmModal] handleOk 开始执行',
        data: {
          selectedType,
          stepKey: currentStepConfig.key,
          editingDataSourceId: state.editingDataSourceId,
        },
        source: 'CreationConfirmModal',
        component: 'handleOk',
      });

      // 执行创建数据源的逻辑，返回创建结果
      const result = await handleStepDataFetch(
        selectedType,
        state,
        actions,
        currentStepConfig.key,
      );

      logger.info({
        message: '[CreationConfirmModal] handleStepDataFetch 返回结果',
        data: {
          success: result?.success,
          hasResult: Boolean(result),
          resultMessage: result?.message,
        },
        source: 'CreationConfirmModal',
        component: 'handleOk',
      });

      // 判断创建是否成功
      if (result?.success) {
        logger.info({
          message: '[CreationConfirmModal] 创建成功，准备关闭向导',
          data: {
            dataSourceId: result.dataSourceId,
            dataSourceName: state.dataSourceName,
          },
          source: 'CreationConfirmModal',
          component: 'handleOk',
        });

        // 创建成功后关闭向导
        // 传递数据源信息给回调，触发页面刷新
        const dataSourceInfo = {
          name: state.dataSourceName,
          type: selectedType,
          connectName: state.selectedConnect?.name,
          dataSourceId: result.dataSourceId,
        };
        onConfirm(dataSourceInfo);
      } else {
        // ✅ 修复：创建失败时显示错误消息
        const errorMessage = result?.message || '创建数据源失败，请重试';

        logger.error({
          message:
            '[CreationConfirmModal] 创建失败（result.success === false）',
          data: {
            errorMessage,
            resultMessage: result?.message,
            result,
          },
          source: 'CreationConfirmModal',
          component: 'handleOk',
        });

        Message.error(errorMessage);
        // 创建失败，不关闭向导，让用户可以重试
      }
    } catch (error: unknown) {
      // ✅ 修复：创建失败时显示错误消息
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      const errorMessage = errorObj.message || '创建数据源失败，请重试';

      logger.error({
        message: '[CreationConfirmModal] 创建失败（catch 块）',
        data: {
          error: errorMessage,
          stack: errorObj.stack,
          errorObj,
        },
        source: 'CreationConfirmModal',
        component: 'handleOk',
      });

      // ✅ 修复：显示错误消息给用户
      Message.error(errorMessage);
      // 创建失败时不调用 onConfirm，保持弹窗打开状态
    }
  }, [selectedType, state, actions, currentStepConfig, onConfirm]);

  const handleCancel = useCallback(() => {
    onClose();
  }, [selectedType, state.dataSourceName, onClose]);

  return {
    handleOk,
    handleCancel,
  };
};
