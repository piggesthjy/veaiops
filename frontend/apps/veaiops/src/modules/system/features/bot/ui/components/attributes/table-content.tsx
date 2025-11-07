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

import { Button } from '@arco-design/web-react';
import { IconPlus } from '@arco-design/web-react/icon';
import { useBotAttributesTable } from '@bot/hooks';
import type { BotAttributeFiltersQuery } from '@bot/types';
import { CustomTable } from '@veaiops/components';
import type { BotAttribute } from 'api-generate';
import type React from 'react';
import { BotAttributeFormModal } from '../bot/attribute-form-modal';
import { AttributeDetailModal } from './detail-modal';

/**
 * 属性表格内容组件 Props
 */
export interface AttributesTableContentProps {
  botId?: string;
  channel?: string;
}

/**
 * 属性表格内容组件
 *
 * 架构说明：
 * - 内部使用 useBotAttributesTable Hook 聚合所有表格相关功能（业务逻辑、配置、状态管理）
 * - 完全自包含表格相关的所有 UI 和逻辑：CustomTable、模态框、状态管理
 * - 符合 Feature-Based 架构的内聚原则：表格相关的所有内容都在此组件中
 * - 主组件只需传递必要的 props（botId、channel），无需管理内部状态
 */
export const AttributesTableContent: React.FC<AttributesTableContentProps> = ({
  botId,
  channel,
}) => {
  // 🎯 表格相关功能完全聚合（业务逻辑、配置、事件处理、状态管理）
  // 所有 table 相关逻辑都内聚在此组件内
  const table = useBotAttributesTable({ botId, channel });

  return (
    <>
      {/* 🎯 CustomTable：表格主体 */}
      <CustomTable<BotAttribute, BotAttributeFiltersQuery>
        ref={table.tableRef}
        actions={[
          <Button
            key="create"
            type="primary"
            icon={<IconPlus />}
            onClick={table.logic.handleOpenCreateModal}
          >
            新增关注
          </Button>,
        ]}
        actionClassName="ml-auto"
        handleColumns={table.handleColumns}
        handleFilters={table.handleFilters}
        initQuery={table.initQuery}
        dataSource={table.dataSource}
        tableProps={table.tableProps}
      />

      {/* 🎯 创建/编辑模态框（内聚在表格组件中） */}
      <BotAttributeFormModal
        visible={table.logic.isModalVisible}
        type={table.logic.modalType}
        attribute={table.logic.editingAttribute || undefined}
        loading={table.logic.loading}
        onSubmit={table.handleFormSubmit}
        onCancel={table.logic.handleCloseModal}
      />

      {/* 🎯 查看详情弹窗（内聚在表格组件中） */}
      <AttributeDetailModal
        visible={table.logic.viewModalVisible}
        attribute={table.logic.viewingAttribute || undefined}
        onCancel={table.logic.handleCloseViewModal}
      />
    </>
  );
};
