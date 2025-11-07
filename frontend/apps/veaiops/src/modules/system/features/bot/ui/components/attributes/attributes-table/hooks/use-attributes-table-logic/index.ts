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

import { logger } from '@veaiops/utils';
import type { ChannelType } from 'api-generate';
import type React from 'react';
import { useCallback } from 'react';
import { useAttributesTableLogicHandlers } from './handlers';
import { useAttributesTableLogicState } from './state';

/**
 * Bot属性表格业务逻辑Hook参数
 */
interface UseAttributesTableLogicParams {
  botId?: string;
  channel?: string | ChannelType;
  tableRef?: React.RefObject<{
    refresh?: () => Promise<void>;
  }>;
}

/**
 * Bot属性表格业务逻辑Hook返回值
 */
export interface UseAttributesTableLogicReturn {
  // 状态
  editingAttribute: ReturnType<
    typeof useAttributesTableLogicState
  >['editingAttribute'];
  isModalVisible: ReturnType<
    typeof useAttributesTableLogicState
  >['isModalVisible'];
  modalType: ReturnType<typeof useAttributesTableLogicState>['modalType'];
  loading: ReturnType<typeof useAttributesTableLogicState>['loading'];

  // 业务逻辑
  createAttribute: ReturnType<
    typeof useAttributesTableLogicState
  >['createAttribute'];
  updateAttribute: ReturnType<
    typeof useAttributesTableLogicState
  >['updateAttribute'];
  deleteAttribute: ReturnType<
    typeof useAttributesTableLogicState
  >['deleteAttribute'];

  // 事件处理
  handleOpenCreateModal: ReturnType<
    typeof useAttributesTableLogicHandlers
  >['handleOpenCreateModal'];
  handleCloseModal: ReturnType<
    typeof useAttributesTableLogicHandlers
  >['handleCloseModal'];
  handleFormSubmit: ReturnType<
    typeof useAttributesTableLogicHandlers
  >['handleFormSubmit'];
  handleDelete: ReturnType<
    typeof useAttributesTableLogicHandlers
  >['handleDelete'];
  handleEdit: ReturnType<typeof useAttributesTableLogicHandlers>['handleEdit'];
  stableFetchAttributes: ReturnType<
    typeof useAttributesTableLogicState
  >['stableFetchAttributes'];
}

/**
 * Bot属性表格业务逻辑Hook
 *
 * 拆分说明：
 * - state.ts: 状态管理和业务逻辑Hook调用
 * - handlers.ts: 事件处理函数（handleOpenCreateModal、handleCloseModal、handleFormSubmit、handleDelete、handleEdit）
 * - index.ts: 主入口，组合所有逻辑
 */
export const useAttributesTableLogic = ({
  botId,
  channel,
  tableRef,
}: UseAttributesTableLogicParams): UseAttributesTableLogicReturn => {
  // 状态管理
  const state = useAttributesTableLogicState({ botId, channel });

  // 刷新表格的辅助函数
  const refreshTable = useCallback(async () => {
    logger.info({
      message: '[refreshTable] 🔄 refreshTable 被调用',
      data: {
        hasTableRef: Boolean(tableRef),
        hasTableRefCurrent: Boolean(tableRef?.current),
        hasRefreshMethod: Boolean(tableRef?.current?.refresh),
      },
      source: 'BotAttributesTable',
      component: 'refreshTable',
    });

    if (tableRef?.current?.refresh) {
      logger.info({
        message: '[refreshTable] ✅ 准备调用 tableRef.current.refresh()',
        data: {},
        source: 'BotAttributesTable',
        component: 'refreshTable',
      });
      await tableRef.current.refresh();
      logger.info({
        message: '[refreshTable] ✅ tableRef.current.refresh() 完成',
        data: {},
        source: 'BotAttributesTable',
        component: 'refreshTable',
      });
    } else {
      logger.warn({
        message: '[refreshTable] ⚠️ tableRef.current.refresh 不存在',
        data: {
          tableRefKeys: tableRef?.current ? Object.keys(tableRef.current) : [],
        },
        source: 'BotAttributesTable',
        component: 'refreshTable',
      });
    }
  }, [tableRef]);

  // 事件处理
  const handlers = useAttributesTableLogicHandlers({
    editingAttribute: state.editingAttribute,
    setEditingAttribute: state.setEditingAttribute,
    isModalVisible: state.isModalVisible,
    setIsModalVisible: state.setIsModalVisible,
    modalType: state.modalType,
    setModalType: state.setModalType,
    createAttribute: state.createAttribute,
    updateAttribute: state.updateAttribute,
    deleteAttribute: state.deleteAttribute,
    refreshTable,
  });

  return {
    // 状态
    editingAttribute: state.editingAttribute,
    isModalVisible: state.isModalVisible,
    modalType: state.modalType,
    loading: state.loading,

    // 业务逻辑
    createAttribute: state.createAttribute,
    updateAttribute: state.updateAttribute,
    deleteAttribute: state.deleteAttribute,

    // 事件处理
    handleOpenCreateModal: handlers.handleOpenCreateModal,
    handleCloseModal: handlers.handleCloseModal,
    handleFormSubmit: handlers.handleFormSubmit,
    handleDelete: handlers.handleDelete,
    handleEdit: handlers.handleEdit,
    stableFetchAttributes: state.stableFetchAttributes,
  };
};
