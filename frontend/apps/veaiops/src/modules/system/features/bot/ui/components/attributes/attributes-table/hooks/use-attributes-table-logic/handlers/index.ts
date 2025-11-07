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

import type { BotAttribute } from 'api-generate';
import { useAttributesTableActionHandlers } from './action-handlers';
import { useAttributesTableFormHandlers } from './form-handlers';
import { useAttributesTableModalHandlers } from './modal-handlers';

/**
 * Bot属性表格事件处理Hook统一导出
 *
 * 拆分说明：
 * - modal-handlers.ts: 模态框相关处理（handleOpenCreateModal、handleCloseModal）
 * - form-handlers.ts: 表单提交处理（handleFormSubmit）
 * - action-handlers.ts: 操作处理（handleDelete、handleEdit）
 * - index.ts: 统一导出，组合所有处理函数
 */
export const useAttributesTableLogicHandlers = ({
  editingAttribute,
  setEditingAttribute,
  isModalVisible,
  setIsModalVisible,
  modalType,
  setModalType,
  createAttribute,
  updateAttribute,
  deleteAttribute,
  refreshTable,
}: {
  editingAttribute: BotAttribute | null;
  setEditingAttribute: (attribute: BotAttribute | null) => void;
  isModalVisible: boolean;
  setIsModalVisible: (visible: boolean) => void;
  modalType: 'create' | 'edit';
  setModalType: (type: 'create' | 'edit') => void;
  createAttribute: (params: {
    name: string;
    values: string[];
  }) => Promise<boolean>;
  updateAttribute: (params: { id: string; value: string }) => Promise<boolean>;
  deleteAttribute: (attribute: BotAttribute) => Promise<boolean>;
  refreshTable: () => Promise<void>;
}) => {
  // 模态框处理
  const modalHandlers = useAttributesTableModalHandlers({
    setEditingAttribute,
    setIsModalVisible,
    setModalType,
  });

  // 表单处理
  const formHandlers = useAttributesTableFormHandlers({
    modalType,
    editingAttribute,
    createAttribute,
    updateAttribute,
    handleCloseModal: modalHandlers.handleCloseModal,
    refreshTable,
  });

  // 操作处理
  const actionHandlers = useAttributesTableActionHandlers({
    deleteAttribute,
    setEditingAttribute,
    setModalType,
    setIsModalVisible,
    refreshTable,
  });

  return {
    handleOpenCreateModal: modalHandlers.handleOpenCreateModal,
    handleCloseModal: modalHandlers.handleCloseModal,
    handleFormSubmit: formHandlers.handleFormSubmit,
    handleDelete: actionHandlers.handleDelete,
    handleEdit: actionHandlers.handleEdit,
  };
};
