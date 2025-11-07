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

import { Typography } from '@arco-design/web-react';
import { IconStarFill } from '@arco-design/web-react/icon';
import type React from 'react';

import type { GlobalGuideStep } from '@/components/global-guide/lib';
import type { OnFeatureClickParams } from '../frontend-feature-item';
import { FrontendFeatureItem } from '../frontend-feature-item';
import style from './styles';

const { Text } = Typography;

interface FrontendFeaturesListProps {
  currentStepConfig: GlobalGuideStep;
  onFeatureClick: (params: OnFeatureClickParams) => void;
  onStepClick: (stepNumber: number) => void;
}

export const FrontendFeaturesList: React.FC<FrontendFeaturesListProps> = ({
  currentStepConfig,
  onFeatureClick,
  onStepClick,
}) => {
  return (
    <div className={style.frontendFeatures}>
      <Text className={style.featuresTitle}>
        <IconStarFill className="text-sm mr-1 text-[#ffb400]" />
        模版功能：
      </Text>
      <div className={style.featuresList}>
        {currentStepConfig.frontendFeatures.map((feature) => (
          <FrontendFeatureItem
            key={feature.id}
            feature={feature}
            currentRoute={currentStepConfig.route}
            onFeatureClick={onFeatureClick}
            onGoToConfig={onStepClick}
            highlighted={feature.id === 'new-connection'}
            currentStepConfig={currentStepConfig}
          />
        ))}
      </div>
    </div>
  );
};
