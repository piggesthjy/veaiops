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

import type React from 'react';
import { useEffect } from 'react';

import { logger } from '@veaiops/utils';
import { useGlobalGuideLogic } from '../hooks';
import {
  initAutoLogCollection,
  isGlobalGuideLogCollecting,
  startGlobalGuideLogCollection,
} from '../lib';
import { ExpandedPanel, SideGuidePanel } from './components';
import style from './styles/index.module.less';

/**
 * 全局引导组件 - 主容器
 * 提供智能阈值任务配置的全链路引导体验
 */
export const GlobalGuide: React.FC = () => {
  const {
    // 状态
    currentStep,
    sideGuidePanelVisible,
    panelContentVisible,
    steps,
    currentStepConfig,

    // 方法
    getStepStatus,
    handleStepClick,
    handleStepSelect,
    handleFrontendFeatureClick,
    handleCloseSidePanel,
    handleOpenSidePanel,
    handleClosePanelContent,
  } = useGlobalGuideLogic();

  // 初始化自动日志收集
  useEffect(() => {
    const cleanup = initAutoLogCollection();

    // 页面加载后自动启动 GlobalGuide 日志收集
    // 延迟启动，确保组件完全初始化
    const autoStartTimer = setTimeout(() => {
      try {
        // 检查是否已经在收集，避免重复启动
        if (!isGlobalGuideLogCollecting()) {
          const sessionId = startGlobalGuideLogCollection({
            featureId: 'auto-start-on-page-load',
            stepNumber: currentStep,
          });

          logger.info({
            message: '[GlobalGuide] 页面加载后自动启动日志收集',
            data: {
              sessionId,
              currentStep,
              url: window.location.href,
              timestamp: new Date().toISOString(),
            },
            source: 'GlobalGuide',
            component: 'autoStartLogCollection',
          });
        } else {
          logger.debug({
            message: '[GlobalGuide] 日志收集已在运行，跳过自动启动',
            data: {
              currentStep,
              url: window.location.href,
            },
            source: 'GlobalGuide',
            component: 'autoStartLogCollection',
          });
        }
      } catch (error) {
        const errorObj =
          error instanceof Error ? error : new Error(String(error));
        logger.error({
          message: '[GlobalGuide] 自动启动日志收集失败',
          data: {
            error: errorObj.message,
            stack: errorObj.stack,
            errorObj,
            currentStep,
            url: window.location.href,
          },
          source: 'GlobalGuide',
          component: 'autoStartLogCollection',
        });
      }
    }, 1000); // 延迟1秒，确保页面完全加载

    // 组件卸载时清理
    return () => {
      clearTimeout(autoStartTimer);
      if (cleanup) {
        cleanup();
      }
    };
    // 只在组件首次挂载时执行，不依赖 currentStep（避免步骤变化时重复启动）
  }, []);

  return (
    <div className={style.globalGuide}>
      {/* 侧边浮动引导面板 */}
      <SideGuidePanel
        sideGuidePanelVisible={sideGuidePanelVisible}
        steps={steps}
        currentStep={currentStep}
        getStepStatus={getStepStatus}
        onOpenSidePanel={handleOpenSidePanel}
        onCloseSidePanel={handleCloseSidePanel}
        onStepSelect={handleStepSelect}
      />

      {/* 展开的引导面板 */}
      <ExpandedPanel
        panelContentVisible={panelContentVisible}
        currentStepConfig={currentStepConfig || null}
        onClosePanelContent={handleClosePanelContent}
        onStepClick={handleStepClick}
        onFrontendFeatureClick={handleFrontendFeatureClick}
      />
    </div>
  );
};
