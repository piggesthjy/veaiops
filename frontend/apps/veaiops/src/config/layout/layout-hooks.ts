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

import { useLocation } from '@modern-js/runtime/router';
import { useEffect, useState } from 'react';
import type { LayoutState } from './types';

/**
 * 布局Hook
 */
export const useLayout = () => {
  const [layoutState, setLayoutState] = useState<LayoutState>({
    collapsed: true,
    activeModule: 'system',
  });

  const location = useLocation();

  // 根据当前路径自动设置activeModule
  useEffect(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    if (pathSegments.length > 0) {
      const module = pathSegments[0];
      setLayoutState((prev) => ({
        ...prev,
        activeModule: module,
      }));
    }
  }, [location.pathname]);

  // 切换侧边栏折叠状态
  const toggleCollapse = () => {
    setLayoutState((prev) => ({
      ...prev,
      collapsed: !prev.collapsed,
    }));
  };

  // 设置侧边栏折叠状态
  const setCollapsed = (collapsed: boolean) => {
    setLayoutState((prev) => ({
      ...prev,
      collapsed,
    }));
  };

  // 设置活动模块
  const setActiveModule = (module: string) => {
    setLayoutState((prev) => ({
      ...prev,
      activeModule: module,
    }));
  };

  return {
    ...layoutState,
    toggleCollapse,
    setCollapsed,
    setActiveModule,
  };
};
