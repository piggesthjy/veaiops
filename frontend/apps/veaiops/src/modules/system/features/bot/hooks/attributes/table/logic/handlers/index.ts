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
import type { BotAttribute } from 'api-generate';
import type React from 'react';
import { useBotAttributesTableDeleteHandler } from './delete-handler';
import { useBotAttributesTableFormHandlers } from './form-handlers';
import { useBotAttributesTableModalHandlers } from './modal-handlers';

/**
 * 事件处理器参数
 */
interface HandlersParams {
  modalType: ModalType;
  editingAttribute: BotAttribute | null;
  setIsModalVisible: (visible: boolean) => void;
  setEditingAttribute: (attribute: BotAttribute | null) => void;
  setModalType: (type: ModalType) => void;
  setViewModalVisible: (visible: boolean) => void;
  setViewingAttribute: (attribute: BotAttribute | null) => void;
  createAttribute: (params: {
    name: string;
    values: string[];
  }) => Promise<boolean>;
  updateAttribute: (params: { id: string; value: string }) => Promise<boolean>;
  deleteAttribute: (attribute: BotAttribute) => Promise<boolean>;
  refreshTable: (
    tableRef: React.RefObject<
      CustomTableActionType<BotAttribute, BotAttributeFiltersQuery>
    > | null,
  ) => Promise<boolean>;
}

/**
 * 事件处理器Hook
 *
 * 拆分说明：
 * - modal-handlers.ts: 模态框相关处理（handleOpenCreateModal、handleCloseModal、handleCloseViewModal）
 * - form-handlers.ts: 表单提交处理（handleFormSubmit）
 * - delete-handler.ts: 删除操作处理（handleDelete）
 * - index.ts: 统一导出，组合所有处理函数
 */
export const useBotAttributesTableHandlers = ({
  modalType,
  editingAttribute,
  setIsModalVisible,
  setEditingAttribute,
  setModalType,
  setViewModalVisible,
  setViewingAttribute,
  createAttribute,
  updateAttribute,
  deleteAttribute,
  refreshTable,
}: HandlersParams) => {
  // 模态框处理
  const modalHandlers = useBotAttributesTableModalHandlers({
    setEditingAttribute,
    setIsModalVisible,
    setModalType,
    setViewModalVisible,
    setViewingAttribute,
  });

  // 表单处理
  const formHandlers = useBotAttributesTableFormHandlers({
    modalType,
    editingAttribute,
    createAttribute,
    updateAttribute,
    handleCloseModal: modalHandlers.handleCloseModal,
  });

  // 删除处理
  const deleteHandler = useBotAttributesTableDeleteHandler({
    deleteAttribute,
    refreshTable,
  });

  return {
    handleOpenCreateModal: modalHandlers.handleOpenCreateModal,
    handleCloseModal: modalHandlers.handleCloseModal,
    handleFormSubmit: formHandlers.handleFormSubmit,
    handleDelete: deleteHandler.handleDelete,
    handleCloseViewModal: modalHandlers.handleCloseViewModal,
  };
};
