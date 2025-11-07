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

// ==================== React ====================
import type React from 'react';

// ==================== 项目内部包 ====================
import type apiClient from '@/utils/api-client';
import { CustomTable } from '@veaiops/components';

// ✅ 修复：直接使用 api-generate 中的 AgentTemplate 类型（单一数据源原则）
import type { AgentTemplate } from 'api-generate';
// ==================== 相对路径 ====================
import { CardTemplateDrawer, CardTemplateGuide } from './components';
import { useCardTemplatePage } from './hooks';

/**
 * 事件中心 - 卡片模版管理页面
 * @description 提供消息卡片模版的创建、管理和配置功能
 */
export const CardTemplatePage: React.FC = () => {
  // ✅ 使用内聚的页面级别 Hook，封装所有业务逻辑
  const {
    // 表格引用
    tableRef,

    // 引导相关状态
    shouldShowGuide,
    guideVisible,
    setGuideVisible,

    // 管理逻辑
    managementLogic: {
      modalVisible,
      editingTemplate,
      form,
      handleCancel,
      handleSubmit,
    },

    // 表格配置
    dataSource,
    tableProps,
    handleColumns,
    handleFilters,
    queryFormat,

    // 操作按钮配置
    actions,
  } = useCardTemplatePage();

  // 如果是初始状态且列表为空，显示引导页面
  if (shouldShowGuide) {
    return (
      <div className="page-container">
        <CardTemplateGuide
          visible={guideVisible}
          onClose={() => setGuideVisible(false)}
          onComplete={() => {
            setGuideVisible(false);
            // 刷新页面数据
            // window.location.reload();
          }}
        />
      </div>
    );
  }

  return (
    <div className="page-container">
      <CustomTable<
        AgentTemplate,
        any,
        typeof apiClient.agentTemplate,
        AgentTemplate
      >
        ref={tableRef}
        title="卡片模版管理"
        actions={actions}
        handleColumns={handleColumns}
        handleFilters={handleFilters}
        dataSource={dataSource}
        syncQueryOnSearchParams
        useActiveKeyHook
        tableProps={{
          ...tableProps,
          scroll: { x: 1200 },
          rowKey: '_id',
        }}
        queryFormat={queryFormat}
      />
      <CardTemplateDrawer
        visible={modalVisible}
        editingTemplate={editingTemplate || undefined}
        onCancel={handleCancel}
        onSubmit={handleSubmit}
        form={form}
      />
    </div>
  );
};

export default CardTemplatePage;
