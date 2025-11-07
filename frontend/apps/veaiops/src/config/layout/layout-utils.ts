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

import { layoutConfig, moduleConfig } from './layout-config';

/**
 * 布局工具函数
 */
export const layoutUtils = {
  // 获取模块默认路径
  getModuleDefaultPath: (module: string): string => {
    return (
      moduleConfig.defaultPaths[
        module as keyof typeof moduleConfig.defaultPaths
      ] || '/'
    );
  },

  // 检查是否为活动模块
  isActiveModule: (currentPath: string, module: string): boolean => {
    return currentPath.startsWith(`/${module}`);
  },

  // 获取侧边栏宽度类名
  getSidebarWidthClass: (collapsed: boolean): string => {
    return collapsed
      ? layoutConfig.sidebar.collapsedWidth
      : layoutConfig.sidebar.expandedWidth;
  },

  // 获取主内容边距类名
  getMainMarginClass: (collapsed: boolean): string => {
    return collapsed ? 'ml-16' : 'ml-60';
  },
};
