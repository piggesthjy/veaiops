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

import apiClient from '@/utils/api-client';
import { Message } from '@arco-design/web-react';
import { CHAT_TABLE_QUERY_FORMAT } from '@bot/lib';
import { CustomTable, type CustomTableActionType } from '@veaiops/components';
import { API_RESPONSE_CODE } from '@veaiops/constants';
import { logger } from '@veaiops/utils';
import type { Chat } from 'api-generate';
import { forwardRef, useCallback, useMemo, useRef } from 'react';
import { useChatTableConfigWrapper } from './config';
import { useChatTableHandlers } from './handlers';
import { type ChatTableRef, useChatTableRefHandler } from './ref-handlers';

interface ChatTableProps {
  uid?: string;
}

export type { ChatTableRef };

/**
 * 群管理表格组件
 *
 * 拆分说明：
 * - chat-table/ref-handlers.ts: Ref 处理（useImperativeHandle）
 * - chat-table/config.ts: 配置获取（useChatTableConfig调用和日志记录）
 * - chat-table/handlers.ts: handleColumns 和 handleFilters 处理函数
 * - chat-table/chat-table.tsx: 主组件，负责组装和渲染
 */
export const ChatTable = forwardRef<ChatTableRef, ChatTableProps>(
  ({ uid }, ref) => {
    // ✅ 添加组件渲染开始日志
    logger.info({
      message: '[ChatTable] 组件开始渲染',
      data: {
        uid,
        uidType: typeof uid,
      },
      source: 'ChatTable',
      component: 'ChatTable',
    });

    // CustomTable ref用于调用refresh方法
    const tableRef = useRef<CustomTableActionType<Chat>>(null);

    // Ref 处理
    useChatTableRefHandler({ ref, tableRef });

    // 更新单个配置字段的函数
    const handleUpdateConfig = useCallback(
      async (params: {
        chatId: string;
        field: 'enable_func_interest' | 'enable_func_proactive_reply';
        value: boolean;
        currentRecord: Chat;
      }): Promise<boolean> => {
        try {
          // 构建更新配置，保持其他字段不变
          const config = {
            enable_func_proactive_reply:
              params.field === 'enable_func_proactive_reply'
                ? params.value
                : (params.currentRecord.enable_func_proactive_reply ?? false),
            enable_func_interest:
              params.field === 'enable_func_interest'
                ? params.value
                : (params.currentRecord.enable_func_interest ?? false),
          };

          // 调用 API 更新配置
          const response = await apiClient.chats.putApisV1ConfigChatsConfig({
            uid: params.chatId,
            requestBody: config,
          });

          if (response.code === API_RESPONSE_CODE.SUCCESS) {
            Message.success('配置更新成功');
            // 刷新表格
            if (tableRef.current?.refresh) {
              await tableRef.current.refresh();
            }
            return true;
          } else {
            throw new Error(response.message || '更新配置失败');
          }
        } catch (error: unknown) {
          const errorObj =
            error instanceof Error ? error : new Error(String(error));
          const errorMessage = errorObj.message || '更新配置失败，请重试';
          Message.error(errorMessage);

          logger.error({
            message: '更新配置失败',
            data: {
              error: errorMessage,
              stack: errorObj.stack,
              errorObj,
              params,
            },
            source: 'ChatTable',
            component: 'handleUpdateConfig',
          });
          return false;
        }
      },
      [],
    );

    // 表格配置
    const { customTableProps } = useChatTableConfigWrapper({
      tableRef,
    });

    // 处理函数
    const { handleColumns, handleFilters } = useChatTableHandlers({
      onUpdateConfig: handleUpdateConfig,
    });

    // ✅ 使用 useMemo 稳定化 initQuery 对象，避免每次渲染创建新引用
    // ✅ 默认查询 is_active=true 的群聊（已经"删除"的不再默认展示）
    const initQuery = useMemo(
      () => ({
        force_refresh: false,
        uid,
        is_active: true, // 默认只显示已入群的群聊
      }),
      [uid],
    );

    // ✅ 添加渲染前日志
    logger.info({
      message: '[ChatTable] 准备渲染 CustomTable',
      data: {
        hasCustomTableProps: Boolean(customTableProps),
        customTablePropsKeys: customTableProps
          ? Object.keys(customTableProps)
          : [],
        customTablePropsHasTableProps: Boolean(customTableProps?.tableProps),
        customTablePropsTablePropsType: typeof customTableProps?.tableProps,
        hasHandleColumns: Boolean(handleColumns),
        hasHandleFilters: Boolean(handleFilters),
        hasInitQuery: Boolean(initQuery),
        initQuery,
      },
      source: 'ChatTable',
      component: 'render',
    });

    // ✅ 添加错误边界，捕获渲染错误
    // 注意：React 组件渲染错误无法用 try-catch 捕获，需要使用 Error Boundary
    // 但我们可以在这里添加详细的日志，帮助定位问题
    return (
      <div className="chat-table-container">
        <CustomTable<Chat>
          {...customTableProps}
          ref={tableRef}
          handleColumns={handleColumns}
          handleFilters={handleFilters}
          initQuery={initQuery}
          queryFormat={CHAT_TABLE_QUERY_FORMAT}
        />
      </div>
    );
  },
);

ChatTable.displayName = 'ChatTable';

export default ChatTable;
