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

import type { BotAttributeFiltersQuery } from '@bot/lib';
import type { BotAttributeFormData } from '@bot/types';
import type { CustomTableActionType } from '@veaiops/components';
import type { BotAttribute } from 'api-generate';
import type React from 'react';
import { useCallback, useRef } from 'react';
import { useBotAttributesTableConfig } from './config';
import { useBotAttributesTableLogic } from './logic';

/**
 * Bot 属性表格 Hook 参数
 */
export interface UseBotAttributesTableParams {
  botId?: string;
  channel?: string;
}

/**
 * Bot 属性表格 Hook 返回值
 */
export interface UseBotAttributesTableReturn {
  // 业务逻辑
  logic: ReturnType<typeof useBotAttributesTableLogic>;

  // 表格配置
  tableRef: React.RefObject<
    CustomTableActionType<BotAttribute, BotAttributeFiltersQuery>
  >;
  handleColumns: () => ReturnType<
    ReturnType<typeof useBotAttributesTableConfig>['handleColumns']
  >;
  handleFilters: ReturnType<
    typeof useBotAttributesTableConfig
  >['handleFilters'];
  initQuery: BotAttributeFiltersQuery;
  dataSource: {
    request: (params?: Record<string, unknown>) => Promise<unknown>;
    ready: boolean;
    responseItemsKey: string;
  };
  tableProps: ReturnType<typeof useBotAttributesTableConfig>['tableProps'];

  // 包装后的事件处理（自动传递 tableRef）
  handleDelete: (attribute: BotAttribute) => Promise<boolean>;
  handleFormSubmit: (values: BotAttributeFormData) => Promise<boolean>;
}

/**
 * Bot 属性表格聚合 Hook
 * 整合业务逻辑、表格配置和 tableRef，提供统一的表格相关功能
 */
export const useBotAttributesTable = ({
  botId,
  channel,
}: UseBotAttributesTableParams): UseBotAttributesTableReturn => {
  // 🎯 业务逻辑和状态管理
  const logic = useBotAttributesTableLogic({ botId, channel });

  // 🎯 创建 tableRef 用于刷新操作
  const tableRef =
    useRef<CustomTableActionType<BotAttribute, BotAttributeFiltersQuery>>(null);

  // ✅ 修复死循环：使用 ref 来稳定 logic 中的方法引用，避免依赖整个 logic 对象
  // 根据规范：避免依赖整个对象，只提取必要的配置字段
  // 使用 ref 模式：在 useCallback 回调中使用 ref 存储最新值，创建稳定的包装函数
  const logicRef = useRef(logic);
  logicRef.current = logic;

  // 🎯 创建包装的删除处理函数，自动传递 tableRef
  const handleDelete = useCallback(
    async (attribute: BotAttribute): Promise<boolean> => {
      try {
        await logicRef.current.handleDelete(attribute, tableRef);
        return true;
      } catch (error) {
        // 错误已在 Hook 中处理
        return false;
      }
    },
    [], // ✅ 空依赖数组，确保函数引用稳定
  );

  // 🎯 创建包装的表单提交函数，成功后刷新表格
  const handleFormSubmit = useCallback(
    async (values: BotAttributeFormData): Promise<boolean> => {
      const success = await logicRef.current.handleFormSubmit(values);
      // 如果成功，刷新表格
      if (success) {
        const refreshSuccess = await logicRef.current.refreshTable(tableRef);
        return refreshSuccess;
      }
      return false;
    },
    [], // ✅ 空依赖数组，确保函数引用稳定
  );

  // 🎯 表格配置（使用包装后的 handleDelete）
  const config = useBotAttributesTableConfig({
    botId,
    channel,
    onDelete: handleDelete,
    tableRef,
  });

  return {
    logic,
    tableRef: config.tableRef,
    handleColumns: config.handleColumns,
    handleFilters: config.handleFilters,
    initQuery: config.initQuery,
    dataSource: config.dataSource,
    tableProps: config.tableProps,
    handleDelete,
    handleFormSubmit,
  };
};
