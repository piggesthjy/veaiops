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

import type { InformStrategyCreate, InformStrategyUpdate } from 'api-generate';
import type React from 'react';

/**
 * 项目导入Hook返回值类型
 */
export interface UseProjectImportReturn {
  visible: boolean;
  loading: boolean;
  refreshTrigger: number;
  open: () => void;
  close: () => void;
  handleImport: (file: File) => Promise<boolean>;
  renderDrawer: () => React.ReactNode;
}

/**
 * 策略创建Hook返回值类型
 */
export interface UseStrategyCreateReturn {
  visible: boolean;
  refreshTrigger: number;
  open: () => void;
  close: () => void;
  handleCreate: (
    values: InformStrategyCreate | InformStrategyUpdate,
  ) => Promise<boolean>;
  renderDrawer: () => React.ReactNode;
}

/**
 * 抽屉管理Hook的返回值类型
 */
export interface UseDrawerManagementReturn {
  // 项目导入相关
  projectImportVisible: boolean;
  projectImportLoading: boolean;
  projectRefreshTrigger: number;
  openProjectImport: () => void;
  closeProjectImport: () => void;
  handleProjectImport: (file: File) => Promise<boolean>;

  // 策略创建相关
  strategyCreateVisible: boolean;
  strategyRefreshTrigger: number;
  openStrategyCreate: () => void;
  closeStrategyCreate: () => void;
  handleStrategyCreate: (
    values: InformStrategyCreate | InformStrategyUpdate,
  ) => Promise<boolean>;

  // 渲染组件
  renderProjectImportDrawer: () => React.ReactNode;
  renderStrategyCreateDrawer: () => React.ReactNode;

  // Tooltip状态
  showProjectTooltip: boolean;
  showStrategyTooltip: boolean;
  hideProjectTooltip: () => void;
  hideStrategyTooltip: () => void;
}

/**
 * 项目导入Hook配置
 */
export interface UseProjectImportConfig {
  /**
   * 项目导入成功后的回调
   */
  onSuccess?: () => void;
}

/**
 * 策略创建Hook配置
 */
export interface UseStrategyCreateConfig {
  /**
   * 策略创建成功后的回调
   */
  onSuccess?: () => void;

  /**
   * 抽屉宽度，默认为800px
   */
  width?: number;
}

/**
 * 抽屉管理Hook配置
 */
export interface UseDrawerManagementConfig {
  /**
   * 项目导入成功后的回调
   */
  onProjectImportSuccess?: () => void;

  /**
   * 策略创建成功后的回调
   */
  onStrategyCreateSuccess?: () => void;
}
