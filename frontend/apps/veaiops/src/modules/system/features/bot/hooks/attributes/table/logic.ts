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

import type { BotAttributeFiltersQuery } from '@bot/lib';
import type { BotAttributeFormData, ModalType } from '@bot/types';
import type { CustomTableActionType } from '@veaiops/components';
import type { AttributeKey, BotAttribute } from 'api-generate';
import type React from 'react';
import { useBotAttributesBusinessLogic } from './logic/business';
import {
  useBotAttributesTableHandlers,
  useBotAttributesTableState,
} from './logic/index';
import { useRefreshAttributesTable } from './logic/refresh';

/**
 * Bot 属性表格业务逻辑 Hook 参数
 */
export interface UseBotAttributesTableLogicParams {
  botId?: string;
  channel?: string;
}

/**
 * Bot 属性表格业务逻辑 Hook 返回值
 */
export interface UseBotAttributesTableLogicReturn {
  // 状态
  editingAttribute: BotAttribute | null;
  isModalVisible: boolean;
  modalType: ModalType;
  viewModalVisible: boolean;
  viewingAttribute: BotAttribute | null;
  loading: boolean;

  // 业务逻辑
  createAttribute: (params: {
    name: AttributeKey;
    values: string[];
  }) => Promise<boolean>;
  updateAttribute: (params: { id: string; value: string }) => Promise<boolean>;
  deleteAttribute: (attribute: BotAttribute) => Promise<boolean>;

  // 事件处理
  handleOpenCreateModal: () => void;
  handleCloseModal: () => void;
  handleFormSubmit: (values: BotAttributeFormData) => Promise<boolean>; // 返回成功状态，用于刷新表格
  handleDelete: (
    attribute: BotAttribute,
    tableRef: React.RefObject<
      CustomTableActionType<BotAttribute, BotAttributeFiltersQuery>
    > | null,
  ) => Promise<boolean>;
  handleCloseViewModal: () => void;
  refreshTable: (
    tableRef: React.RefObject<
      CustomTableActionType<BotAttribute, BotAttributeFiltersQuery>
    > | null,
  ) => Promise<boolean>;
}

/**
 * Bot 属性表格业务逻辑 Hook
 * 管理模态框状态、事件处理和业务操作
 *
 * 拆分说明：
 * - logic/state.ts: 状态管理（editingAttribute、isModalVisible、modalType等）
 * - logic/business.ts: 业务逻辑Hook调用（useBotAttributes）
 * - logic/refresh.ts: 刷新表格辅助函数
 * - logic/handlers.ts: 事件处理器（handleOpenCreateModal、handleFormSubmit、handleDelete等）
 * - logic.ts: 主入口，负责组装和导出
 */
export const useBotAttributesTableLogic = ({
  botId,
  channel,
}: UseBotAttributesTableLogicParams): UseBotAttributesTableLogicReturn => {
  // 状态管理
  const state = useBotAttributesTableState();

  // 业务逻辑 Hook
  const businessLogic = useBotAttributesBusinessLogic({ botId, channel });

  // 刷新表格辅助函数
  const { refreshTable } = useRefreshAttributesTable();

  // 事件处理器
  const handlers = useBotAttributesTableHandlers({
    modalType: state.modalType,
    editingAttribute: state.editingAttribute,
    setIsModalVisible: state.setIsModalVisible,
    setEditingAttribute: state.setEditingAttribute,
    setModalType: state.setModalType,
    setViewModalVisible: state.setViewModalVisible,
    setViewingAttribute: state.setViewingAttribute,
    createAttribute: businessLogic.createAttribute,
    updateAttribute: businessLogic.updateAttribute,
    deleteAttribute: businessLogic.deleteAttribute,
    refreshTable,
  });

  return {
    // 状态
    editingAttribute: state.editingAttribute,
    isModalVisible: state.isModalVisible,
    modalType: state.modalType,
    viewModalVisible: state.viewModalVisible,
    viewingAttribute: state.viewingAttribute,
    loading: businessLogic.loading,

    // 业务逻辑
    createAttribute: businessLogic.createAttribute,
    updateAttribute: businessLogic.updateAttribute,
    deleteAttribute: businessLogic.deleteAttribute,

    // 事件处理
    handleOpenCreateModal: handlers.handleOpenCreateModal,
    handleCloseModal: handlers.handleCloseModal,
    handleFormSubmit: handlers.handleFormSubmit,
    handleDelete: handlers.handleDelete,
    handleCloseViewModal: handlers.handleCloseViewModal,
    refreshTable,
  };
};
