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

import { useSubscribeRelation } from '@/hooks/use-subscribe-relation';
import {
  type ModuleType,
  detectModuleTypeFromPath,
  getModuleConfig,
} from '@/types/module';
import { useLocation } from '@modern-js/runtime/router';
import { logger } from '@veaiops/utils';
import type {
  SubscribeRelationCreate,
  SubscribeRelationUpdate,
  SubscribeRelationWithAttributes,
} from 'api-generate';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { SubscribeRelationForm } from './relation-form';
import { SubscribeRelationTable } from './subscribe-relation-table/subscribe-relation-table';

interface SubscriptionManagementProps {
  moduleType?: ModuleType;
}

/**
 * 订阅管理页面
 * 提供订阅关系的增删改查功能 - 与 origin/feat/web-v2 保持一致
 *
 * 架构特点：
 * - 使用 useSubscribeRelation Hook 管理数据
 * - 使用 SubscribeRelationForm 抽屉组件
 * - 使用 SubscribeRelationTable 表格组件
 * - CRUD 操作与 origin/feat/web-v2 完全一致
 */
const SubscriptionManagement: React.FC<SubscriptionManagementProps> = ({
  moduleType,
}) => {
  const location = useLocation();

  // 根据路由自动判断模块类型
  const detectedModuleType = useMemo(() => {
    if (moduleType) {
      return moduleType;
    }

    return detectModuleTypeFromPath(location.pathname);
  }, [moduleType, location.pathname]);

  // 根据模块类型设置页面标题
  const pageTitle = useMemo(() => {
    const config = getModuleConfig(detectedModuleType);
    return config.pageTitle;
  }, [detectedModuleType]);

  // 使用订阅关系管理hook
  const {
    loading,
    fetchSubscribeRelations,
    createSubscribeRelation,
    updateSubscribeRelation,
    deleteSubscribeRelation,
  } = useSubscribeRelation(detectedModuleType);

  // 表单抽屉状态
  const [formVisible, setFormVisible] = useState(false);
  const [editingData, setEditingData] =
    useState<SubscribeRelationWithAttributes | null>(null);

  /**
   * 编辑订阅关系
   */
  const handleEdit = (record: SubscribeRelationWithAttributes) => {
    setEditingData(record);
    setFormVisible(true);
  };

  /**
   * 删除订阅关系
   */
  const handleDelete = async (id: string) => {
    await deleteSubscribeRelation(id);
  };

  /**
   * 创建新的订阅关系
   */
  const handleCreate = () => {
    setEditingData(null);
    setFormVisible(true);
  };

  /**
   * 处理表单提交
   */
  const handleFormSubmit = async (
    data: SubscribeRelationCreate | SubscribeRelationUpdate,
  ) => {
    try {
      if (editingData?._id) {
        // 编辑模式
        return await updateSubscribeRelation({ id: editingData._id, data });
      } else {
        // 创建模式
        return await createSubscribeRelation(data);
      }
    } catch (error: unknown) {
      // ✅ 注意：错误已在 Hook 中处理，此处静默处理是预期的行为
      // 使用 logger 记录调试信息（logger 内部会处理开发环境判断）
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      logger.debug({
        message: '表单提交错误（已在 Hook 中处理）',
        data: {
          error: errorObj.message,
          stack: errorObj.stack,
          errorObj,
        },
        source: 'SubscriptionManagement',
        component: 'handleFormSubmit',
      });
      return false;
    }
  };

  /**
   * 关闭表单抽屉
   */
  const handleFormClose = () => {
    setFormVisible(false);
    setEditingData(null);
  };

  // 页面加载时获取订阅关系数据
  useEffect(() => {
    fetchSubscribeRelations();
  }, [fetchSubscribeRelations]);

  return (
    <>
      <SubscribeRelationTable
        moduleType={detectedModuleType}
        title={pageTitle}
        showModuleTypeColumn={true}
        onCreate={handleCreate}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRefresh={() => fetchSubscribeRelations()}
        loading={loading}
      />

      {/* 订阅关系表单抽屉 */}
      <SubscribeRelationForm
        visible={formVisible}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        editData={editingData}
        moduleType={detectedModuleType}
      />
    </>
  );
};

export default SubscriptionManagement;
