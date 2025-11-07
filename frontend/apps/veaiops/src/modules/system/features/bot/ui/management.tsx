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

import type { BotCreateRequest, BotTableRef, BotUpdateRequest } from '@bot';
import { useBot } from '@bot/hooks';
import type React from 'react';
import { useRef } from 'react';
import { BotAttributesDrawer } from './components/bot/attributes-drawer';
import { BotCompleteModal } from './components/bot/complete-modal';
import { ChatManagementDrawer } from './components/chat/management-drawer';
import { BotTable } from './table';

/**
 * Bot管理页面
 * 提供Bot的增删改查功能 - 使用 CustomTable 和 Zustand 状态管理
 *
 * 架构特点：
 * - 使用自定义Hook封装业务逻辑
 * - 组件职责单一，易于维护
 * - 状态管理与UI渲染分离
 * - 支持配置化和扩展
 * - 使用CustomTable提供高级表格功能
 */
const BotManagement: React.FC = () => {
  // BotTable ref，用于刷新表格
  const tableRef = useRef<BotTableRef>(null);

  // 使用自定义Hook获取所有业务逻辑，传递表格刷新方法
  const {
    // 状态
    modalVisible,
    editingBot,
    loading,

    // 属性管理状态
    selectedBot,
    attributesDrawerVisible,

    // 群管理状态
    chatManagementDrawerVisible,
    selectedBotForChat,

    // 事件处理器
    handleEdit,
    handleAdd,
    handleCancel,
    handleSubmit,
    handleDelete,
    handleViewAttributes,
    handleCloseAttributesDrawer,
    handleChatManagement,
    handleCloseChatManagementDrawer,
  } = useBot(tableRef);

  // 提交处理器：转发给 handleSubmit 并返回结果
  const handleCompleteSubmit = async (
    values: BotCreateRequest | BotUpdateRequest,
  ): Promise<boolean> => {
    // handleSubmit 已经接受 BotCreateRequest | BotUpdateRequest 类型，不需要类型断言
    return await handleSubmit(values);
  };

  return (
    <>
      {/* Bot表格组件 - 使用CustomTable */}
      <BotTable
        ref={tableRef}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAdd={handleAdd}
        onViewAttributes={handleViewAttributes}
        onGroupManagement={handleChatManagement}
      />

      {/* Bot弹窗组件 */}
      <BotCompleteModal
        visible={modalVisible}
        editingBot={editingBot}
        onCancel={handleCancel}
        onSubmit={handleCompleteSubmit}
        loading={loading}
      />

      {/* Bot特别关注抽屉 */}
      <BotAttributesDrawer
        visible={attributesDrawerVisible}
        onClose={handleCloseAttributesDrawer}
        bot={selectedBot}
      />

      {/* 群管理抽屉 */}
      <ChatManagementDrawer
        visible={chatManagementDrawerVisible}
        onClose={handleCloseChatManagementDrawer}
        selectedBot={selectedBotForChat || undefined}
      />
    </>
  );
};

export default BotManagement;
export { BotManagement };
