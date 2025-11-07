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
import { useEffect } from 'react';

import { useGlobalGuideStore } from '../lib';

/**
 * Route listener Hook
 * Listens to route changes, only records route information, does not update currentStep
 */
export const useRouteListener = () => {
  const { currentStep, sideGuidePanelVisible, updateLastVisitedRoute } =
    useGlobalGuideStore();

  // Listen to route changes, but don't automatically update currentStep
  // currentStep is completely controlled by user manual selection
  useEffect(() => {
    if (!sideGuidePanelVisible) {
      logger.info({
        message: '[GlobalGuide] Route listener skipped - side panel not open',
        data: {
          sideGuidePanelVisible,
          currentPath: window.location.pathname,
        },
        source: 'GlobalGuide',
        component: 'useRouteListener',
      });
      return;
    }

    const currentPath = window.location.pathname;

    logger.info({
      message:
        '[GlobalGuide] Route change detected - only record, do not update currentStep',
      data: {
        currentPath,
        currentStep,
        sideGuidePanelVisible,
        note: 'currentStep is completely controlled by user manual selection',
      },
      source: 'GlobalGuide',
      component: 'useRouteListener',
    });

    // Only update last visited route, don't update currentStep
    updateLastVisitedRoute(currentPath);

    logger.info({
      message:
        '[GlobalGuide] Route listener completed - only update lastVisitedRoute',
      data: {
        currentStep,
        lastVisitedRoute: currentPath,
      },
      source: 'GlobalGuide',
      component: 'useRouteListener',
    });
  }, [sideGuidePanelVisible, updateLastVisitedRoute, currentStep]);

  return {
    currentStep,
  };
};
