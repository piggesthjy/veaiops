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

import { Alert, Button } from '@arco-design/web-react';
import type { TableProps } from '@arco-design/web-react/es/Table';
import { IconPlus } from '@arco-design/web-react/icon';
import {
  type BotAttributeFiltersQuery,
  getBotAttributeFilters,
  getBotAttributesColumns,
} from '@bot/lib';
import type { BotAttributesTableProps } from '@bot/types';
import { CustomTable, type CustomTableActionType } from '@veaiops/components';
import type { BotAttribute } from 'api-generate';
import type React from 'react';
import { useRef } from 'react';
import { BotAttributeFormModal } from '../../bot/attribute-form-modal';
import { useAttributesTableLogic } from './hooks';

/**
 * Bot属性表格组件
 * 提供Bot属性的CRUD功能
 *
 * 拆分说明：
 * - hooks/use-attributes-table-logic.ts: 业务逻辑Hook（状态管理、事件处理）
 * - index.tsx: 主入口组件，负责UI渲染
 */
export const BotAttributesTable: React.FC<BotAttributesTableProps> = ({
  botId,
  channel,
}) => {
  // 创建 tableRef 用于刷新表格
  const tableRef =
    useRef<CustomTableActionType<BotAttribute, BotAttributeFiltersQuery>>(null);

  const {
    editingAttribute,
    isModalVisible,
    modalType,
    loading,
    handleOpenCreateModal,
    handleCloseModal,
    handleFormSubmit,
    handleDelete,
    handleEdit,
    stableFetchAttributes,
  } = useAttributesTableLogic({ botId, channel, tableRef });

  // 表格列配置
  const columns = getBotAttributesColumns({
    onDelete: handleDelete,
  });

  return (
    <div className="bot-attributes-table">
      {/* 功能说明提示 */}
      <Alert
        type="info"
        content="为机器人添加关注项目，以便在事件中心订阅和管理相关事件。选择要关注的项目后，系统将自动为该机器人启用对应项目的事件推送和ChatOps功能。"
        closable
        style={{ marginBottom: 16 }}
      />

      <CustomTable<BotAttribute, BotAttributeFiltersQuery>
        ref={tableRef}
        actions={[
          <Button
            key="create"
            type="primary"
            icon={<IconPlus />}
            onClick={handleOpenCreateModal}
          >
            新增关注
          </Button>,
        ]}
        actionClassName="ml-auto"
        handleColumns={() => columns}
        handleFilters={getBotAttributeFilters}
        dataSource={{
          request: stableFetchAttributes,
          ready: true,
          responseItemsKey: 'data',
        }}
        tableProps={(ctx): TableProps<BotAttribute> => ({
          loading: ctx.loading,
          rowKey: (record: BotAttribute) => record._id || '',
          pagination: false,
          scroll: { x: 1200 },
        })}
      />

      {/* 创建/编辑模态框 */}
      <BotAttributeFormModal
        visible={isModalVisible}
        type={modalType}
        attribute={editingAttribute || undefined}
        loading={loading}
        onSubmit={handleFormSubmit}
        onCancel={handleCloseModal}
      />
    </div>
  );
};

export default BotAttributesTable;
