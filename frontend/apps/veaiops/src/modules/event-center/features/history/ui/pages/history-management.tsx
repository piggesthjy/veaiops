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

import { useHistoryManagementLogic } from '@ec/history';
import type React from 'react';
import { useRef } from 'react';
import { HistoryDetailDrawer, HistoryTable } from '../components/table';
import type { HistoryTableRef } from '../components/table/history-table';

/**
 * 历史事件管理页面
 * 提供历史事件的查看和过滤功能 - 使用 CustomTable 和 Zustand 状态管理
 *
 * 架构特点：
 * - 使用自定义Hook封装业务逻辑
 * - 组件职责单一，易于维护
 * - 状态管理与UI渲染分离
 * - 支持配置化和扩展
 * - 使用CustomTable提供高级表格功能
 */
export const HistoryManagement: React.FC = () => {
  const tableRef = useRef<HistoryTableRef>(null);

  const {
    filters,
    drawerVisible,
    selectedRecord,
    handleViewDetail,
    handleCloseDetail,
    updateFilters,
  } = useHistoryManagementLogic();

  return (
    <>
      {/* 历史事件表格组件 - 使用CustomTable */}
      <HistoryTable
        ref={tableRef}
        onViewDetail={handleViewDetail}
        filters={filters}
        updateFilters={updateFilters}
      />

      {/* 事件详情抽屉组件 */}
      <HistoryDetailDrawer
        visible={drawerVisible}
        selectedRecord={selectedRecord}
        onClose={handleCloseDetail}
      />
    </>
  );
};

export default HistoryManagement;
