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

/**
 * 数据源向导步骤工具函数
 * @description 提供步骤相关的通用工具函数，如获取步骤配置、按钮文本等
 * @author AI Assistant
 * @date 2025-01-19
 */

import { DATA_SOURCE_CONFIGS } from '../../config/datasource-configs';
import { type DataSourceType, WizardStep } from '../../types';

/**
 * 获取步骤进度文本
 * @param selectedType 选中的数据源类型
 * @param currentStep 当前步骤索引
 * @returns 进度文本，如 "2 / 5"
 */
export const getStepProgressText = (
  selectedType: DataSourceType | null,
  currentStep: number,
): string => {
  if (!selectedType) {
    return '';
  }

  const config = DATA_SOURCE_CONFIGS.find((c) => c.type === selectedType);
  if (!config) {
    return '';
  }

  return `${currentStep + 1} / ${config.steps.length}`;
};

/**
 * 获取当前步骤配置
 * @param selectedType 选中的数据源类型
 * @param currentStep 当前步骤索引
 * @returns 步骤配置对象，如果没有找到则返回 null
 */
export const getCurrentStepConfig = (
  selectedType: DataSourceType | null,
  currentStep: number,
) => {
  if (!selectedType || currentStep < WizardStep.FIRST_STEP) {
    return null;
  }

  const config = DATA_SOURCE_CONFIGS.find((c) => c.type === selectedType);
  if (!config || currentStep >= config.steps.length) {
    return null;
  }

  return config.steps[currentStep];
};

/**
 * 获取下一步按钮文本
 * @param selectedType 选中的数据源类型
 * @param currentStep 当前步骤索引
 * @returns 按钮文本
 */
export const getButtonText = (
  selectedType: DataSourceType | null,
  currentStep: number,
): string => {
  if (!selectedType) {
    return '开始配置';
  }

  if (currentStep === WizardStep.TYPE_SELECTION) {
    return '开始配置';
  }

  const config = DATA_SOURCE_CONFIGS.find((c) => c.type === selectedType);
  if (!config) {
    return '下一步';
  }

  // 如果是最后一步，显示"完成"
  if (currentStep === config.steps.length - 1) {
    return '完成';
  }

  return '下一步';
};

/**
 * 检查是否是最后一步
 * @param selectedType 选中的数据源类型
 * @param currentStep 当前步骤索引
 * @returns 是否是最后一步
 */
export const isLastStep = (
  selectedType: DataSourceType | null,
  currentStep: number,
): boolean => {
  if (!selectedType) {
    return false;
  }

  const config = DATA_SOURCE_CONFIGS.find((c) => c.type === selectedType);
  if (!config) {
    return false;
  }

  return currentStep === config.steps.length - 1;
};

/**
 * 获取数据源类型的显示名称
 * @param type 数据源类型
 * @returns 显示名称
 */
export const getDataSourceTypeDisplayName = (type: DataSourceType): string => {
  const config = DATA_SOURCE_CONFIGS.find((c) => c.type === type);
  return config?.name || type;
};
