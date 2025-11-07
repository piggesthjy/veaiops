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

import { PROJECT_MANAGEMENT_CONFIG } from '@project';
import type {
  UseProjectTableConfigOptions,
  UseProjectTableConfigReturn,
} from '@project/types';
import { useBusinessTable } from '@veaiops/components';
import {
  createServerPaginationDataSource,
  createStandardTableProps,
} from '@veaiops/utils';
import type { Project } from 'api-generate';
import { useMemo } from 'react';
import { useProjectCRUD } from '../../use-project-crud';
import { useTableHandlers } from './use-table-handlers';
import { useTableRequest } from './use-table-request';

/**
 * Project 表格配置聚合 Hook
 *
 * 🎯 Hook 聚合模式 + 自动刷新机制
 * - 使用 useBusinessTable 统一管理表格逻辑
 * - 通过 operationWrapper 实现自动刷新
 * - 集中管理数据源、表格配置、列配置等
 */
export const useProjectTableConfig = ({
  onEdit,
  onDelete,
  onCreate,
  onImport,
  onToggleStatus,
}: UseProjectTableConfigOptions): UseProjectTableConfigReturn => {
  // 🎯 使用 CRUD Hook 管理业务逻辑
  const crud = useProjectCRUD();

  // 🎯 数据请求逻辑
  const { request } = useTableRequest();

  // 🎯 数据源配置 - 使用工具函数
  const dataSource = useMemo(
    () => createServerPaginationDataSource({ request }),
    [request],
  );

  // 🎯 表格配置 - 使用工具函数
  const tableProps = useMemo(
    () =>
      createStandardTableProps({
        rowKey: '_id',
        pageSize: PROJECT_MANAGEMENT_CONFIG.pageSize,
        scrollX: 1400,
      }),
    [],
  );

  // 🎯 业务操作包装 - 自动刷新
  const { customTableProps, customOperations } = useBusinessTable({
    dataSource,
    tableProps,
    refreshConfig: {
      enableRefreshFeedback: true,
      successMessage: '操作成功',
      errorMessage: '操作失败，请重试',
    },
    operationWrapper: ({ wrapUpdate, wrapDelete }) =>
      ({
        handleEdit: (editFn: () => Promise<boolean>) => async () =>
          wrapUpdate(editFn),
        handleDelete:
          (deleteFn: (id: string) => Promise<boolean>) => async (id: string) =>
            wrapDelete(() => deleteFn(id)),
        handleCreate: (createFn: () => Promise<boolean>) => async () =>
          wrapUpdate(createFn),
        handleImport: (importFn: () => Promise<boolean>) => async () =>
          wrapUpdate(importFn),
        handleToggleStatus: (toggleFn: () => Promise<boolean>) => async () =>
          wrapUpdate(toggleFn),
      }) as Record<string, (...args: unknown[]) => unknown>,
  });

  // 🎯 表格处理器配置
  const { handleColumns, handleFilters, renderActions, actions } =
    useTableHandlers({
      onEdit,
      onDelete,
      onToggleStatus,
      onCreate,
      onImport,
    });

  return {
    // 表格配置
    customTableProps,
    customOperations,
    handleColumns,
    handleFilters,
    renderActions,
    actions,

    // 业务逻辑状态
    modalVisible: crud.modalVisible,
    editingProject: crud.editingProject,
    submitting: crud.submitting,
    form: crud.form,

    // 导入相关状态
    importDrawerVisible: crud.importDrawerVisible,
    uploading: crud.uploading,

    // 新建项目相关状态
    createDrawerVisible: crud.createDrawerVisible,
    creating: crud.creating,

    // 业务逻辑处理器
    handleCancel: crud.handleCancel,
    handleSubmit: crud.handleSubmit,
    handleDelete: crud.handleDelete,
    checkDeletePermission: crud.checkDeletePermission,

    // 导入相关处理器
    handleImport: crud.handleImport,
    handleOpenImportDrawer: crud.handleOpenImportDrawer,
    handleCloseImportDrawer: crud.handleCloseImportDrawer,

    // 新建项目相关处理器
    handleCreate: crud.handleCreate,
    handleOpenCreateDrawer: crud.handleOpenCreateDrawer,
    handleCloseCreateDrawer: crud.handleCloseCreateDrawer,
  };
};
