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

import { useManagementRefresh } from '@veaiops/hooks';
import { logger } from '@veaiops/utils';
import { useCallback } from 'react';
import { useMetricTemplateCrud } from './use-crud';
import { useMetricTemplateForm } from './use-form';

/**
 * 指标模板管理逻辑Hook
 * 组合各个子 Hook，提供完整的模板管理功能
 */
export const useMetricTemplateManagementLogic = (
  refreshTable?: () => Promise<boolean>,
) => {
  // 使用管理刷新 Hook，获取刷新回调函数
  const { afterCreate, afterUpdate, afterDelete } =
    useManagementRefresh(refreshTable);

  // 使用 CRUD 操作 Hook
  const {
    createTemplate,
    updateTemplate,
    deleteTemplate: originalDeleteTemplate,
  } = useMetricTemplateCrud();

  // 使用表单处理 Hook
  const {
    form,
    editingTemplate,
    modalVisible,
    handleEdit,
    handleAdd,
    handleCancel,
    handleSubmit,
  } = useMetricTemplateForm();

  /**
   * 处理模态框确认
   */
  const handleModalOk = useCallback(async () => {
    return handleSubmit(async (completeValues) => {
      let result;
      if (editingTemplate?._id) {
        // 更新模式
        result = await updateTemplate({
          templateId: editingTemplate._id,
          data: completeValues,
        });
        // 更新成功后刷新表格
        if (result) {
          const refreshResult = await afterUpdate();
          if (!refreshResult.success && refreshResult.error) {
            logger.warn({
              message: '更新后刷新表格失败',
              data: {
                error: refreshResult.error.message,
                stack: refreshResult.error.stack,
                errorObj: refreshResult.error,
              },
              source: 'MetricTemplateManagement',
              component: 'handleSave',
            });
          }
        }
      } else {
        // 创建模式
        result = await createTemplate(completeValues);
        // 创建成功后刷新表格
        if (result) {
          const refreshResult = await afterCreate();
          if (!refreshResult.success && refreshResult.error) {
            logger.warn({
              message: '创建后刷新表格失败',
              data: {
                error: refreshResult.error.message,
                stack: refreshResult.error.stack,
                errorObj: refreshResult.error,
              },
              source: 'MetricTemplateManagement',
              component: 'handleSave',
            });
          }
        }
      }
      return result;
    });
  }, [
    handleSubmit,
    editingTemplate,
    updateTemplate,
    createTemplate,
    afterCreate,
    afterUpdate,
  ]);

  /**
   * 包装删除方法，添加刷新逻辑
   */
  const deleteTemplate = useCallback(
    async (templateId: string): Promise<boolean> => {
      const result = await originalDeleteTemplate(templateId);
      // 删除成功后刷新表格
      if (result) {
        const refreshResult = await afterDelete();
        if (!refreshResult.success && refreshResult.error) {
          logger.warn({
            message: '删除后刷新表格失败',
            data: {
              error: refreshResult.error.message,
              stack: refreshResult.error.stack,
              errorObj: refreshResult.error,
            },
            source: 'MetricTemplateManagement',
            component: 'deleteTemplate',
          });
        }
      }
      return result;
    },
    [originalDeleteTemplate, afterDelete],
  );

  return {
    // 状态
    editingTemplate,
    modalVisible,
    form,

    // 操作方法
    createTemplate,
    updateTemplate,
    deleteTemplate,
    handleEdit,
    handleAdd,
    handleModalOk,
    handleModalCancel: handleCancel,
  };
};
