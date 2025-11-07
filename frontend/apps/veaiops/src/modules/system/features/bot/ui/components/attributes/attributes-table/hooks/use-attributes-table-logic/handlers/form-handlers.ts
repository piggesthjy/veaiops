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

import type { BotAttributeFormData } from '@bot/types';
import type { BotAttribute } from 'api-generate';
import { useCallback } from 'react';

/**
 * Bot属性表格表单处理Hook
 */
export const useAttributesTableFormHandlers = ({
  modalType,
  editingAttribute,
  createAttribute,
  updateAttribute,
  handleCloseModal,
  refreshTable,
}: {
  modalType: 'create' | 'edit';
  editingAttribute: BotAttribute | null;
  createAttribute: (params: {
    name: string;
    values: string[];
  }) => Promise<boolean>;
  updateAttribute: (params: { id: string; value: string }) => Promise<boolean>;
  handleCloseModal: () => void;
  refreshTable: () => Promise<void>;
}) => {
  /**
   * 处理表单提交
   *
   * @returns Promise<boolean> - 返回操作是否成功，用于调用方判断是否需要刷新表格
   */
  const handleFormSubmit = useCallback(
    async (values: BotAttributeFormData): Promise<boolean> => {
      let success = false;

      if (modalType === 'create' && values.value) {
        // 处理多选和单选的情况
        const valuesArray = Array.isArray(values.value)
          ? values.value
          : [values.value];
        success = await createAttribute({
          name: values.name,
          values: valuesArray,
        });
        // ✅ 创建成功后刷新表格
        if (success) {
          await refreshTable();
        }
      } else if (
        modalType === 'edit' &&
        editingAttribute?._id &&
        values.value &&
        typeof values.value === 'string' // 编辑时只支持单个值
      ) {
        success = await updateAttribute({
          id: editingAttribute._id,
          value: values.value,
        });
        // ✅ 更新成功后刷新表格
        if (success) {
          await refreshTable();
        }
      }

      if (success) {
        handleCloseModal();
      }

      return success;
    },
    [
      modalType,
      editingAttribute,
      createAttribute,
      updateAttribute,
      handleCloseModal,
      refreshTable,
    ],
  );

  return {
    handleFormSubmit,
  };
};
