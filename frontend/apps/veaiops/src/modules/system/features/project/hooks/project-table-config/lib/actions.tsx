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

import { Button } from '@arco-design/web-react';
import { IconPlus, IconUpload } from '@arco-design/web-react/icon';
import type React from 'react';

/**
 * Get project table action button configuration
 */
export const getProjectTableActions = ({
  onCreate,
  onImport,
}: {
  onCreate?: () => void;
  onImport?: () => void;
}): React.ReactNode[] => {
  const actions: React.ReactNode[] = [];

  // Handle new project button click
  const handleCreateClick = (e: React.MouseEvent<HTMLElement>) => {
    console.log('[ProjectTableActions] 🆕 新建项目按钮被点击', {
      timestamp: Date.now(),
      eventType: e.type,
      defaultPrevented: e.defaultPrevented,
    });

    // ✅ Step 1: Immediately prevent all default behaviors
    e.preventDefault();
    e.stopPropagation();

    console.log('[ProjectTableActions] ✅ 已阻止默认行为', {
      timestamp: Date.now(),
      defaultPrevented: e.defaultPrevented,
    });

    // ✅ Step 2: Execute callback in next event loop to avoid potential side effects from synchronous execution
    setTimeout(() => {
      console.log('[ProjectTableActions] 📞 调用 onCreate 回调', {
        timestamp: Date.now(),
      });
      onCreate?.();
    }, 0);
  };

  // Handle import project button click
  const handleImportClick = (e: React.MouseEvent<HTMLElement>) => {
    console.log('[ProjectTableActions] 📥 导入项目按钮被点击', {
      timestamp: Date.now(),
      eventType: e.type,
      defaultPrevented: e.defaultPrevented,
    });

    // ✅ Step 1: Immediately prevent all default behaviors
    e.preventDefault();
    e.stopPropagation();

    console.log('[ProjectTableActions] ✅ 已阻止默认行为', {
      timestamp: Date.now(),
      defaultPrevented: e.defaultPrevented,
    });

    // ✅ Step 2: Execute callback in next event loop to avoid potential side effects from synchronous execution
    setTimeout(() => {
      console.log('[ProjectTableActions] 📞 调用 onImport 回调', {
        timestamp: Date.now(),
      });
      onImport?.();
    }, 0);
  };

  if (onCreate) {
    actions.push(
      <Button
        key="create"
        type="primary"
        htmlType="button"
        icon={<IconPlus />}
        onClick={handleCreateClick}
        data-testid="new-project-btn"
      >
        新建项目
      </Button>,
    );
  }

  if (onImport) {
    actions.push(
      <Button
        key="import"
        htmlType="button"
        icon={<IconUpload />}
        onClick={handleImportClick}
        data-testid="import-project-btn"
      >
        导入项目
      </Button>,
    );
  }

  return actions;
};
