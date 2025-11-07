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

import type { ModuleType } from '@/types/module';
import type { CustomTableActionType } from '@veaiops/components';
import type { BaseQuery, BaseRecord } from '@veaiops/types';
import { logger } from '@veaiops/utils';
import type { SubscribeRelationWithAttributes } from 'api-generate';
import type React from 'react';
import { useCallback, useEffect, useRef } from 'react';
import {
  SubscriptionModal,
  SubscriptionTable,
  useSubscriptionManagementLogic,
} from '../features/subscription';

/**
 * 事件订阅页面属性
 */
interface EventSubscriptionPageProps {
  /** 模块类型（用于筛选智能体选项） */
  moduleType?: ModuleType;
}

/**
 * 事件订阅页面
 *
 * @description 统一的事件订阅管理页面，支持不同模块类型
 * - 事件中心：显示"内容识别Agent" + "智能阈值Agent"
 * - Oncall异动：仅显示"内容识别Agent"
 *
 * 功能特性：
 * - 智能体筛选（根据模块类型显示不同选项）
 * - 事件级别筛选（P0/P1/P2/P3）
 * - WEBHOOK开关和地址配置
 * - 生效时间范围设置
 * - 完整的CRUD操作
 *
 * 与 origin/feat/web-v2 保持一致：
 * - 使用 SubscriptionTable 组件（显示"事件订阅"）
 * - 使用 SubscriptionModal 组件（表单弹窗）
 * - 使用 useSubscriptionManagementLogic Hook（业务逻辑）
 */
const EventSubscriptionPage: React.FC<EventSubscriptionPageProps> = ({
  moduleType,
}) => {
  // 表格组件 ref（用于访问刷新函数）
  const tableRef = useRef<CustomTableActionType<BaseRecord, BaseQuery>>(null);

  // 🔍 追踪回调引用变化（用于调试）
  const prevHandleEditRef = useRef<unknown>(null);
  const prevHandleDeleteRef = useRef<unknown>(null);
  const prevHandleAddRef = useRef<unknown>(null);

  // 包装刷新函数，确保返回 Promise<boolean>
  // ✅ 修复：useSubscriptionManagementLogic 期望 () => Promise<boolean>
  // 但 tableRef.current?.refresh?.() 返回 Promise<void> | undefined
  const refreshTable = useCallback(async (): Promise<boolean> => {
    try {
      await tableRef.current?.refresh?.();
      return true;
    } catch (error: unknown) {
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      logger.error({
        message: '刷新表格失败',
        data: {
          error: errorObj.message,
          stack: errorObj.stack,
          errorObj,
        },
        source: 'EventSubscriptionPage',
        component: 'refreshTable',
      });
      return false;
    }
  }, []);

  // 使用订阅管理逻辑Hook
  const {
    modalVisible,
    editingSubscription,
    // form 未使用，但由 useSubscriptionManagementLogic 返回，保留以保持接口一致
    form: _form,
    handleEdit,
    handleAdd,
    handleCancel,
    handleSubmit,
    handleDelete,
  } = useSubscriptionManagementLogic(refreshTable);

  // 🔍 追踪 handleEdit 引用变化
  useEffect(() => {
    if (prevHandleEditRef.current !== handleEdit) {
      logger.debug({
        message: '[EventSubscriptionPage] handleEdit 引用变化',
        data: {
          prevHandleEdit: prevHandleEditRef.current,
          currentHandleEdit: handleEdit,
        },
        source: 'EventSubscriptionPage',
        component: 'useEffect',
      });
      prevHandleEditRef.current = handleEdit;
    }
  }, [handleEdit]);

  // 🔍 追踪 handleDelete 引用变化
  useEffect(() => {
    if (prevHandleDeleteRef.current !== handleDelete) {
      logger.debug({
        message: '[EventSubscriptionPage] handleDelete 引用变化',
        data: {
          prevHandleDelete: prevHandleDeleteRef.current,
          currentHandleDelete: handleDelete,
        },
        source: 'EventSubscriptionPage',
        component: 'useEffect',
      });
      prevHandleDeleteRef.current = handleDelete;
    }
  }, [handleDelete]);

  // 🔍 追踪 handleAdd 引用变化
  useEffect(() => {
    if (prevHandleAddRef.current !== handleAdd) {
      logger.debug({
        message: '[EventSubscriptionPage] handleAdd 引用变化',
        data: {
          prevHandleAdd: prevHandleAddRef.current,
          currentHandleAdd: handleAdd,
        },
        source: 'EventSubscriptionPage',
        component: 'useEffect',
      });
      prevHandleAddRef.current = handleAdd;
    }
  }, [handleAdd]);

  // 🔍 记录 modalVisible 变化（点击新增订阅时会变化）
  useEffect(() => {
    logger.debug({
      message: '[EventSubscriptionPage] modalVisible 变化',
      data: {
        modalVisible,
        hasEditingSubscription: Boolean(editingSubscription),
      },
      source: 'EventSubscriptionPage',
      component: 'useEffect',
    });
  }, [modalVisible, editingSubscription]);

  // 查看订阅详情（预留功能）
  // 注意：详情抽屉功能暂未实现，此处仅记录日志
  const handleView = useCallback(
    (subscription: SubscribeRelationWithAttributes) => {
      logger.debug({
        message: '查看订阅详情（功能待实现）',
        data: {
          subscriptionId: subscription._id,
          subscription,
        },
        source: 'EventSubscriptionPage',
        component: 'handleView',
      });
    },
    [],
  );

  return (
    <>
      {/* 事件订阅表格 */}
      <SubscriptionTable
        ref={tableRef}
        moduleType={moduleType}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAdd={handleAdd}
        onView={handleView}
      />

      {/* 订阅表单弹窗 */}
      <SubscriptionModal
        visible={modalVisible}
        initialData={editingSubscription}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        moduleType={moduleType}
        title={editingSubscription ? '编辑订阅' : '新建订阅'}
      />

      {/* TODO: 详情抽屉 - 如需要可添加 */}
      {/* <SubscriptionDetailDrawer
        visible={detailVisible}
        data={viewingSubscription}
        onClose={handleDetailClose}
      /> */}
    </>
  );
};

export default EventSubscriptionPage;
