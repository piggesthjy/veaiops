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

import { logger } from '@veaiops/utils';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import { GlobalGuideStepNumber } from '../enums/guide-steps.enum';
import type { GlobalGuideStep } from '../lib';
import {
  GUIDE_STEPS_CONFIG,
  getCurrentStepIssues,
  useGlobalGuideStore,
} from '../lib';
import { useConsoleCommands } from './use-console-commands';
import { useFrontendInteraction } from './use-frontend-interaction';
import { usePanelState } from './use-panel-state';
import { useStepNavigation } from './use-step-navigation';

/**
 * Auto highlight feature parameters interface
 */
interface HandleAutoHighlightFeatureParams {
  featureId: string;
  selector: string;
  tooltipContent: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

/**
 * Handle frontend feature click parameters interface
 */
interface HandleFrontendFeatureClickParams {
  featureId: string;
  selector: string;
  tooltipContent: string;
  actionType?: any;
  targetRoute?: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  prerequisiteSteps?: string[];
  currentStepConfig?: any;
  allowDisabled?: boolean;
}

/**
 * Main business logic Hook for global guide component
 * Combines various sub-hooks to provide complete business logic
 */
export const useGlobalGuideLogic = () => {
  const { currentStep, stepStatusMap, userProgress, sideGuidePanelVisible } =
    useGlobalGuideStore();

  // Use various sub-hooks
  const frontendInteraction = useFrontendInteraction();

  const handleAutoHighlightFeature = useCallback(
    ({
      featureId,
      selector,
      tooltipContent,
      placement,
    }: HandleAutoHighlightFeatureParams) => {
      logger.info({
        message: '[GlobalGuide] Auto highlight frontend feature',
        data: {
          featureId,
          selector,
          tooltipContent,
          hasTooltipContent: Boolean(tooltipContent),
          placement,
          timestamp: new Date().toISOString(),
        },
        source: 'GlobalGuide',
        component: 'handleAutoHighlightFeature',
      });

      // Only show highlight and guide tooltip when tooltipContent exists
      if (tooltipContent) {
        frontendInteraction.highlightAndGuide({
          selector,
          tooltipContent,
          featureId,
          placement,
        });
      } else {
        logger.info({
          message: '[GlobalGuide] No need to show tooltip, skip auto highlight',
          data: {
            featureId,
            selector,
          },
          source: 'GlobalGuide',
          component: 'handleAutoHighlightFeature',
        });
      }
    },
    [frontendInteraction],
  );

  const stepNavigation = useStepNavigation({
    onAutoHighlightFeature: handleAutoHighlightFeature,
  });
  const panelState = usePanelState();
  // const routeListener = useRouteListener(); // Temporarily commented out unused variable

  // Wrap frontend feature click handler, add manual trigger marker
  const handleFrontendFeatureClickWithMark = useCallback(
    (params: HandleFrontendFeatureClickParams) => {
      // Mark as manually triggered
      stepNavigation.markManualHighlight(params.featureId);

      // Call original frontend feature click handler
      frontendInteraction.handleFrontendFeatureClick(params);
    },
    [frontendInteraction, stepNavigation],
  );

  // Record initial state (only execute on first mount, avoid repeated triggers)
  const hasInitializedRef = useRef(false);
  useEffect(() => {
    if (hasInitializedRef.current) {
      return; // Already initialized, no longer execute
    }

    logger.info({
      message: '[GlobalGuide] Hook initialization',
      data: {
        currentStep,
        stepStatusMap,
        sideGuidePanelVisible,
        userProgress,
      },
      source: 'GlobalGuide',
      component: 'useGlobalGuideLogic',
    });

    // Ensure first step is activated by default (only on first mount and when current step is empty or invalid)
    const isValidStep =
      currentStep && GUIDE_STEPS_CONFIG.some((s) => s.number === currentStep);
    if (
      !isValidStep &&
      stepStatusMap[GlobalGuideStepNumber.CONNECTION] !== 'active'
    ) {
      logger.info({
        message:
          '[GlobalGuide] Initialization - ensure first step is activated',
        data: {
          currentStep,
          stepStatusMap,
        },
        source: 'GlobalGuide',
        component: 'useGlobalGuideLogic',
      });

      stepNavigation.handleStepSelect(GlobalGuideStepNumber.CONNECTION);
    }

    hasInitializedRef.current = true;
  }, []); // Only execute on first mount

  // Record sub-hook state
  useEffect(() => {
    logger.info({
      message: '[GlobalGuide] Sub-hook state update',
      data: {
        stepNavigation: {
          currentStep: stepNavigation.currentStep,
          steps: stepNavigation.steps.length,
        },
        panelState: {
          sideGuidePanelVisible: panelState.sideGuidePanelVisible,
          panelContentVisible: panelState.panelContentVisible,
          hintCardVisible: panelState.hintCardVisible,
        },
      },
      source: 'GlobalGuide',
      component: 'useGlobalGuideLogic',
    });
  }, [
    stepNavigation.currentStep,
    stepNavigation.steps.length,
    panelState.sideGuidePanelVisible,
    panelState.panelContentVisible,
    panelState.hintCardVisible,
    sideGuidePanelVisible,
    userProgress,
  ]);

  // Register console commands
  useConsoleCommands(stepNavigation.handleStepClick);

  // Step configuration
  const steps: GlobalGuideStep[] = GUIDE_STEPS_CONFIG;

  // Get incomplete items for current step
  const getCurrentStepIssuesCallback = useCallback(() => {
    const issues = getCurrentStepIssues(currentStep, userProgress);
    logger.info({
      message: '[GlobalGuide] Get incomplete items for current step',
      data: {
        currentStep,
        issuesCount: issues.length,
        issues,
      },
      source: 'GlobalGuide',
      component: 'getCurrentStepIssues',
    });
    return issues;
  }, [currentStep, userProgress]);

  // Handle step selection (no navigation, only update state and open panel)
  const handleStepSelect = useCallback(
    (stepNumber: GlobalGuideStepNumber) => {
      logger.info({
        message: '[GlobalGuide] Step selection started',
        data: {
          stepNumber,
          previousStep: currentStep,
          sideGuidePanelVisible,
          panelContentVisible: panelState.panelContentVisible,
        },
        source: 'GlobalGuide',
        component: 'handleStepSelect',
      });

      stepNavigation.handleStepSelect(stepNumber);
      panelState.handleOpenPanelContent();

      logger.info({
        message: '[GlobalGuide] Step selection completed',
        data: {
          stepNumber,
          newCurrentStep: stepNavigation.currentStep,
          panelContentVisible: panelState.panelContentVisible,
        },
        source: 'GlobalGuide',
        component: 'handleStepSelect',
      });
    },
    [stepNavigation, panelState, currentStep, sideGuidePanelVisible],
  );

  // Show hint card (only when side guide panel is open)
  useEffect(() => {
    if (!sideGuidePanelVisible) {
      return;
    }

    const issues = getCurrentStepIssuesCallback();
    const shouldShowHint = issues.length > 0;

    logger.info({
      message: '[GlobalGuide] Hint card state update',
      data: {
        sideGuidePanelVisible,
        issuesCount: issues.length,
        shouldShowHint,
        currentHintCardVisible: panelState.hintCardVisible,
      },
      source: 'GlobalGuide',
      component: 'hintCardEffect',
    });

    panelState.setHintCardVisible(shouldShowHint);
  }, [sideGuidePanelVisible, getCurrentStepIssuesCallback, panelState]);

  // Calculate current step configuration (based on current step, not affected by panel visibility)
  const currentStepConfig = useMemo(() => {
    const config = steps.find((s) => s.number === currentStep) || null;
    logger.info({
      message: '[GlobalGuide] Calculate current step configuration',
      data: {
        currentStep,
        foundConfig: Boolean(config),
        configNumber: config?.number,
        configTitle: config?.title,
        configFeaturesCount: config?.frontendFeatures?.length || 0,
        totalSteps: steps.length,
        allStepNumbers: steps.map((s) => s.number),
      },
      source: 'GlobalGuide',
      component: 'currentStepConfig',
    });
    return config;
  }, [currentStep, steps]);

  // Only calculate issues when side guide panel is open
  const issues = sideGuidePanelVisible ? getCurrentStepIssuesCallback() : [];

  // Record state changes
  useEffect(() => {
    logger.info({
      message: '[GlobalGuide] State change',
      data: {
        currentStep,
        currentStepConfig: currentStepConfig
          ? {
              number: currentStepConfig.number,
              title: currentStepConfig.title,
            }
          : null,
        sideGuidePanelVisible,
        panelContentVisible: panelState.panelContentVisible,
        issuesCount: issues.length,
      },
      source: 'GlobalGuide',
      component: 'stateChange',
    });
  }, [
    currentStep,
    currentStepConfig,
    sideGuidePanelVisible,
    panelState.panelContentVisible,
    issues.length,
  ]);

  return {
    // State
    currentStep,
    stepStatusMap,
    userProgress,
    sideGuidePanelVisible,
    panelContentVisible: panelState.panelContentVisible,
    hintCardVisible: panelState.hintCardVisible,
    steps,
    currentStepConfig,
    issues,

    // Methods
    getStepStatus: stepNavigation.getStepStatus,
    handleStepClick: stepNavigation.handleStepClick,
    handleStepSelect,
    handleStepComplete: stepNavigation.handleStepComplete,
    handleQuickFix: stepNavigation.handleQuickFix,
    handleFrontendFeatureClick: handleFrontendFeatureClickWithMark,
    handleCloseSidePanel: panelState.handleCloseSidePanel,
    handleOpenSidePanel: panelState.handleOpenSidePanel,
    handleClosePanelContent: panelState.handleClosePanelContent,
    handleOpenPanelContent: panelState.handleOpenPanelContent,
    getCurrentStepIssues: getCurrentStepIssuesCallback,
  };
};
