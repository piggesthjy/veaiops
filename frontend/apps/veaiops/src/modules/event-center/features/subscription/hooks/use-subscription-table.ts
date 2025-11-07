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

/**
 * 订阅关系表格完整逻辑 Hook
 *
 * 将所有状态管理、事件处理、表格配置内聚到一个 Hook 中
 */

import type { ModuleType } from '@/types/module';
import {
  getSubscriptionColumns,
  getSubscriptionFilters,
  useSubscriptionActionConfig,
  useSubscriptionTableConfig,
} from '@ec/subscription';
import type {
  BaseQuery,
  CustomTableActionType,
  FieldItem,
  HandleFilterProps,
  ModernTableColumnProps,
} from '@veaiops/components';
import type { BaseRecord } from '@veaiops/types';
import { logger } from '@veaiops/utils';
import type { SubscribeRelationWithAttributes } from 'api-generate';
import type React from 'react';
import { useCallback, useEffect, useRef } from 'react';

export type RenderActionsType = (
  props: Record<string, unknown>,
) => React.ReactNode[];

export interface UseSubscriptionTableOptions {
  moduleType?: ModuleType;
  onEdit: (subscription: SubscribeRelationWithAttributes) => void;
  onDelete: (subscriptionId: string) => Promise<boolean>;
  onAdd: () => void;
  onView: (subscription: SubscribeRelationWithAttributes) => void;
  onTableRefReady?: (refresh: () => Promise<boolean>) => void;
}

export interface UseSubscriptionTableReturn {
  // 表格配置
  customTableProps: Record<string, unknown>;
  handleColumns: (
    props: Record<string, unknown>,
  ) => ModernTableColumnProps<SubscribeRelationWithAttributes>[];
  handleFilters: (props: HandleFilterProps<BaseQuery>) => FieldItem[];
  renderActions: RenderActionsType;

  // 操作处理函数
  handleEdit: (subscription: SubscribeRelationWithAttributes) => void;
  handleAdd: () => void;
  handleDelete: (subscriptionId: string) => Promise<boolean>;

  // 加载状态
  loading: boolean;
}

/**
 * 订阅关系表格完整逻辑 Hook
 *
 * 将所有状态管理和业务逻辑内聚到一个 Hook 中，使组件更加简洁
 */
export const useSubscriptionTable = ({
  moduleType,
  onEdit,
  onDelete,
  onAdd,
  onView,
  onTableRefReady,
}: UseSubscriptionTableOptions): UseSubscriptionTableReturn => {
  const tableRef = useRef<CustomTableActionType<BaseRecord, BaseQuery>>(null);

  // 创建 refresh 函数
  const refreshTable = useCallback(async () => {
    if (tableRef.current?.refresh) {
      const result = await tableRef.current.refresh();
      if (!result.success && result.error) {
        logger.warn({
          message: '订阅表格刷新失败',
          data: {
            error: result.error.message,
            stack: result.error.stack,
            errorObj: result.error,
          },
          source: 'SubscriptionTable',
          component: 'refreshTable',
        });
      }
    }
  }, []);

  // 通过 forwardRef 暴露 tableRef
  const refCallback = useCallback(
    (node: CustomTableActionType<BaseRecord, BaseQuery> | null) => {
      tableRef.current = node;
    },
    [],
  );

  // 当 tableRef 准备好后，通知父组件
  useEffect(() => {
    if (onTableRefReady) {
      onTableRefReady(refreshTable);
    }
  }, []);

  // 表格配置
  const { dataSource, tableProps } = useSubscriptionTableConfig({
    handleEdit: onEdit,
    handleDelete: onDelete,
  });

  // 操作按钮配置
  const { actions } = useSubscriptionActionConfig(onAdd);

  // 创建 handleColumns 函数，传递操作回调给列配置
  const handleColumns = useCallback(
    (props: Record<string, unknown>) => {
      return getSubscriptionColumns({
        ...props,
        onEdit,
        onDelete,
        onView,
      });
    },
    [onEdit, onDelete, onView],
  );

  // 创建 handleFilters 函数
  const handleFilters = useCallback(
    (props: HandleFilterProps<BaseQuery>) => {
      return getSubscriptionFilters({
        query: props.query,
        handleChange: props.handleChange,
        moduleType,
      });
    },
    [moduleType],
  );

  // 包装 renderActions
  const renderActions = useCallback(
    (_props: Record<string, unknown>) => actions,
    [actions],
  );

  return {
    // 表格配置
    customTableProps: {
      ref: refCallback,
      dataSource,
      tableProps,
    },
    handleColumns,
    handleFilters,
    renderActions,

    // 操作处理函数
    handleEdit: onEdit,
    handleAdd: onAdd,
    handleDelete: onDelete,

    // 加载状态（可以后续扩展）
    loading: false,
  };
};
