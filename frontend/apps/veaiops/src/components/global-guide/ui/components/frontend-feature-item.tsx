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
 * 前端功能项组件
 * 用于显示和交互单个前端功能
 */

import { Button, Typography } from '@arco-design/web-react';
import { logger } from '@veaiops/utils';
import type React from 'react';

import type { FeatureActionType, FrontendFeature } from '../../lib';
import { startGlobalGuideLogCollection } from '../../lib';
import style from '../styles/index.module.less';

const { Text } = Typography;

export interface OnFeatureClickParams {
  featureId: string;
  selector: string;
  tooltipContent: string;
  actionType: FeatureActionType;
  targetRoute: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  prerequisiteSteps?: string[];
  currentStepConfig?: any;
  allowDisabled?: boolean;
}

export interface FrontendFeatureItemProps {
  /** 前端功能配置 */
  feature: FrontendFeature;
  /** 当前步骤的路由 */
  currentRoute: string;
  /** 功能点击回调 */
  onFeatureClick: (params: OnFeatureClickParams) => void;
  /** 前往配置点击回调 */
  onGoToConfig?: (stepNumber: number) => void;
  /** 是否高亮显示 */
  highlighted?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 当前步骤配置 */
  currentStepConfig?: any;
}

/**
 * 前端功能项组件
 * 渲染单个前端功能，包括按钮和描述
 */
export const FrontendFeatureItem: React.FC<FrontendFeatureItemProps> = ({
  feature,
  currentRoute,
  onFeatureClick,
  onGoToConfig,
  highlighted = false,
  disabled = false,
  currentStepConfig,
}) => {
  const handleClick = () => {
    if (disabled) {
      return;
    }

    onFeatureClick({
      featureId: feature.id,
      selector: feature.selector,
      tooltipContent: feature.tooltipContent || '',
      actionType: feature.actionType || 'direct',
      targetRoute: feature.targetRoute || currentRoute,
      placement: feature.placement,
      prerequisiteSteps: feature.prerequisiteSteps,
      currentStepConfig,
      allowDisabled: feature.allowDisabled,
    });
  };

  const handleGoToConfig = () => {
    if (onGoToConfig && currentStepConfig?.number) {
      // 在开发环境下，自动开始收集日志
      if (process.env.NODE_ENV === 'development') {
        logger.info({
          message: '[FrontendFeatureItem] 前往配置按钮被点击，开始收集日志',
          data: {
            featureId: feature.id,
            featureName: feature.name,
            stepNumber: currentStepConfig.number,
            stepTitle: currentStepConfig.title,
            timestamp: new Date().toISOString(),
            url: window.location.href,
          },
          source: 'FrontendFeatureItem',
          component: 'handleGoToConfig',
        });

        // 使用专用的 GlobalGuide 日志收集器
        const sessionId = startGlobalGuideLogCollection({
          featureId: feature.id,
          stepNumber: currentStepConfig.number,
        });

        logger.info({
          message: '前往配置按钮被点击，日志收集已自动开始',
          data: {
            sessionId,
            featureId: feature.id,
            stepNumber: currentStepConfig.number,
          },
          source: 'FrontendFeatureItem',
          component: 'handleGoToConfig',
        });
      }

      onGoToConfig(currentStepConfig.number);
    }
  };

  const itemClassName = [
    style.featureItem,
    highlighted && style.highlighted,
    disabled && style.disabled,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={itemClassName} onClick={handleClick}>
      <div className={style.featureContent}>
        <Button
          type="text"
          size="small"
          className={style.featureBtn}
          disabled={disabled}
        >
          {feature.name}
        </Button>
        <Text className={style.featureDescription}>{feature.description}</Text>
      </div>
      {onGoToConfig && (
        <Button
          type="primary"
          size="small"
          className={style.goToConfigBtn}
          onClick={handleGoToConfig}
          disabled={disabled}
        >
          前往配置
        </Button>
      )}
    </div>
  );
};
