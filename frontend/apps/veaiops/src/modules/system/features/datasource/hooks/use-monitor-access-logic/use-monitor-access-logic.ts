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

import { Message } from '@arco-design/web-react';
import type {
  DataSource,
  DataSourceType,
  MonitorAccessProps,
} from '@datasource/lib';
import { detectModuleType, getSupportedModuleType } from '@datasource/lib';
import { useMonitorCrud } from './use-monitor-crud';
import { useMonitorHandlers } from './use-monitor-handlers';
import { useMonitorState } from './use-monitor-state';

/**
 * 监控数据源管理逻辑Hook
 * 提供监控数据源管理页面的所有业务逻辑
 *
 * 使用拆分后的模块：
 * - useMonitorState: 状态管理
 * - useMonitorCrud: CRUD操作
 * - useMonitorHandlers: 事件处理器
 */
export const useMonitorAccessLogic = (props: MonitorAccessProps) => {
  // 检测模块类型
  const detectedModuleType = props.moduleType || detectModuleType();
  const supportedModuleType = getSupportedModuleType(detectedModuleType);
  const pageTitle = '监控数据源管理';

  // 状态管理
  const state = useMonitorState();

  // CRUD操作
  const { createMonitor, updateMonitor, deleteMonitor } = useMonitorCrud();

  /**
   * 删除参数接口
   */
  interface HandleDeleteParams {
    id: string;
    datasourceType: DataSourceType;
  }

  // 删除监控配置
  const handleDelete = async ({
    id,
    datasourceType,
  }: HandleDeleteParams): Promise<{ success: boolean; error?: Error }> => {
    try {
      const success = await deleteMonitor(
        id,
        datasourceType || (supportedModuleType as DataSourceType),
      );
      if (success) {
        // CustomTable会自动刷新数据
        return { success: true };
      }
      return { success: false };
    } catch (error) {
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      const errorMessage = errorObj.message || '删除数据源失败，请重试';
      Message.error(errorMessage);
      return { success: false, error: errorObj };
    }
  };

  // 创建监控配置
  const handleCreate = async (
    values: Partial<DataSource>,
  ): Promise<boolean> => {
    try {
      const success = await createMonitor(values);
      if (success) {
        state.setModalVisible(false);
        state.form.resetFields();
        return true;
      }
      return false;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '创建失败，请重试';
      Message.error(errorMessage);
      return false;
    }
  };

  // 更新监控配置
  const handleUpdate = async (
    values: Partial<DataSource>,
  ): Promise<boolean> => {
    // 统一获取监控配置ID的辅助函数
    // 因为 editingMonitor 可能来自不同来源，字段名可能不一致（id vs _id）
    const getMonitorId = (monitor: DataSource | null): string | null => {
      if (!monitor) {
        return null;
      }
      // 优先使用 id 字段（前端统一格式）
      if ('id' in monitor && monitor.id && typeof monitor.id === 'string') {
        return monitor.id;
      }
      // 如果 id 不存在，尝试使用 _id（api-generate 格式）
      if ('_id' in monitor && monitor._id && typeof monitor._id === 'string') {
        return monitor._id;
      }
      return null;
    };

    const monitorId = getMonitorId(state.editingMonitor);
    if (!monitorId) {
      Message.error('监控配置 ID 不能为空');
      return false;
    }

    try {
      const success = await updateMonitor(
        monitorId,
        values,
        supportedModuleType as DataSourceType,
      );

      if (success) {
        state.setModalVisible(false);
        state.setEditingMonitor(null);
        state.form.resetFields();
        return true;
      }
      return false;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '更新失败，请重试';
      Message.error(errorMessage);
      return false;
    }
  };

  // 处理表单提交
  const handleSubmit = async (
    values: Partial<DataSource>,
  ): Promise<boolean> => {
    if (state.editingMonitor) {
      return await handleUpdate(values);
    } else {
      return await handleCreate(values);
    }
  };

  // 事件处理器
  const handlers = useMonitorHandlers({
    setEditingMonitor: state.setEditingMonitor,
    setModalVisible: state.setModalVisible,
    setWizardVisible: state.setWizardVisible,
    setDetailDrawerVisible: state.setDetailDrawerVisible,
    setSelectedMonitor: state.setSelectedMonitor,
    form: state.form,
    deleteMonitor,
  });

  return {
    // 状态
    modalVisible: state.modalVisible,
    editingMonitor: state.editingMonitor,
    form: state.form,
    pageTitle,
    supportedModuleType,

    // 事件处理器
    handleEdit: handlers.handleEdit,
    handleAdd: handlers.handleAdd,
    handleCancel: handlers.handleModalCancel,
    handleSubmit,
    handleDelete,
  };
};
