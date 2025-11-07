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
 * useWizardNavigation - 向导导航逻辑（拆分Hook）
 * @description 将 handleNext、handlePrev、handleClose 的核心逻辑抽离，提升 wizard-controller 可读性
 */

import { useCallback } from 'react';
import { DATA_SOURCE_CONFIGS } from '../../config/datasource-configs';
import { WizardStep } from '../../types';
import type { DataSourceType, WizardActions, WizardState } from '../../types';
import {
  canProceed,
  getButtonText,
  getCurrentStepConfig,
  handleStepDataFetch,
} from '../../utils/wizard-logic';

export interface UseWizardNavigationParams {
  selectedType: DataSourceType | null;
  setSelectedType: (type: DataSourceType | null) => void;
  state: WizardState;
  actions: WizardActions;
  onClose: () => void;
}

export interface UseWizardNavigationReturn {
  handleTypeSelect: (type: DataSourceType) => void;
  handleNext: () => Promise<void>;
  handlePrev: () => void;
  handleClose: () => void;
  canProceedToNext: () => boolean;
  getNextButtonText: () => string;
  getPrevButtonText: () => string;
  shouldShowPrevButton: () => boolean;
}

/**
 * 向导导航 Hook
 */
export const useWizardNavigation = ({
  selectedType,
  setSelectedType,
  state,
  actions,
  onClose,
}: UseWizardNavigationParams): UseWizardNavigationReturn => {
  // 处理数据源类型选择
  const handleTypeSelect = useCallback(
    (type: DataSourceType) => {
      try {
        // 先设置数据源类型到状态中
        actions.setDataSourceType(type);
        // 然后设置本地选中类型
        setSelectedType(type);
        // 确保步骤从-1开始，准备进入配置流程
        if (state.currentStep !== -1) {
          actions.setCurrentStep(WizardStep.TYPE_SELECTION);
        }
      } catch (error) {}
    },
    [selectedType, state.currentStep, setSelectedType, actions],
  );

  // 处理下一步
  const handleNext = useCallback(async () => {
    if (!selectedType) {
      return;
    }

    const config = DATA_SOURCE_CONFIGS.find((c) => c.type === selectedType);
    if (!config) {
      return;
    }

    // 如果还在类型选择阶段，进入第一步
    if (state.currentStep === WizardStep.TYPE_SELECTION) {
      // 添加额外的确认，确保用户真的想要进入下一步
      if (!selectedType) {
        return;
      }

      // 设置步骤
      actions.setCurrentStep(WizardStep.FIRST_STEP);

      // 获取第一步的配置并处理数据获取
      const firstStepConfig = getCurrentStepConfig(
        selectedType,
        WizardStep.FIRST_STEP,
      );
      if (firstStepConfig) {
        try {
          await handleStepDataFetch(
            selectedType,
            state,
            actions,
            firstStepConfig.key,
          );
        } catch (error) {}
      }
      return;
    }

    const currentStepConfig = getCurrentStepConfig(
      selectedType,
      state.currentStep,
    );
    if (!currentStepConfig) {
      return;
    }

    try {
      // 处理步骤数据获取
      await handleStepDataFetch(
        selectedType,
        state,
        actions,
        currentStepConfig.key,
      );

      // 进入下一步
      const nextStep = Math.min(state.currentStep + 1, config.steps.length - 1);
      actions.setCurrentStep(nextStep);
    } catch (error) {}
  }, [selectedType, state, actions]);

  // 处理上一步
  const handlePrev = useCallback(() => {
    if (state.currentStep === WizardStep.FIRST_STEP) {
      // 回到类型选择阶段
      setSelectedType(null);
      actions.resetWizard();
    } else {
      // 回到上一步
      const prevStep = Math.max(state.currentStep - 1, WizardStep.FIRST_STEP);
      actions.setCurrentStep(prevStep);
    }
  }, [state.currentStep, selectedType, setSelectedType, actions]);

  // 处理关闭
  const handleClose = useCallback(() => {
    actions.resetWizard();
    setSelectedType(null);
    onClose();
  }, [state.currentStep, selectedType, actions, setSelectedType, onClose]);

  // 检查是否可以继续
  const canProceedToNext = useCallback(() => {
    return canProceed(selectedType, state);
  }, [selectedType, state]);

  // 获取按钮文本
  const getNextButtonText = useCallback(() => {
    return getButtonText(selectedType, state.currentStep);
  }, [selectedType, state.currentStep]);

  // 获取上一步按钮文本
  const getPrevButtonText = useCallback(() => {
    return '上一步';
  }, [selectedType, state.currentStep]);

  // 检查是否显示上一步按钮
  const shouldShowPrevButton = useCallback(() => {
    // 只有在真正进入配置步骤时才显示上一步按钮
    // 在类型选择阶段（TYPE_SELECTION）不显示上一步按钮
    return state.currentStep > WizardStep.TYPE_SELECTION;
  }, [state.currentStep]);

  return {
    handleTypeSelect,
    handleNext,
    handlePrev,
    handleClose,
    canProceedToNext,
    getNextButtonText,
    getPrevButtonText,
    shouldShowPrevButton,
  };
};

export default useWizardNavigation;
