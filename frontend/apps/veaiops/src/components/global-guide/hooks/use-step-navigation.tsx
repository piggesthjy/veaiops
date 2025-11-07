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

import { useNavigate } from '@modern-js/runtime/router';
import { logger } from '@veaiops/utils';
import { useCallback, useRef } from 'react';

import type { GlobalGuideStepNumber } from '../enums/guide-steps.enum';
import type { GlobalGuideStep, StepStatus } from '../lib';
import {
  GUIDE_STEPS_CONFIG,
  globalGuideTracker,
  useGlobalGuideStore,
} from '../lib';

/**
 * Auto highlight frontend feature parameters interface
 */
interface HandleAutoHighlightFeatureParams {
  featureId: string;
  selector: string;
  tooltipContent: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

/**
 * useStepNavigation Hook parameters interface
 */
export interface UseStepNavigationParams {
  onAutoHighlightFeature?: (params: HandleAutoHighlightFeatureParams) => void;
}

/**
 * Step navigation related Hook
 * Handles step click, status retrieval, step completion, etc.
 */
export const useStepNavigation = ({
  onAutoHighlightFeature,
}: UseStepNavigationParams = {}) => {
  const navigate = useNavigate();
  const { currentStep, stepStatusMap, updateStepStatus, updateCurrentStep } =
    useGlobalGuideStore();

  const steps: GlobalGuideStep[] = GUIDE_STEPS_CONFIG;

  // Track whether frontend feature highlight has been manually triggered
  const manualHighlightTriggered = useRef<Set<string>>(new Set());

  // Mark manually triggered frontend feature
  const markManualHighlight = useCallback((featureId: string) => {
    manualHighlightTriggered.current.add(featureId);
    logger.info({
      message: '[GlobalGuide] Mark manually triggered frontend feature',
      data: {
        featureId,
        triggeredFeatures: Array.from(manualHighlightTriggered.current),
      },
      source: 'GlobalGuide',
      component: 'markManualHighlight',
    });
  }, []);

  // Check if a feature has been manually triggered
  const isManualHighlighted = useCallback((featureId: string) => {
    return manualHighlightTriggered.current.has(featureId);
  }, []);

  // Get current step status
  const getStepStatus = useCallback(
    (stepNumber: GlobalGuideStepNumber): StepStatus => {
      return stepStatusMap[stepNumber] || 'pending';
    },
    [stepStatusMap],
  );

  // Handle step selection (only update state, no navigation)
  const handleStepSelect = useCallback(
    (stepNumber: GlobalGuideStepNumber) => {
      logger.info({
        message: '[GlobalGuide] Step selection - only update state',
        data: {
          stepNumber,
          previousStep: currentStep,
          stepStatusMap,
        },
        source: 'GlobalGuide',
        component: 'handleStepSelect',
      });

      updateCurrentStep(stepNumber);

      logger.info({
        message: '[GlobalGuide] Step selection completed - state updated',
        data: {
          stepNumber,
          newCurrentStep: stepNumber,
        },
        source: 'GlobalGuide',
        component: 'handleStepSelect',
      });
    },
    [updateCurrentStep, currentStep, stepStatusMap],
  );

  // Handle step click (includes navigation logic)
  const handleStepClick = useCallback(
    (stepNumber: number) => {
      logger.info({
        message: `[GlobalGuide] Step click started`,
        data: {
          stepNumber,
          currentPath: window.location.pathname,
          currentSearch: window.location.search,
          currentUrl: window.location.href,
        },
        source: 'GlobalGuide',
        component: 'handleStepClick',
      });

      const step = steps.find((s) => s.number === stepNumber);
      if (step) {
        logger.info({
          message: `[GlobalGuide] Found step configuration`,
          data: {
            stepNumber,
            stepTitle: step.title,
            stepRoute: step.route,
            routeHasParams: step.route.includes('?'),
          },
          source: 'GlobalGuide',
          component: 'handleStepClick',
        });

        updateCurrentStep(stepNumber);

        // Intelligently handle steps with URL parameters
        if (step.route.includes('?')) {
          // Parse route and parameters
          const [path, search] = step.route.split('?');

          logger.info({
            message: `[GlobalGuide] Route already contains parameters, use navigate to jump`,
            data: {
              stepNumber,
              targetRoute: step.route,
              path,
              search,
              currentUrl: window.location.href,
              navigationMode: 'navigate',
            },
            source: 'GlobalGuide',
            component: 'handleStepClick',
          });

          // Use navigate for SPA route navigation
          navigate({ pathname: path, search: `?${search}` });
        } else {
          // If route doesn't contain parameters, check if specific parameters need to be added
          const currentPath = window.location.pathname;
          const currentSearch = window.location.search;

          logger.info({
            message: `[GlobalGuide] Check if parameters need to be added`,
            data: {
              stepNumber,
              currentPath,
              currentSearch,
              targetRoute: step.route,
              isOnTargetPage: currentPath === step.route,
            },
            source: 'GlobalGuide',
            component: 'handleStepClick',
          });

          // 🔥 Fix: No longer automatically open drawer via URL parameters, only navigate to page and highlight
          // Check if currently on target page
          if (
            currentPath === step.route ||
            currentPath === step.route.split('?')[0]
          ) {
            // Already on target page, no need to navigate, only trigger frontend feature highlight
            logger.info({
              message: `[GlobalGuide] Already on target page, trigger frontend feature highlight`,
              data: {
                stepNumber,
                currentPath,
                targetRoute: step.route,
              },
              source: 'GlobalGuide',
              component: 'handleStepClick',
            });
          } else {
            // If not on target page, navigate to target route (without URL parameters)
            const baseRoute = step.route.split('?')[0];
            logger.info({
              message: `[GlobalGuide] Not on target page, navigate to route`,
              data: {
                stepNumber,
                targetRoute: baseRoute,
              },
              source: 'GlobalGuide',
              component: 'handleStepClick',
            });
            navigate(baseRoute);
          }
        }

        globalGuideTracker.trackStepView(stepNumber);

        // Delayed check of final URL state and auto trigger frontend feature highlight
        setTimeout(() => {
          logger.info({
            message: `[GlobalGuide] Step click completed (delayed check)`,
            data: {
              stepNumber,
              finalUrl: window.location.href,
              finalPath: window.location.pathname,
              finalSearch: window.location.search,
            },
            source: 'GlobalGuide',
            component: 'handleStepClick-delayed',
          });

          // Auto trigger highlight guide for first frontend feature
          // Only auto highlight first feature when no feature in this step has been manually triggered
          if (
            onAutoHighlightFeature &&
            step.frontendFeatures &&
            step.frontendFeatures.length > 0
          ) {
            const firstFeature = step.frontendFeatures[0];

            // Check if any feature in current step has been manually triggered
            const hasAnyManualHighlight = step.frontendFeatures.some(
              (feature) => isManualHighlighted(feature.id),
            );

            // Only auto highlight first feature when no feature has been manually triggered
            if (
              !hasAnyManualHighlight &&
              !isManualHighlighted(firstFeature.id)
            ) {
              logger.info({
                message:
                  '[GlobalGuide] Auto trigger frontend feature highlight',
                data: {
                  stepNumber,
                  featureId: firstFeature.id,
                  featureName: firstFeature.name,
                  selector: firstFeature.selector,
                  placement: firstFeature.placement,
                  tooltipContent: firstFeature.tooltipContent,
                  reason: 'No manually triggered feature in step',
                },
                source: 'GlobalGuide',
                component: 'handleStepClick-autoHighlight',
              });

              // Delayed trigger to ensure page has loaded
              setTimeout(() => {
                onAutoHighlightFeature?.({
                  featureId: firstFeature.id,
                  selector: firstFeature.selector,
                  tooltipContent: firstFeature.tooltipContent || '',
                  placement: firstFeature.placement,
                });
              }, 1000);
            } else {
              logger.info({
                message:
                  '[GlobalGuide] Skip auto trigger frontend feature highlight',
                data: {
                  stepNumber,
                  featureId: firstFeature.id,
                  featureName: firstFeature.name,
                  hasAnyManualHighlight,
                  reason: hasAnyManualHighlight
                    ? 'Feature in step already manually triggered'
                    : 'This feature has been manually triggered',
                },
                source: 'GlobalGuide',
                component: 'handleStepClick-autoHighlight',
              });
            }
          }
        }, 200);

        logger.info({
          message: `[GlobalGuide] Step click completed`,
          data: {
            stepNumber,
            finalUrl: window.location.href,
          },
          source: 'GlobalGuide',
          component: 'handleStepClick',
        });
      } else {
        logger.warn({
          message: `[GlobalGuide] Step configuration not found`,
          data: {
            stepNumber,
            availableSteps: steps.map((s) => ({
              number: s.number,
              title: s.title,
            })),
          },
          source: 'GlobalGuide',
          component: 'handleStepClick',
        });
      }
    },
    [
      steps,
      updateCurrentStep,
      navigate,
      isManualHighlighted,
      onAutoHighlightFeature,
    ],
  );

  // Handle step completion
  const handleStepComplete = useCallback(
    (stepNumber: GlobalGuideStepNumber) => {
      updateStepStatus(stepNumber, 'completed');
      globalGuideTracker.trackStepComplete(stepNumber);

      // No longer auto navigate, let user manually control
      // Can show a hint to inform user what the next step is
      const nextStep = steps.find((s) => s.number === stepNumber + 1);
    },
    [steps, updateStepStatus],
  );

  // Handle quick fix
  const handleQuickFix = useCallback(
    (stepNumber: number, fixType: string) => {
      globalGuideTracker.trackQuickFix({ stepNumber, fixType });

      const step = steps.find((s) => s.number === stepNumber);
      if (step) {
        navigate(step.route);
      }
    },
    [steps, navigate],
  );

  return {
    steps,
    currentStep,
    getStepStatus,
    handleStepSelect,
    handleStepClick,
    handleStepComplete,
    handleQuickFix,
    markManualHighlight,
    isManualHighlighted,
  };
};
