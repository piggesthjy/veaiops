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

import { TaskOperateType } from '@/modules/threshold/features/task-config/lib';
import apiClient from '@/utils/api-client';
import { Message } from '@arco-design/web-react';
import { API_RESPONSE_CODE } from '@veaiops/constants';
import { logger } from '@veaiops/utils';
import type {
  IntelligentThresholdTask,
  IntelligentThresholdTaskVersion,
} from 'api-generate';
import { create } from 'zustand';

// API 返回的原始任务数据类型
export interface ApiTaskItem {
  _id?: string;
  id?: string;
  name?: string;
  task_name?: string;
  description?: string;
  template_id?: string;
  datasource_id?: string;
  datasource_type?: string;
  status?: string;
  config?: {
    schedule?: string;
    timeout?: number;
    retry_count?: number;
  };
  last_execution_time?: string;
  next_execution_time?: string;
  created_at?: string;
  updated_at?: string;
  created_user?: string;
  create_user?: string;
  auto_update?: boolean;
  projects?: string[];
  products?: string[];
  customers?: string[];
  product_id?: string;
  account_id?: string;
  latest_version?: IntelligentThresholdTaskVersion;
  is_active?: boolean;
}

export interface TaskListParams {
  account_ids?: string[];
  product_ids?: number[];
  task_ids?: string[];
  statuses?: Array<
    'launching' | 'running' | 'completed' | 'failed' | 'cancelled'
  >;
  datasource_type?: 'Zabbix' | 'Aliyun' | 'Volcengine';
  page_req: {
    page: number;
    page_size: number;
  };
  sort_columns?: Array<{
    field: string;
    order: 'asc' | 'desc';
  }>;
}

export interface DrawerState {
  visible: boolean;
  type?: TaskOperateType;
  record?: IntelligentThresholdTask;
}

export interface PaginationState {
  page: number;
  pageSize: number;
}

// Store 状态接口
interface TaskConfigState {
  // 任务列表状态
  loading: boolean;
  taskList: IntelligentThresholdTask[];
  total: number;
  pagination: PaginationState;

  // 抽屉状态
  taskDrawer: DrawerState;
  alarmDrawer: DrawerState;

  // 选中状态
  selectedTasks: string[];

  // 筛选器状态
  filterDatasourceType?: string;

  // Actions
  setLoading: (loading: boolean) => void;
  setTaskList: (tasks: IntelligentThresholdTask[]) => void;
  setTotal: (total: number) => void;
  setPagination: (pagination: PaginationState) => void;
  setSelectedTasks: (tasks: string[]) => void;
  setFilterDatasourceType: (datasourceType?: string) => void;

  // 抽屉操作
  openTaskDrawer: (params: {
    type: TaskOperateType;
    record?: IntelligentThresholdTask;
  }) => void;
  closeTaskDrawer: () => void;
  openAlarmDrawer: (record: IntelligentThresholdTask) => void;
  closeAlarmDrawer: () => void;

  // 业务操作
  loadTasks: (params?: Partial<TaskListParams>) => Promise<{
    data: IntelligentThresholdTask[];
    total: number;
    skip: number;
    limit: number;
  }>;
  batchRerunTasks: (taskIds: string[]) => Promise<boolean>;
  updatePagination: (params: { page: number; pageSize: number }) => void;

  // 任务操作处理器
  handleCreateTask: () => void;
  handleRerunTask: (record: IntelligentThresholdTask) => void;
  handleViewTaskDetails: (record: IntelligentThresholdTask) => void;
  handleCreateAlarmRules: (record: IntelligentThresholdTask) => void;
  handleViewAlarmRules: (record: IntelligentThresholdTask) => void;
  handleCopyTask: (record: IntelligentThresholdTask) => void;
  handleBatchRerun: () => Promise<boolean>;
}

// 创建 Zustand store
export const useTaskConfigStore = create<TaskConfigState>((set, get) => ({
  // 初始状态
  loading: false,
  taskList: [],
  total: 0,
  pagination: {
    page: 1,
    pageSize: 20,
  },
  taskDrawer: {
    visible: false,
  },
  alarmDrawer: {
    visible: false,
  },
  selectedTasks: [],
  filterDatasourceType: undefined,

  // 基础状态设置
  setLoading: (loading: boolean) => set({ loading }),
  setTaskList: (tasks: IntelligentThresholdTask[]) => set({ taskList: tasks }),
  setTotal: (total: number) => set({ total }),
  setPagination: (pagination: PaginationState) => set({ pagination }),
  setSelectedTasks: (tasks: string[]) => set({ selectedTasks: tasks }),
  setFilterDatasourceType: (datasourceType?: string) =>
    set({ filterDatasourceType: datasourceType }),

  /**
   * openTaskDrawer 参数接口
   */
  openTaskDrawer: ({
    type,
    record,
  }: {
    type: TaskOperateType;
    record?: IntelligentThresholdTask;
  }) => {
    set({
      taskDrawer: {
        visible: true,
        type,
        record,
      },
    });

    // 如果是查看任务详情，将 taskName 添加到 URL 参数
    if (type === 'detail' && record && record.task_name) {
      const newParams = new URLSearchParams(window.location.search);
      newParams.set('taskName', record.task_name);
      const newUrl = `${window.location.pathname}?${newParams.toString()}`;
      window.history.pushState({}, '', newUrl);
    }
  },

  closeTaskDrawer: () => {
    set({
      taskDrawer: {
        visible: false,
        type: undefined,
        record: undefined,
      },
    });

    // 关闭抽屉时清空 URL 中的 taskName 参数
    const newParams = new URLSearchParams(window.location.search);
    newParams.delete('taskName');
    const newUrl = newParams.toString()
      ? `${window.location.pathname}?${newParams.toString()}`
      : window.location.pathname;
    window.history.pushState({}, '', newUrl);
  },

  openAlarmDrawer: (record: IntelligentThresholdTask) =>
    set({
      alarmDrawer: {
        visible: true,
        record,
      },
    }),

  closeAlarmDrawer: () =>
    set({
      alarmDrawer: {
        visible: false,
        record: undefined,
      },
    }),

  // 业务操作
  loadTasks: async (params?: Partial<TaskListParams>) => {
    const { pagination } = get();
    set({ loading: true });

    try {
      const skip = (pagination.page - 1) * pagination.pageSize;
      const limit = pagination.pageSize;

      const response =
        await apiClient.intelligentThresholdTask.getApisV1IntelligentThresholdTask(
          {
            datasourceType: 'Volcengine',
            projects: params?.account_ids,
            taskName: undefined,
            autoUpdate: undefined,
            skip,
            limit,
          },
        );

      if (response.code === API_RESPONSE_CODE.SUCCESS && response.data) {
        set({
          taskList: response.data,
          total: response.total || response.data.length,
          loading: false,
        });

        return {
          data: response.data,
          total: response.total || response.data.length,
          skip: response.skip || skip,
          limit: response.limit || limit,
        };
      } else {
        set({
          taskList: [],
          total: 0,
          loading: false,
        });

        return {
          data: [],
          total: 0,
          skip,
          limit,
        };
      }
    } catch (error) {
      // ✅ 正确：透出实际的错误信息
      set({ loading: false });
      const errorMessage =
        error instanceof Error ? error.message : '加载任务列表失败，请重试';
      Message.error(`加载任务列表失败：${errorMessage}`);
      // ✅ 正确：将错误转换为 Error 对象再抛出（符合 @typescript-eslint/only-throw-error 规则）
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      throw errorObj;
    }
  },

  batchRerunTasks: async (taskIds: string[]): Promise<boolean> => {
    try {
      set({ loading: true });

      // 模拟批量操作
      await new Promise((resolve) => setTimeout(resolve, 1000));

      Message.success(`批量重新执行 ${taskIds.length} 个任务成功`);

      // 刷新列表
      await get().loadTasks();
      return true;
    } catch (error: unknown) {
      // ✅ 正确：透出实际的错误信息
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      const errorMessage = errorObj.message || '批量重新执行失败，请重试';
      Message.error(`批量重新执行失败：${errorMessage}`);
      logger.error({
        message: '批量重新执行任务失败',
        data: {
          error: errorMessage,
          stack: errorObj.stack,
          errorObj,
          taskIds,
        },
        source: 'TaskConfigStore',
        component: 'batchRerunTasks',
      });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  updatePagination: ({
    page,
    pageSize,
  }: { page: number; pageSize: number }) => {
    set({ pagination: { page, pageSize } });
  },

  // 任务操作处理器
  handleCreateTask: () => {
    get().openTaskDrawer({ type: TaskOperateType.CREATE });
  },

  handleRerunTask: (record: IntelligentThresholdTask) => {
    get().openTaskDrawer({ type: TaskOperateType.RERUN, record });
  },

  handleViewTaskDetails: (record: IntelligentThresholdTask) => {
    get().openTaskDrawer({ type: TaskOperateType.DETAIL, record });
  },

  handleCreateAlarmRules: (record: IntelligentThresholdTask) => {
    get().openAlarmDrawer(record);
  },

  handleViewAlarmRules: (record: IntelligentThresholdTask) => {
    const taskId = record._id;
    if (taskId) {
      window.open(`/alarm-rules?taskId=${taskId}`);
    }
  },

  handleCopyTask: (record: IntelligentThresholdTask) => {
    const originalTaskName = record.task_name;
    const copyRecord = {
      ...record,
      _id: undefined,
      task_name: originalTaskName
        ? `${originalTaskName}_副本`
        : '新建任务_副本',
    };
    get().openTaskDrawer({ type: TaskOperateType.COPY, record: copyRecord });
  },

  handleBatchRerun: async (): Promise<boolean> => {
    const { selectedTasks } = get();
    if (selectedTasks.length === 0) {
      Message.warning('请选择要重新执行的任务');
      return false;
    }
    const success = await get().batchRerunTasks(selectedTasks);
    if (success) {
      set({ selectedTasks: [] });
    }
    return success;
  },
}));
