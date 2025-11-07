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

import { ModuleType } from '@/types/module';
// ✅ 优化：使用最短路径，合并同源导入
import {
  getSubscriptionColumns,
  getSubscriptionFilters,
  useSubscriptionActionConfig,
  useSubscriptionTableConfig,
} from '@ec/subscription';
import {
  type BaseQuery,
  CustomTable,
  type HandleFilterProps,
  type ModernTableColumnProps,
} from '@veaiops/components';
import { logger, queryArrayFormat, queryBooleanFormat } from '@veaiops/utils';
import { AgentType, type SubscribeRelationWithAttributes } from 'api-generate';
import { forwardRef, useCallback, useEffect, useMemo, useRef } from 'react';

/**
 * 订阅关系表格数据类型
 */
interface SubscriptionTableData extends SubscribeRelationWithAttributes {
  key: string;
  [key: string]: any; // 添加索引签名以满足 BaseRecord 约束
}

/**
 * 订阅关系表格组件属性接口
 */
interface SubscriptionTableProps {
  onEdit: (subscription: SubscribeRelationWithAttributes) => void;
  onDelete: (subscriptionId: string) => Promise<boolean>;
  onAdd: () => void;
  onView: (subscription: SubscribeRelationWithAttributes) => void; // 添加 onView prop
  moduleType?: ModuleType;
}

// 配置对象
const SUBSCRIPTION_MANAGEMENT_CONFIG = {
  title: '事件订阅',
};

const queryFormat = {
  // 项目名称列表 - 数组格式
  projects: queryArrayFormat,
  // 产品名称列表 - 数组格式
  products: queryArrayFormat,
  // 客户名称列表 - 数组格式
  customers: queryArrayFormat,
  eventLevels: queryArrayFormat,
  // 任务ID列表 - 数组格式
  agents: queryArrayFormat,
  statuses: queryArrayFormat,
  // 自动更新 - 布尔值格式
  enableWebhook: queryBooleanFormat,
};

/**
 * 订阅关系表格组件
 * 封装表格的渲染逻辑，提供清晰的接口
 */
export const SubscriptionTable = forwardRef<any, SubscriptionTableProps>(
  ({ onEdit, onDelete, onAdd, onView, moduleType }, ref) => {
    // 🔍 渲染计数和引用追踪（用于调试）
    const renderCountRef = useRef(0);
    const prevDataSourceRef = useRef<unknown>(null);
    const prevHandleColumnsRef = useRef<unknown>(null);
    const prevHandleFiltersRef = useRef<unknown>(null);

    renderCountRef.current++;

    // 表格配置
    const { dataSource, tableProps } = useSubscriptionTableConfig({
      handleEdit: onEdit,
      handleDelete: onDelete,
    });

    // 🔍 追踪 dataSource 引用变化
    useEffect(() => {
      if (prevDataSourceRef.current !== dataSource) {
        logger.debug({
          message: '[SubscriptionTable] dataSource 引用变化',
          data: {
            renderCount: renderCountRef.current,
            prevDataSource: prevDataSourceRef.current,
            currentDataSource: dataSource,
            dataSourceChanged:
              prevDataSourceRef.current !== null &&
              prevDataSourceRef.current !== dataSource,
          },
          source: 'SubscriptionTable',
          component: 'useEffect',
        });
        prevDataSourceRef.current = dataSource;
      }
    }, [dataSource]);

    // 操作按钮配置
    const { actions } = useSubscriptionActionConfig(onAdd);

    // 创建 handleColumns 函数，传递操作回调给列配置
    // 🔧 使用 useCallback 稳定化函数引用，避免触发不必要的表格刷新
    const handleColumns = useCallback(
      (
        props: Record<string, unknown>,
      ): ModernTableColumnProps<SubscriptionTableData>[] => {
        // CustomTable 传递的 props 包含 query、handleChange 等属性
        // 需要确保类型转换正确
        const filterProps = props as HandleFilterProps<BaseQuery>;
        return getSubscriptionColumns({
          ...filterProps,
          onEdit,
          onDelete,
          onView,
        });
      },
      [onEdit, onDelete, onView],
    );

    // 🔍 追踪 handleColumns 引用变化
    useEffect(() => {
      if (prevHandleColumnsRef.current !== handleColumns) {
        logger.debug({
          message: '[SubscriptionTable] handleColumns 引用变化',
          data: {
            renderCount: renderCountRef.current,
            prevHandleColumns: prevHandleColumnsRef.current,
            currentHandleColumns: handleColumns,
          },
          source: 'SubscriptionTable',
          component: 'useEffect',
        });
        prevHandleColumnsRef.current = handleColumns;
      }
    }, [handleColumns]);

    // 创建 handleFilters 函数
    // 🔧 使用 useCallback 稳定化函数引用，避免触发不必要的表格刷新
    const handleFilters = useCallback(
      (props: HandleFilterProps<BaseQuery>) =>
        getSubscriptionFilters({
          query: props.query,
          handleChange: props.handleChange,
          moduleType,
        }),
      [moduleType],
    );

    // 🔍 追踪 handleFilters 引用变化
    useEffect(() => {
      if (prevHandleFiltersRef.current !== handleFilters) {
        logger.debug({
          message: '[SubscriptionTable] handleFilters 引用变化',
          data: {
            renderCount: renderCountRef.current,
            prevHandleFilters: prevHandleFiltersRef.current,
            currentHandleFilters: handleFilters,
          },
          source: 'SubscriptionTable',
          component: 'useEffect',
        });
        prevHandleFiltersRef.current = handleFilters;
      }
    }, [handleFilters]);

    // 🔍 记录组件渲染（仅在开发环境）
    useEffect(() => {
      logger.debug({
        message: '[SubscriptionTable] 组件渲染',
        data: {
          renderCount: renderCountRef.current,
          moduleType,
          hasDataSource: Boolean(dataSource),
          hasHandleColumns: Boolean(handleColumns),
          hasHandleFilters: Boolean(handleFilters),
        },
        source: 'SubscriptionTable',
        component: 'useEffect',
      });
    });

    // 根据模块类型设置默认筛选智能体
    const initQuery = useMemo(() => {
      // 智能阈值模块：默认筛选智能阈值Agent
      if (moduleType === ModuleType.INTELLIGENT_THRESHOLD) {
        return { agents: [AgentType.INTELLIGENT_THRESHOLD_AGENT] };
      }
      // Oncall模块：默认筛选内容识别Agent
      if (moduleType === ModuleType.ONCALL) {
        return { agents: [AgentType.CHATOPS_INTEREST_AGENT] };
      }
      // 事件中心模块：默认筛选内容识别Agent + 智能阈值Agent
      return {
        agents: [
          AgentType.CHATOPS_INTEREST_AGENT,
          AgentType.INTELLIGENT_THRESHOLD_AGENT,
        ],
      };
    }, [moduleType]);

    return (
      <CustomTable<SubscriptionTableData>
        ref={ref}
        title={SUBSCRIPTION_MANAGEMENT_CONFIG.title}
        actions={actions}
        initQuery={initQuery}
        handleColumns={handleColumns}
        handleFilters={handleFilters}
        dataSource={dataSource}
        tableProps={tableProps}
        syncQueryOnSearchParams
        useActiveKeyHook
        // 表格配置
        tableClassName="subscription-management-table"
        queryFormat={queryFormat}
      />
    );
  },
);

export default SubscriptionTable;
