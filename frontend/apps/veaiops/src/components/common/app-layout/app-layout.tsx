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

import { GlobalGuide } from '@/components/global-guide';
import { LayoutMain, LayoutSidebar } from '@/components/layout';
import { useLayout } from '@/config/layout';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import type React from 'react';
import type { AppLayoutProps } from './types';

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { collapsed, activeModule, setCollapsed, setActiveModule } =
    useLayout();

  // 启用键盘快捷键（在Router上下文内部）
  useKeyboardShortcuts();

  return (
    <div className="flex h-screen bg-base">
      <LayoutSidebar
        collapsed={collapsed}
        onCollapse={setCollapsed}
        activeModule={activeModule}
      />
      <LayoutMain
        collapsed={collapsed}
        activeModule={activeModule}
        onModuleChange={setActiveModule}
      >
        {children}
      </LayoutMain>

      {/* 全局引导组件 - 固定在右侧，支持智能阈值配置流程 */}
      <GlobalGuide />
    </div>
  );
};
