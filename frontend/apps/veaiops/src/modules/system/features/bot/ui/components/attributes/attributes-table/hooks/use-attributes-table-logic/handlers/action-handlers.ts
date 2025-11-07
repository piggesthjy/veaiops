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
import type { BotAttribute } from 'api-generate';
import { useCallback } from 'react';

/**
 * Bot属性表格操作处理Hook
 */
export const useAttributesTableActionHandlers = ({
  deleteAttribute,
  setEditingAttribute,
  setModalType,
  setIsModalVisible,
  refreshTable,
}: {
  deleteAttribute: (attribute: BotAttribute) => Promise<boolean>;
  setEditingAttribute: (attribute: BotAttribute | null) => void;
  setModalType: (type: 'create' | 'edit') => void;
  setIsModalVisible: (visible: boolean) => void;
  refreshTable: () => Promise<void>;
}) => {
  /**
   * 处理删除操作
   */
  const handleDelete = useCallback(
    async (attribute: BotAttribute): Promise<void> => {
      try {
        logger.info({
          message: '[handleDelete] 🎯 开始删除特别关注',
          data: {
            attributeId: attribute._id,
            attributeName: attribute.name,
          },
          source: 'BotAttributesTable',
          component: 'handleDelete',
        });

        const success = await deleteAttribute(attribute);

        logger.info({
          message: '[handleDelete] ✅ deleteAttribute 调用完成',
          data: {
            success,
          },
          source: 'BotAttributesTable',
          component: 'handleDelete',
        });

        // ✅ 删除成功后刷新表格
        if (success) {
          logger.info({
            message: '[handleDelete] 🔄 准备调用 refreshTable',
            data: {},
            source: 'BotAttributesTable',
            component: 'handleDelete',
          });
          await refreshTable();
          logger.info({
            message: '[handleDelete] ✅ refreshTable 调用完成',
            data: {},
            source: 'BotAttributesTable',
            component: 'handleDelete',
          });
        } else {
          logger.warn({
            message: '[handleDelete] ⚠️ deleteAttribute 返回 false，不刷新表格',
            data: {},
            source: 'BotAttributesTable',
            component: 'handleDelete',
          });
        }
      } catch (error: unknown) {
        // ✅ 正确：使用 logger 记录错误，并透出实际错误信息
        const errorObj =
          error instanceof Error ? error : new Error(String(error));
        logger.error({
          message: '删除属性失败',
          data: {
            error: errorObj.message,
            stack: errorObj.stack,
            errorObj,
            attributeId: attribute._id,
          },
          source: 'BotAttributesTable',
          component: 'handleDelete',
        });
      }
    },
    [deleteAttribute, refreshTable],
  );

  /**
   * 处理编辑操作
   */
  const handleEdit = useCallback(
    async (attribute: BotAttribute): Promise<boolean> => {
      try {
        setEditingAttribute(attribute);
        setModalType('edit');
        setIsModalVisible(true);
        return true;
      } catch (error) {
        // ✅ 正确：使用 logger 记录错误，并透出实际错误信息
        const errorObj =
          error instanceof Error ? error : new Error(String(error));
        logger.error({
          message: '编辑操作失败',
          data: {
            error: errorObj.message,
            stack: errorObj.stack,
            errorObj,
          },
          source: 'BotAttributesTable',
          component: 'handleEdit',
        });
        return false;
      }
    },
    [setEditingAttribute, setModalType, setIsModalVisible],
  );

  return {
    handleDelete,
    handleEdit,
  };
};
