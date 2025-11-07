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
  PROJECT_MANAGEMENT_CONFIG,
  type ProjectTableProps,
  useProjectTableConfig,
} from '@project';
import { CustomTable } from '@veaiops/components';
import React, { forwardRef } from 'react';

/**
 * 项目表格组件
 * 基于CustomTable的标准化实现
 * 使用 useBusinessTable 和 operationWrapper 实现自动刷新，无需手动管理 ref
 */
export const ProjectTable = forwardRef<
  { refresh: () => Promise<void> },
  ProjectTableProps
>(({ onDelete, onImport, onCreate }, ref) => {
  // 🎯 使用 useProjectTableConfig Hook，自动处理刷新逻辑
  // ✅ 传递 ref 给 useProjectTableConfig，让 useBusinessTable 可以使用 ref 刷新
  const { customTableProps, handleColumns, handleFilters, actions } =
    useProjectTableConfig({
      onDelete,
      onImport,
      onCreate,
      ref, // ✅ 传递 ref 给 Hook
    });

  return (
    <CustomTable
      ref={ref}
      {...customTableProps}
      title={PROJECT_MANAGEMENT_CONFIG.title}
      handleColumns={handleColumns}
      handleFilters={handleFilters}
      actions={actions}
    />
  );
});

// 设置 displayName 用于调试
ProjectTable.displayName = 'ProjectTable';

export default ProjectTable;
