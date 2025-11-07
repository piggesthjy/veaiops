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
import { useCallback, useState } from 'react';

import { globalGuideTracker, useGlobalGuideStore } from '../lib';

/**
 * Panel state management Hook
 * Handles show/hide state of side panel and detail panel
 */
export const usePanelState = () => {
  const {
    sideGuidePanelVisible,
    panelContentVisible,
    setSideGuidePanelVisible,
    setPanelContentVisible,
  } = useGlobalGuideStore();

  const [hintCardVisible, setHintCardVisible] = useState(false);

  // Close side guide panel
  const handleCloseSidePanel = useCallback(() => {
    logger.info({
      message: '[GlobalGuide] Close side guide panel',
      data: {
        previousState: sideGuidePanelVisible,
      },
      source: 'GlobalGuide',
      component: 'handleCloseSidePanel',
    });

    setSideGuidePanelVisible(false);
    globalGuideTracker.trackGuideClose();

    logger.info({
      message: '[GlobalGuide] Side guide panel closed',
      data: {
        newState: false,
      },
      source: 'GlobalGuide',
      component: 'handleCloseSidePanel',
    });
  }, [setSideGuidePanelVisible, sideGuidePanelVisible]);

  // Open side guide panel
  const handleOpenSidePanel = useCallback(() => {
    logger.info({
      message: '[GlobalGuide] Open side guide panel',
      data: {
        previousState: sideGuidePanelVisible,
      },
      source: 'GlobalGuide',
      component: 'handleOpenSidePanel',
    });

    setSideGuidePanelVisible(true);
    globalGuideTracker.trackGuideOpen();

    logger.info({
      message: '[GlobalGuide] Side guide panel opened',
      data: {
        newState: true,
      },
      source: 'GlobalGuide',
      component: 'handleOpenSidePanel',
    });
  }, [setSideGuidePanelVisible, sideGuidePanelVisible]);

  // Close detail panel content
  const handleClosePanelContent = useCallback(() => {
    logger.info({
      message: '[GlobalGuide] Close detail panel content',
      data: {
        previousState: panelContentVisible,
      },
      source: 'GlobalGuide',
      component: 'handleClosePanelContent',
    });

    setPanelContentVisible(false);

    logger.info({
      message: '[GlobalGuide] Detail panel content closed',
      data: {
        newState: false,
      },
      source: 'GlobalGuide',
      component: 'handleClosePanelContent',
    });
  }, [setPanelContentVisible, panelContentVisible]);

  // Open detail panel content
  const handleOpenPanelContent = useCallback(() => {
    logger.info({
      message: '[GlobalGuide] Open detail panel content',
      data: {
        previousState: panelContentVisible,
      },
      source: 'GlobalGuide',
      component: 'handleOpenPanelContent',
    });

    setPanelContentVisible(true);

    logger.info({
      message: '[GlobalGuide] Detail panel content opened',
      data: {
        newState: true,
      },
      source: 'GlobalGuide',
      component: 'handleOpenPanelContent',
    });
  }, [setPanelContentVisible, panelContentVisible]);

  return {
    sideGuidePanelVisible,
    panelContentVisible,
    hintCardVisible,
    setHintCardVisible,
    handleCloseSidePanel,
    handleOpenSidePanel,
    handleClosePanelContent,
    handleOpenPanelContent,
  };
};
