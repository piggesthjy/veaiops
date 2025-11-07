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
  ModuleType,
  detectModuleTypeFromPath,
  getModuleConfig,
} from '@/types/module';
import { Card, Table, Typography } from '@arco-design/web-react';
import { useLocation } from '@modern-js/runtime/router';
import type { SubscribeRelationWithAttributes } from 'api-generate';
import type React from 'react';
import { useEffect, useMemo } from 'react';

const { Title } = Typography;

interface SubscribeRelationManagerProps {
  /** 模块类型，用于过滤订阅关系 */
  moduleType?: ModuleType;
  /** 页面标题 */
  title?: string;
  /** 是否显示模块类型列 */
  showModuleTypeColumn?: boolean;
  /** 自定义操作按钮 */
  customActions?: (record: SubscribeRelationWithAttributes) => React.ReactNode;
  /** 创建订阅关系的回调 */
  onCreateSubscription?: (moduleType: ModuleType) => void;
  /** 编辑订阅关系的回调 */
  onEditSubscription?: (record: SubscribeRelationWithAttributes) => void;
}

/**
 * 通用订阅关系管理组件
 * @description 提供事件订阅关系的管理功能，支持根据模块类型进行过滤
 */
export const SubscribeRelationManager: React.FC<
  SubscribeRelationManagerProps
> = ({
  moduleType,
  title,
  showModuleTypeColumn = true,
  // 注意：这些属性已移除，使用默认行为
  // _customActions,
  // _onCreateSubscription,
  // _onEditSubscription,
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
    if (title) {
      return title;
    }

    const config = getModuleConfig(detectedModuleType);
    return config.pageTitle;
  }, [title, detectedModuleType]);

  // 使用订阅关系管理hook
  const { subscribeRelations, loading, fetchSubscribeRelations } =
    useSubscribeRelation(detectedModuleType);

  // 根据模块类型过滤订阅关系
  const filteredSubscribeRelations = useMemo(() => {
    if (!subscribeRelations) {
      return [];
    }

    return subscribeRelations.filter((relation) => {
      // 如果没有属性，默认显示在事件中心
      if (!relation.attributes || relation.attributes.length === 0) {
        return detectedModuleType === ModuleType.EVENT_CENTER;
      }

      // 检查是否有模块类型属性
      const moduleAttr = relation.attributes.find(
        (attr) => attr.key === 'module_type',
      );

      if (moduleAttr) {
        return moduleAttr.value === detectedModuleType;
      }

      // 如果没有模块类型属性，默认显示在事件中心
      return detectedModuleType === ModuleType.EVENT_CENTER;
    });
  }, [subscribeRelations, detectedModuleType]);

  // 表格列配置
  const columns = useMemo(() => {
    const baseColumns: any[] = [
      // ... existing code ...
    ];

    return baseColumns;
  }, []); // 移除不必要的依赖

  // 页面加载时获取订阅关系数据
  useEffect(() => {
    fetchSubscribeRelations();
  }, [fetchSubscribeRelations, detectedModuleType]);

  return (
    <div>
      <Card>
        <div className="mb-4 flex justify-between items-center">
          <Title heading={5} className="m-0">
            {pageTitle}
          </Title>
        </div>

        <Table
          columns={columns}
          data={filteredSubscribeRelations}
          loading={loading}
          // Use backend _id to ensure unique keys for each row
          rowKey="_id"
          scroll={{ x: showModuleTypeColumn ? 1600 : 1480 }}
          pagination={{
            showTotal: true,
            sizeOptions: [10, 20, 50],
          }}
        />
      </Card>
    </div>
  );
};

export default SubscribeRelationManager;
