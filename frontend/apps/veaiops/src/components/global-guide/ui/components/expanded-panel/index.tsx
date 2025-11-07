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

import type { OnFeatureClickParams } from '../frontend-feature-item';
import { CurrentStepInfo } from './current-step-info';
import { FrontendFeaturesList } from './frontend-features-list';
import { LogExporterSection } from './log-exporter-section';
import { PanelHeader } from './panel-header';
import style from './styles';
import type { ExpandedPanelProps } from './types';
import { WelcomeSection } from './welcome-section';

/**
 * Expanded guide panel component
 */
export const ExpandedPanel: React.FC<ExpandedPanelProps> = ({
  panelContentVisible,
  currentStepConfig,
  onClosePanelContent,
  onStepClick,
  onFrontendFeatureClick,
}) => {
  // Wrap frontend feature click handler, automatically close panel after click
  const handleFrontendFeatureClickWithClose = (
    params: OnFeatureClickParams,
  ) => {
    // Execute the original feature click logic first (async, will continue executing)
    onFrontendFeatureClick(params);

    // Close panel immediately to provide user feedback
    // The async execution of previous steps will continue and won't be interrupted
    onClosePanelContent();
  };

  if (!panelContentVisible) {
    return null;
  }

  return (
    <div className={style.expandedPanel}>
      <PanelHeader onClose={onClosePanelContent} />

      <div className={style.panelContent}>
        <WelcomeSection />

        {/* Current step information and platform features */}
        {Boolean(currentStepConfig) && (
          <>
            <CurrentStepInfo currentStepConfig={currentStepConfig} />
            <FrontendFeaturesList
              currentStepConfig={currentStepConfig}
              onFeatureClick={handleFrontendFeatureClickWithClose}
              onStepClick={onStepClick}
            />
          </>
        )}

        {/* Log exporter tool - only shown in development environment */}
        {process.env.NODE_ENV === 'development' && (
          <LogExporterSection currentStepConfig={currentStepConfig} />
        )}
      </div>
    </div>
  );
};
