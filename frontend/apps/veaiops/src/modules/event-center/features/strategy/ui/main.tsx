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

import { useStrategyManagementLogic } from '@ec/strategy';
import { logger } from '@veaiops/utils';
import type React from 'react';
import { useCallback, useRef } from 'react';
import { StrategyModal } from './modal';
import { StrategyTable, type StrategyTableRef } from './table';

/**
 * 策略管理页面
 * 提供策略的增删改查功能 - 使用 CustomTable 和 Zustand 状态管理
 *
 * 架构特点：
 * - 使用自定义Hook封装业务逻辑
 * - 组件职责单一，易于维护
 * - 状态管理与UI渲染分离
 * - 支持配置化和扩展
 * - 使用CustomTable提供高级表格功能
 */
const StrategyManagement: React.FC = () => {
  // 表格引用（用于获取刷新函数，用于表单提交后刷新）
  const tableRef = useRef<StrategyTableRef>(null);

  // 获取表格刷新函数（用于表单提交后刷新）
  const getRefreshTable = useCallback(async (): Promise<boolean> => {
    if (tableRef.current?.refresh) {
      const result = await tableRef.current.refresh();
      if (!result.success && result.error) {
        logger.warn({
          message: '策略表格刷新失败',
          data: {
            error: result.error.message,
            stack: result.error.stack,
            errorObj: result.error,
          },
          source: 'StrategyManagement',
          component: 'getRefreshTable',
        });
        return false;
      }
      return true;
    }
    return false;
  }, []);

  // 使用自定义Hook获取所有业务逻辑
  // 注意：删除操作的刷新已由 useBusinessTable 自动处理，getRefreshTable 仅用于表单提交后刷新
  const {
    // 状态
    modalVisible,
    editingStrategy,
    form,

    // 事件处理器
    handleEdit,
    handleAdd,
    handleCancel,
    handleSubmit,
    handleDelete,
  } = useStrategyManagementLogic({ refreshTable: getRefreshTable });

  return (
    <>
      {/* 策略表格组件 - 使用CustomTable */}
      {/* 注意：删除操作的刷新已由 useBusinessTable 自动处理，refreshTable 仅用于表单提交后刷新 */}
      <StrategyTable
        ref={tableRef}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAdd={handleAdd}
      />

      {/* 策略弹窗组件 */}
      <StrategyModal
        visible={modalVisible}
        editingStrategy={editingStrategy}
        onCancel={handleCancel}
        onSubmit={handleSubmit}
        form={form}
      />
    </>
  );
};

export default StrategyManagement;
