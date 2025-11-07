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
import type { DataSource, DataSourceType } from '@datasource/lib';
import { logger } from '@veaiops/utils';
import { useCallback } from 'react';

/**
 * 监控数据源处理器Hook参数
 */
interface UseMonitorHandlersParams {
  setEditingMonitor: (monitor: DataSource | null) => void;
  setModalVisible: (visible: boolean) => void;
  setWizardVisible: (visible: boolean) => void;
  setDetailDrawerVisible: (visible: boolean) => void;
  setSelectedMonitor: (monitor: DataSource | null) => void;
  form: FormInstance;
  deleteMonitor: (id: string, type: DataSourceType) => Promise<boolean>;
}

/**
 * 监控数据源事件处理器Hook
 * 提供所有UI事件的处理函数
 */
export const useMonitorHandlers = ({
  setEditingMonitor,
  setModalVisible,
  setWizardVisible,
  setDetailDrawerVisible,
  setSelectedMonitor,
  form,
  deleteMonitor,
}: UseMonitorHandlersParams) => {
  // 处理添加
  const handleAdd = useCallback(() => {
    setWizardVisible(true);
  }, [setWizardVisible]);

  // 处理编辑
  const handleEdit = useCallback(
    (monitor: DataSource) => {
      setEditingMonitor(monitor);
      setModalVisible(true);
    },
    [setEditingMonitor, setModalVisible],
  );

  // 处理删除
  interface HandleDeleteParams {
    id: string;
    datasourceType: DataSourceType;
  }
  const handleDelete = useCallback(
    async ({ id, datasourceType }: HandleDeleteParams): Promise<boolean> => {
      try {
        const success = await deleteMonitor(id, datasourceType);
        return success;
      } catch (error: unknown) {
        // ✅ 正确：记录错误并返回失败
        const errorObj =
          error instanceof Error ? error : new Error(String(error));
        logger.error({
          message: '删除监控数据源失败',
          data: {
            error: errorObj.message,
            stack: errorObj.stack,
            errorObj,
            id,
            datasourceType,
          },
          source: 'useMonitorHandlers',
          component: 'handleDelete',
        });
        return false;
      }
    },
    [deleteMonitor],
  );

  // 处理查看详情
  const handleViewDetails = useCallback(
    (monitor: DataSource) => {
      setSelectedMonitor(monitor);
      setDetailDrawerVisible(true);
    },
    [setSelectedMonitor, setDetailDrawerVisible],
  );

  // 处理关闭详情抽屉
  const handleDetailDrawerClose = useCallback(() => {
    setDetailDrawerVisible(false);
    setSelectedMonitor(null);
  }, [setDetailDrawerVisible, setSelectedMonitor]);

  // 处理模态框取消
  const handleModalCancel = useCallback(() => {
    setModalVisible(false);
    setEditingMonitor(null);
    form.resetFields();
  }, [setModalVisible, setEditingMonitor, form]);

  // 处理向导关闭
  const handleWizardClose = useCallback(() => {
    setWizardVisible(false);
  }, [setWizardVisible]);

  return {
    handleAdd,
    handleEdit,
    handleDelete,
    handleViewDetails,
    handleDetailDrawerClose,
    handleModalCancel,
    handleWizardClose,
  };
};
