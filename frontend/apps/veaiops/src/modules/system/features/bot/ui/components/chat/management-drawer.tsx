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

import { Alert, Drawer } from '@arco-design/web-react';
import type { ChatManagementDrawerProps } from '@bot';
import { useManagementRefresh } from '@veaiops/hooks';
import { logger } from '@veaiops/utils';
import type React from 'react';
import { useRef } from 'react';
import { BotDrawerTitle } from '../bot/drawer-title';
import { ChatTable, type ChatTableRef } from './chat-table/index';

/**
 * 群管理抽屉组件
 *
 * 对应 origin/feat/web-v2 分支的实现，确保功能一致性
 */
export const ChatManagementDrawer: React.FC<ChatManagementDrawerProps> = ({
  visible,
  onClose,
  selectedBot,
}) => {
  // 表格引用，用于获取刷新函数
  const tableRef = useRef<ChatTableRef>(null);

  // 获取表格刷新函数
  const getRefreshTable = async () => {
    if (tableRef.current?.refresh) {
      const result = await tableRef.current.refresh();
      if (!result.success && result.error) {
        logger.warn({
          message: '聊天表格刷新失败',
          data: {
            error: result.error.message,
            stack: result.error.stack,
            errorObj: result.error,
          },
          source: 'ChatManagementDrawer',
          component: 'getRefreshTable',
        });
      }
    }
  };

  // 使用管理刷新 Hook，提供配置更新后刷新功能
  const { afterUpdate } = useManagementRefresh(getRefreshTable);

  return (
    <Drawer
      width={1200}
      title={
        selectedBot ? (
          <BotDrawerTitle bot={selectedBot} title="群管理" />
        ) : (
          '群管理'
        )
      }
      visible={visible}
      onCancel={onClose}
      footer={null}
      maskClosable={false}
      focusLock={false}
    >
      {/* 引导提示：需先在群聊中拉入对应机器人 */}
      <Alert
        type="warning"
        content="需要先在群聊中拉入对应机器人"
        className="mb-4"
      />
      <ChatTable ref={tableRef} uid={selectedBot?._id ?? undefined} />
    </Drawer>
  );
};
