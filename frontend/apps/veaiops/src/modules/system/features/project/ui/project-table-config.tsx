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

import {
  type BaseQuery,
  CustomTable,
  type FieldItem,
  type HandleFilterProps,
  type ModernTableColumnProps,
} from '@veaiops/components';
import type { Project } from 'api-generate';
import type React from 'react';

/**
 * Project 表格组件 - 使用 Hook 内聚模式 + 自动刷新机制
 *
 * 🎯 最佳实践：Props 透传模式
 * - 接受内聚 Hook 传递的表格配置
 * - 通过 operationWrapper 实现自动刷新
 * - 组件只负责 UI 渲染，业务逻辑由内聚 Hook 处理
 *
 * @param props - 组件属性
 * @returns 表格组件
 */
export const ProjectTableConfig: React.FC<{
  // 表格配置（来自内聚 Hook）
  customTableProps: Record<string, unknown>;
  handleColumns: (
    props?: Record<string, unknown>,
  ) => ModernTableColumnProps<Project>[];
  handleFilters: (props: HandleFilterProps<BaseQuery>) => FieldItem[];
  renderActions: (props?: Record<string, unknown>) => React.ReactNode[];

  // 业务逻辑回调
  onDelete: (projectId: string) => Promise<boolean>;
  onImport: () => void;
  onCreate: () => void;
}> = ({ customTableProps, handleColumns, handleFilters, renderActions }) => {
  return (
    <CustomTable<Project>
      title="项目管理"
      handleColumns={handleColumns}
      handleFilters={handleFilters}
      actions={renderActions({})}
      {...customTableProps}
      isAlertShow={true}
      showReset={false}
      alertType="info"
      alertContent="管理系统中的项目，支持增删改查操作。"
      syncQueryOnSearchParams
      useActiveKeyHook
    />
  );
};
