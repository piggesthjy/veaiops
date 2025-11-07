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

import { useState } from 'react';
import type {
  UseDrawerManagementConfig,
  UseDrawerManagementReturn,
} from './types/drawer-management';
import { useProjectImport } from './use-project-import';
import { useStrategyCreate } from './use-strategy-create';

/**
 * 抽屉管理Hook
 * 组合项目导入和策略创建功能，提供统一的接口
 */
export const useDrawerManagement = (
  config: UseDrawerManagementConfig = {},
): UseDrawerManagementReturn => {
  const { onProjectImportSuccess, onStrategyCreateSuccess } = config;

  // Tooltip状态管理
  const [showProjectTooltip, setShowProjectTooltip] = useState(false);
  const [showStrategyTooltip, setShowStrategyTooltip] = useState(false);

  // 使用项目导入Hook
  const projectImport = useProjectImport({
    onSuccess: () => {
      setShowProjectTooltip(true);
      onProjectImportSuccess?.();
    },
  });

  // 使用策略创建Hook - 使用较小的宽度（与项目导入抽屉相同）
  const strategyCreate = useStrategyCreate({
    onSuccess: () => {
      setShowStrategyTooltip(true);
      onStrategyCreateSuccess?.();
    },
    width: 520, // 与项目导入抽屉相同的宽度
  });

  return {
    // 项目导入相关
    projectImportVisible: projectImport.visible,
    projectImportLoading: projectImport.loading,
    projectRefreshTrigger: projectImport.refreshTrigger,
    openProjectImport: projectImport.open,
    closeProjectImport: projectImport.close,
    handleProjectImport: projectImport.handleImport,

    // 策略创建相关
    strategyCreateVisible: strategyCreate.visible,
    strategyRefreshTrigger: strategyCreate.refreshTrigger,
    openStrategyCreate: strategyCreate.open,
    closeStrategyCreate: strategyCreate.close,
    handleStrategyCreate: strategyCreate.handleCreate,

    // 渲染组件
    renderProjectImportDrawer: projectImport.renderDrawer,
    renderStrategyCreateDrawer: strategyCreate.renderDrawer,

    // Tooltip状态
    showProjectTooltip,
    showStrategyTooltip,
    hideProjectTooltip: () => setShowProjectTooltip(false),
    hideStrategyTooltip: () => setShowStrategyTooltip(false),
  };
};

export default useDrawerManagement;
